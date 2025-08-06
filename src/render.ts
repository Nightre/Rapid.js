import { ICircleRenderOptions, IGraphicRenderOptions, ILayerRenderOptions, IRapidOptions, IRectRenderOptions, IRenderLineOptions, ISpriteRenderOptions, ShaderType as ShaderType, ITransformOptions, MaskType, WebGLContext, BlendMode, ILightRenderOptions, IParticleOptions, ICameraOptions, IPolygonGraphicRenderOptions, ScaleRadio } from "./interface"
import { LightManager } from "./light"
import { getLineGeometry } from "./line"
import { Color, MatrixStack, Vec2 } from "./math"
import GraphicRegion from "./regions/graphic_region"
import RenderRegion from "./regions/region"
import SpriteRegion from "./regions/sprite_region"
import { FrameBufferObject, Texture, TextureCache } from "./texture"
import { TileMapRender, TileSet } from "./tilemap"
import GLShader from "./webgl/glshader"
import { getContext } from "./webgl/utils"
import { ParticleEmitter } from "./particle"

/**
 * The `Rapid` class provides a WebGL-based rendering engine. 
 */
class Rapid {
    gl: WebGLContext
    canvas: HTMLCanvasElement
    projection!: Float32Array
    projectionDirty: boolean = true

    matrixStack = new MatrixStack()
    textures: TextureCache
    tileMap = new TileMapRender(this)
    light = new LightManager(this)

    width: number
    height: number

    backgroundColor: Color
    devicePixelRatio: number

    private physicsWidth!: number
    private physicsHeight!: number

    private logicWidth!: number
    private logicHeight!: number

    private scaleEnable: boolean;
    private scaleRadio: ScaleRadio;

    readonly maxTextureUnits: number
    private readonly defaultColor = new Color(255, 255, 255, 255)
    //    private readonly defaultColorBlack = new Color(0, 0, 0, 255)

    private currentRegion?: RenderRegion
    private currentRegionName?: string
    private regions: Map<string, RenderRegion> = new Map
    private currentMaskType: MaskType[] = []
    private currentTransform: ITransformOptions[] = []
    private currentFBO: FrameBufferObject[] = []
    private lastTime: number = 0
    /**
     * Constructs a new `Rapid` instance with the given options.
     * @param options - Options for initializing the `Rapid` instance.
     */
    constructor(options: IRapidOptions) {
        const gl = getContext(options.canvas)
        this.gl = gl
        this.canvas = options.canvas
        this.textures = new TextureCache(this, options.antialias ?? false)
        this.maxTextureUnits = gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);

        this.width = options.width || this.canvas.width
        this.height = options.height || this.canvas.height

        this.scaleEnable = options.scaleEnable ?? false
        this.scaleRadio = options.scaleRadio || ScaleRadio.KEEP

        this.devicePixelRatio = options.devicePixelRatio ?? window.devicePixelRatio ?? 1
        this.backgroundColor = options.backgroundColor || new Color(255, 255, 255, 255)
        this.registerBuildInRegion()
        this.initWebgl(gl)
        this.updateDisplaySize(this.width, this.height);
        this.projectionDirty = false
        this.canvas.style.display = 'block'
    }

    /**
     * @param displayWdith css px size
     * @param displayHeight css px size
     */
    updateDisplaySize(displayWdith: number, displayHeight: number) {
        const designW = this.width;
        const designH = this.height;

        let logicW: number;
        let logicH: number;
        let physicsW: number;
        let physicsH: number;

        if (this.scaleEnable) {
            const designAspect = designW / designH;
            const windowAspect = displayWdith / displayHeight;

            switch (this.scaleRadio) {
                case ScaleRadio.IGNORE:
                    logicW = designW;
                    logicH = designH;
                    physicsW = displayWdith * this.devicePixelRatio;
                    physicsH = displayHeight * this.devicePixelRatio;
                    break;

                case ScaleRadio.KEEP:
                    logicW = designW;
                    logicH = designH;

                    let targetW: number;
                    let targetH: number;

                    if (windowAspect > designAspect) {
                        targetH = displayHeight;
                        targetW = targetH * designAspect;
                    } else {
                        targetW = displayWdith;
                        targetH = targetW / designAspect;
                    }

                    physicsW = targetW * this.devicePixelRatio;
                    physicsH = targetH * this.devicePixelRatio;
                    break;

                case ScaleRadio.EXPAND:
                    if (windowAspect > designAspect) {
                        logicH = designH;
                        logicW = designH * windowAspect;
                    } else {
                        logicW = designW;
                        logicH = designW / windowAspect;
                    }
                    physicsW = displayWdith * this.devicePixelRatio;
                    physicsH = displayHeight * this.devicePixelRatio;
                    break;

                case ScaleRadio.KEEP_W:
                    logicW = designW;
                    logicH = designW / windowAspect;
                    physicsW = displayWdith * this.devicePixelRatio;
                    physicsH = displayHeight * this.devicePixelRatio;
                    break;

                case ScaleRadio.KEEP_H:
                    logicH = designH;
                    logicW = designH * windowAspect;
                    physicsW = displayWdith * this.devicePixelRatio;
                    physicsH = displayHeight * this.devicePixelRatio;
                    break;

                default:
                    logicW = designW;
                    logicH = designH;
                    physicsW = displayWdith * this.devicePixelRatio;
                    physicsH = displayHeight * this.devicePixelRatio;
                    break;
            }

        } else {
            logicW = designW;
            logicH = designH;
            physicsW = designW * this.devicePixelRatio;
            physicsH = designH * this.devicePixelRatio;
        }

        this.logicWidth = logicW;
        this.logicHeight = logicH;
        this.physicsWidth = physicsW;
        this.physicsHeight = physicsH;

        this.resizeSize(logicW, logicH, physicsW, physicsH, true);
    }

    private resizeSize(logicW: number, logicH: number, physicsW: number, physicsH: number, updateCanvas = false) {
        this.updateProjection(0, logicW, logicH, 0)
        this.gl.viewport(0, 0, physicsW, physicsH)
        this.gl.scissor(0, 0, physicsW, physicsH)

        if (updateCanvas) {
            // canvas 像素大小
            this.canvas.width = physicsW
            this.canvas.height = physicsH

            // canvas 大小
            this.canvas.style.width = physicsW / this.devicePixelRatio + 'px'
            this.canvas.style.height = physicsH / this.devicePixelRatio + 'px'
        }
    }

    private updateProjection(left: number, right: number, bottom: number, top: number) {
        this.projection = this.createOrthMatrix(left, right, bottom, top)
        this.projectionDirty = true
    }

    /**
     * Initializes WebGL context settings.
     * @param gl - The WebGL context.
     */
    private initWebgl(gl: WebGLContext) {
        //this.resize(this.width, this.height)
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.STENCIL_TEST);
        gl.enable(gl.SCISSOR_TEST);
    }
    /**
     * @ignore
     */
    clearTextureUnit() {
        for (let i = 0; i < this.maxTextureUnits; i++) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }
    }
    /**
     * Registers built-in regions such as sprite and graphic regions.
     */
    private registerBuildInRegion() {
        this.registerRegion("sprite", SpriteRegion)
        this.registerRegion("graphic", GraphicRegion)
    }

    /**
     * Registers a custom render region with a specified name.
     * @param name - The name of the region.
     * @param regionClass - The class of the region to register.
     */
    registerRegion(name: string, regionClass: typeof RenderRegion) {
        this.regions.set(name, new regionClass(this))
    }
    private quitCurrentRegion() {
        if (this.currentRegion && this.currentRegion.hasPendingContent()) {
            this.currentRegion.render();
            this.currentRegion.exitRegion();
        }
    }
    /**
     * Sets the current render region by name and optionally a custom shader.
     * @param regionName - The name of the region to set as current.
     * @param customShader - An optional custom shader to use with the region.
     * @param hasUnifrom - have costum unifrom
     */
    setRegion(regionName: string, customShader?: GLShader) {
        if (
            // isRegionChanged
            regionName != this.currentRegionName ||
            // isShaderChanged
            (this.currentRegion && this.currentRegion.isShaderChanged(customShader))
        ) {
            const region = this.regions.get(regionName)!;
            this.quitCurrentRegion()
            this.currentRegion = region;
            this.currentRegionName = regionName
            region.enterRegion(customShader);
        }
    }

    /**
     * Saves the current matrix state to the stack.
     */
    save() {
        this.matrixStack.pushMat()
    }

    /**
     * Restores the matrix state from the stack.
     */
    restore() {
        this.matrixStack.popMat()
    }

    /**
     * Executes a callback function within a saved and restored matrix state scope.
     * @param cb - The callback function to execute within the saved and restored matrix state scope.
     */
    withTransform(cb: () => void) {
        this.save()
        cb()
        this.restore()
    }

    /**
     * Starts the rendering process, resetting the matrix stack and clearing the current region.
     * @param clear - Whether to clear the matrix stack. Defaults to true.
     */
    startRender(clear: boolean = true) {
        this.clear()
        clear && this.matrixStack.clear()
        this.matrixStack.pushIdentity()
        this.currentRegion = undefined
        this.currentRegionName = undefined

        const now = performance.now();
        const dt = this.lastTime ? (now - this.lastTime) / 1000 : 0;
        this.lastTime = now;
        return dt
    }

    /**
     * Ends the rendering process by rendering the current region.
     */
    endRender() {
        this.currentRegion?.render()
        this.projectionDirty = false
    }
    /**
     * Render
     * @param cb - The function to render.
     */
    render(cb: (dt: number) => void) {
        const dt = this.startRender()
        cb(dt)
        this.endRender()
    }

    /**
     * Render a tile map layer.
     * @param data - The map data to render.
     * @param options - The options for rendering the tile map layer.
     */
    renderTileMapLayer(data: (number | string)[][], options: ILayerRenderOptions | TileSet): void {
        this.tileMap.renderLayer(data, options instanceof TileSet ? { tileSet: options } : options)
    }

    applyCameraTransform(options: ICameraOptions) {
        this.withTransform(() => {
            if (options.center) {
                const centerdPosition = new Vec2(this.logicWidth, this.logicHeight).divide(2)
                this.matrixStack.translate(centerdPosition)
            }
            this.matrixStack.applyTransform(options)
            this.matrixStack.setTransform(this.matrixStack.getInverse())
        })
    }

    /**
     * Renders a sprite with the specified options.
     * 
     * @param options - The rendering options for the sprite, including texture, position, color, and shader.
     */
    renderSprite(options: ISpriteRenderOptions): void {
        const texture = options.texture
        if (!texture || !texture.base) return

        const { offsetX, offsetY } = this.startDraw(options, texture.width, texture.height)
        this.setRegion("sprite", options.shader);

        (this.currentRegion as SpriteRegion).renderSprite(
            texture.base.texture,
            texture.width,
            texture.height,
            texture.clipX,
            texture.clipY,
            texture.clipW,
            texture.clipH,
            offsetX,
            offsetY,
            (options.color || this.defaultColor).uint32,
            options.uniforms,
            options.flipX,
            options.flipY
        )

        this.afterDraw()
    }

    renderParticles(particleEmitter: ParticleEmitter) {
        if (particleEmitter.localSpace) {
            this.startDraw(particleEmitter.getTransform())
            particleEmitter.render();
            this.afterDraw()
        } else {
            particleEmitter.render();
        }
    }

    /**
     * Renders a texture directly without additional options.
     * This is a convenience method that calls renderSprite with just the texture.
     * 
     * @param texture - The texture to render at the current transformation position.
     */
    renderTexture(texture: Texture): void {
        if (!texture.base) return
        this.renderSprite({ texture })
    }

    /**
     * Renders a line with the specified options.
     * 
     * @param options - The options for rendering the line, including points, color, width, and join/cap types.
     */
    renderLine(options: IRenderLineOptions): void {
        const linePoints = options.closed ? [...options.points, options.points[0]] : options.points;
        const { vertices, uv } = getLineGeometry({ ...options, points: linePoints })!;
        this.renderGraphic({ ...options, drawType: this.gl.TRIANGLES, points: vertices, uv });
    }

    /**
     * Renders graphics based on the provided options.
     * 
     * @param options - The options for rendering the graphic, including points, color, texture, and draw type.
     */
    renderGraphic(options: IPolygonGraphicRenderOptions): void {
        this.startGraphicDraw(options)
        options.points.forEach((vec, index) => {
            const color = Array.isArray(options.color) ? options.color[index] : options.color
            const uv = options.uv?.[index] as Vec2
            this.addGraphicVertex(vec.x, vec.y, uv, color)
        });
        this.endGraphicDraw()
    }
    /**
     * Starts the graphic drawing process.
     * 
     * @param options - The options for the graphic drawing, including shader, texture, and draw type.
     */
    startGraphicDraw(options: IGraphicRenderOptions) {
        const { offsetX, offsetY } = this.startDraw(options)
        this.setRegion("graphic", options.shader)
        const currentRegion = this.currentRegion as GraphicRegion
        currentRegion.startRender(offsetX, offsetY, options.texture, options.uniforms)
        if (options.drawType) {
            currentRegion.drawType = options.drawType;
        }
    }

    /**
     * Adds a vertex to the current graphic being drawn.
     * 
     * @param offsetX - The X coordinate of the vertex.
     * @param offsetY - The Y coordinate of the vertex.
     * @param uv - The texture UV coordinates for the vertex.
     * @param color - The color of the vertex. Defaults to the renderer's default color.
     */
    addGraphicVertex(offsetX: number, offsetY: number, uv: Vec2, color?: Color): void {
        const currentRegion = this.currentRegion as GraphicRegion
        currentRegion.addVertex(offsetX, offsetY, uv?.x, uv?.y, (color || this.defaultColor).uint32);
    }

    /**
     * Completes the graphic drawing process and renders the result.
     */
    endGraphicDraw() {
        const currentRegion = this.currentRegion as GraphicRegion
        currentRegion.render()

        this.afterDraw()
    }

    private startDraw(options: ITransformOptions, width: number = 0, height: number = 0) {
        this.currentTransform.push(options)
        return this.matrixStack.applyTransform(options, width, height)
    }

    private afterDraw() {
        if (this.currentTransform.length > 0) {
            this.matrixStack.applyTransformAfter(this.currentTransform.pop()!)
        }
    }

    /**
     * Renders a rectangle with the specified options.
     * 
     * @param options - The options for rendering the rectangle, including width, height, position, and color.
     */
    renderRect(options: IRectRenderOptions): void {
        const { width, height } = options
        const points = [
            new Vec2(0, 0),
            new Vec2(width, 0),
            new Vec2(width, height),
            new Vec2(0, height)
        ];
        this.renderGraphic({ ...options, points, drawType: this.gl.TRIANGLE_FAN });
    }

    /**
     * Renders a circle with the specified options.
     * 
     * @param options - The options for rendering the circle, including radius, position, color, and segment count.
     */
    renderCircle(options: ICircleRenderOptions): void {
        const segments = options.segments || 32
        const radius = options.radius
        const color = options.color || this.defaultColor

        const points: Vec2[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new Vec2(x, y));
        }
        this.renderGraphic({ ...options, points, color, drawType: this.gl.TRIANGLE_FAN });
    }

    /**
     * Clears the canvas with the background color.
     * @param bgColor - The background color to clear the canvas with.
     */
    clear(bgColor?: Color) {
        const gl = this.gl
        const c = bgColor || this.backgroundColor
        gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.clearMask()
    }

    /**
     * Creates an orthogonal projection matrix.
     * @param left - The left bound of the projection.
     * @param right - The right bound of the projection.
     * @param bottom - The bottom bound of the projection.
     * @param top - The top bound of the projection.
     * @returns The orthogonal projection matrix as a `Float32Array`.
     */
    private createOrthMatrix(left: number, right: number, bottom: number, top: number): Float32Array {
        return new Float32Array([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -1, 0,
            -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
        ]);
    }

    /**
     * Draw a mask. Automatically calls startDrawMask.
     * @param type - The type of mask to draw.
     * @param cb - The callback function to execute.
     */
    drawMask(type: MaskType = MaskType.Include, cb: () => void) {
        this.startDrawMask(type)
        cb()
        this.endDrawMask()
    }
    /**
     * Start drawing a mask using the stencil buffer.
     * This method configures the WebGL context to begin defining a mask area.
     */
    startDrawMask(type: MaskType = MaskType.Include) {
        const gl = this.gl;
        this.currentMaskType.push(type);
        this.setMaskType(type, true);

        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.colorMask(false, false, false, false);
    }

    /**
     * End the mask drawing process.
     * This method configures the WebGL context to use the defined mask for subsequent rendering.
     */
    endDrawMask() {
        const gl = this.gl;
        this.quitCurrentRegion();

        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        gl.colorMask(true, true, true, true);
        this.setMaskType(this.currentMaskType.pop() ?? MaskType.Include, false);
    }

    /**
     * Set the mask type for rendering
     * @param type - The mask type to apply
     * @param start - Whether this is the start of mask drawing
     */
    private setMaskType(type: MaskType, start: boolean = false) {
        const gl = this.gl;
        this.quitCurrentRegion();
        if (start) {
            this.clearMask();
            gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        } else {
            switch (type) {
                case MaskType.Include:
                    gl.stencilFunc(gl.EQUAL, 1, 0xFF);
                    break;
                case MaskType.Exclude:
                    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
                    break;
            }
        }
    }

    /**
     * Clear the current mask by clearing the stencil buffer.
     * This effectively removes any previously defined mask.
     */
    clearMask() {
        const gl = this.gl;
        this.quitCurrentRegion();
        gl.clearStencil(0);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    }

    /**
     * Creates a custom shader.
     * @param vs - Vertex shader code.
     * @param fs - Fragment shader code.
     * @param type - Shader type.
     * @returns The created shader object.
     */
    createCostumShader(vs: string, fs: string, type: ShaderType, textureUnitNum: number = 0) {
        return GLShader.createCostumShader(this, vs, fs, type, textureUnitNum)
    }
    /**
     * Starts rendering to a Frame Buffer Object (FBO)
     * Sets up the FBO for rendering by binding it, adjusting viewport size and projection
     * @param fbo - The Frame Buffer Object to render to
     */
    startFBO(fbo: FrameBufferObject) {
        this.quitCurrentRegion()

        fbo.bind()
        this.clearTextureUnit()

        this.resizeSize(fbo.width, fbo.height, fbo.width, fbo.height)
        this.updateProjection(0, fbo.width, 0, fbo.height)
        this.save()
        this.matrixStack.identity()
        this.currentFBO.push(fbo)
    }

    /**
     * Ends rendering to a Frame Buffer Object
     * Restores the default framebuffer and original viewport settings
     * @param fbo - The Frame Buffer Object to unbind
     */
    endFBO() {
        if (this.currentFBO.length > 0) {
            const fbo = this.currentFBO.pop()!
            this.quitCurrentRegion()
            fbo.unbind()
            this.clearTextureUnit()

            this.resizeSize(
                this.logicWidth, this.logicHeight,
                this.physicsWidth, this.physicsHeight
            )
            //this.updateProjection(0, this.width, this.height, 0)
            this.restore()
        }
    }

    /**
     * Convenience method to render to a Frame Buffer Object
     * Handles starting and ending the FBO rendering automatically
     * @param fbo - The Frame Buffer Object to render to
     * @param cb - Callback function containing render commands to execute on the FBO
     */
    drawToFBO(fbo: FrameBufferObject, cb: () => void) {
        this.startFBO(fbo)
        cb()
        this.endFBO()
    }
    /**
     * Set the blend mode for rendering
     * @param mode - The blend mode to apply
     */
    setBlendMode(mode: BlendMode) {
        switch (mode) {
            case BlendMode.Additive:
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
                break;
            case BlendMode.Subtractive:
                this.gl.blendFunc(this.gl.ZERO, this.gl.ONE_MINUS_SRC_COLOR);
                break;
            case BlendMode.Mix:
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                break;
            default:
                break;
        }
    }
    /**
     * Render light shadow
     * @param occlusion - The occlusion polygon
     * @param lightSource - The light source position
     */
    drawLightShadowMask(options: ILightRenderOptions) {
        this.startDrawMask(options.type || MaskType.Exclude)
        const shadowPolygon = this.light.createLightShadowMaskPolygon(options.occlusion, options.lightSource, options.baseProjectionLength)
        shadowPolygon.forEach(polygon => {
            this.renderGraphic({
                points: polygon,
                color: Color.Black,
            })
        })
        this.endDrawMask()
    }

    createParticleEmitter(options: IParticleOptions): ParticleEmitter {
        const emitter = new ParticleEmitter(this, options);
        return emitter;
    }
}

export default Rapid
