import { IGraphicOptions, IRapiadOptions, IRenderLineOptions, IRenderSpriteOptions, MaskType, WebGLContext } from "./interface"
import { getStrokeGeometry } from "./line"
import { Color, MatrixStack, Vec2 } from "./math"
import GraphicRegion from "./regions/graphic_region"
import RenderRegion from "./regions/region"
import SpriteRegion from "./regions/sprite_region"
import { Texture, TextureCache } from "./texture"
import GLShader from "./webgl/glshader"
import { getContext } from "./webgl/utils"

/**
 * The `Rapid` class provides a WebGL-based rendering engine. 
 */
class Rapid {
    gl: WebGLContext
    canvas: HTMLCanvasElement
    projection!: Float32Array
    projectionDirty: boolean = true

    matrixStack = new MatrixStack()
    textures = new TextureCache(this)
    width: number
    height: number

    backgroundColor: Color
    readonly devicePixelRatio = window.devicePixelRatio || 1
    readonly maxTextureUnits: number
    private readonly defaultColor = new Color(255, 255, 255, 255)
    //    private readonly defaultColorBlack = new Color(0, 0, 0, 255)

    private currentRegion?: RenderRegion
    private currentRegionName?: string
    private regions: Map<string, RenderRegion> = new Map
    /**
     * Constructs a new `Rapid` instance with the given options.
     * @param options - Options for initializing the `Rapid` instance.
     */
    constructor(options: IRapiadOptions) {
        const gl = getContext(options.canvas)
        this.gl = gl
        this.canvas = options.canvas
        this.maxTextureUnits = gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);

        this.width = options.width || this.canvas.width
        this.height = options.width || this.canvas.height

        this.backgroundColor = options.backgroundColor || new Color(255, 255, 255, 255)
        this.registerBuildInRegion()
        this.initWebgl(gl)
    }

    /**
     * Initializes WebGL context settings.
     * @param gl - The WebGL context.
     */
    private initWebgl(gl: WebGLContext) {
        this.resize(this.width, this.height)
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.STENCIL_TEST);
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
     */
    setRegion(regionName: string, customShader?: GLShader) {
        if (
            // isRegionChanged
            regionName != this.currentRegionName ||
            // isShaderChanged
            (customShader && customShader !== this.currentRegion!.currentShader)
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
     * Starts the rendering process, resetting the matrix stack and clearing the current region.
     * @param clear - Whether to clear the matrix stack. Defaults to true.
     */
    startRender(clear: boolean = true) {
        this.clear()
        clear && this.matrixStack.clear()
        this.matrixStack.pushIdentity()
        this.currentRegion = undefined
        this.currentRegionName = undefined
    }

    /**
     * Ends the rendering process by rendering the current region.
     */
    endRender() {
        this.currentRegion?.render()
        this.projectionDirty = false
    }

    /**
     * Renders a sprite with the specified texture, offset, and options.
     * @param texture - The texture to render.
     * @param offsetX - The X offset for the sprite. Defaults to 0.
     * @param offsetY - The Y offset for the sprite. Defaults to 0.
     * @param options - Rendering options including color and custom shader.
     */
    renderSprite(texture: Texture, offsetX: number = 0, offsetY: number = 0, options?: IRenderSpriteOptions | Color): void {
        if (!texture.base) return
        if (options instanceof Color) {
            return this.renderSprite(texture, offsetX, offsetY, { color: options })
        }
        this.setRegion("sprite", options?.shader);
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
            (options?.color || this.defaultColor).uint32,
            options?.uniforms
        )
    }

    /**
     * Renders a line with the specified options.
     * 
     * @param offsetX - The X offset to apply when rendering the line. Defaults to 0.
     * @param offsetY - The Y offset to apply when rendering the line. Defaults to 0.
     * @param options - The options for rendering the line, including points and color.
     */
    renderLine(offsetX: number = 0, offsetY: number = 0, options: IRenderLineOptions): void {
        const points = getStrokeGeometry(options.points, options);
        this.renderGraphic(offsetX, offsetY, { color: options.color, drawType: this.gl.TRIANGLES, points });
    }

    /**
     * Renders graphics based on the provided options or array of Vec2 points.
     * 
     * @param offsetX - The X offset to apply when rendering the graphics. Defaults to 0.
     * @param offsetY - The Y offset to apply when rendering the graphics. Defaults to 0.
     * @param options - Either an object containing graphic options or an array of Vec2 points.
     * 
     * @remarks
     * If `options` is an array of `Vec2`, it will be converted to an object with `points` property.
     * If `options` is an object, it should contain `points` (array of `Vec2`) and optionally `color` and `drawType`.
     */
    renderGraphic(offsetX: number = 0, offsetY: number = 0, options: IGraphicOptions | Vec2[]): void {
        if (options instanceof Array) {
            return this.renderGraphic(offsetX, offsetY, { points: options });
        }
        this.setRegion("graphic", options.shader);
        const currentRegion = this.currentRegion as GraphicRegion

        currentRegion.startRender(options.texture)

        if (options.drawType) {
            currentRegion.drawType = options.drawType;
        }
        options.points.forEach((vec, index) => {
            const color = options.color instanceof Array ? options.color[index] : options.color
            const uv = options.uv?.[index] as Vec2

            currentRegion.addVertex(vec.x + offsetX, vec.y + offsetY, uv?.x, uv?.y, (color || this.defaultColor).uint32);
        });
        currentRegion.render()
    }

    /**
     * Renders a rectangle
     * @param offsetX - The X coordinate of the top-left corner of the rectangle
     * @param offsetY - The Y coordinate of the top-left corner of the rectangle
     * @param width - The width of the rectangle
     * @param height - The height of the rectangle
     * @param color - The color of the rectangle
     */
    renderRect(offsetX: number, offsetY: number, width: number, height: number, color: Color = this.defaultColor): void {
        const points = [
            new Vec2(0, 0),
            new Vec2(width, 0),
            new Vec2(width, height),
            new Vec2(0, height)
        ];
        this.renderGraphic(offsetX, offsetY, { points, color, drawType: this.gl.TRIANGLE_FAN });
    }

    /**
     * Renders a circle
     * @param offsetX - The X coordinate of the circle's center
     * @param offsetY - The Y coordinate of the circle's center
     * @param radius - The radius of the circle
     * @param color - The color of the circle
     * @param segments - The number of segments to use when rendering the circle, default is 32
     */
    renderCircle(offsetX: number, offsetY: number, radius: number, color: Color = this.defaultColor, segments: number = 32): void {
        const points: Vec2[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new Vec2(x, y));
        }
        this.renderGraphic(offsetX, offsetY, { points, color, drawType: this.gl.TRIANGLE_FAN });
    }

    /**
     * Resizes the canvas and updates the viewport and projection matrix.
     * @param width - The new width of the canvas.
     * @param height - The new height of the canvas.
     */
    resize(width: number, height: number) {
        this.width = width
        this.height = height
        const cvsWidth = width * this.devicePixelRatio
        const cvsHeight = height * this.devicePixelRatio
        this.canvas.width = cvsWidth
        this.canvas.height = cvsHeight
        this.gl.viewport(
            0, 0, cvsWidth, cvsHeight
        )
        this.projection = this.createOrthMatrix(
            0, width, height, 0
        )
        this.projectionDirty = true
    }

    /**
     * Clears the canvas with the background color.
     */
    clear() {
        const gl = this.gl
        const c = this.backgroundColor
        gl.clearColor(c.r, c.g, c.b, c.a);
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
     * Transforms a point by applying the current matrix stack.
     * @param x - The X coordinate of the point.
     * @param y - The Y coordinate of the point.
     * @returns The transformed point as an array `[newX, newY]`.
     */
    transformPoint(x: number, y: number) {
        return this.matrixStack.apply(x, y)
    }
    /**
     * Starts drawing a mask using the stencil buffer.
     * This method sets up the WebGL context to begin defining a mask area.
     */
    startDrawMask() {
        const gl = this.gl;
        this.quitCurrentRegion()
        gl.clearStencil(0);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.colorMask(false, false, false, false);
    }

    /**
     * Ends the mask drawing process.
     * This method configures the WebGL context to use the defined mask for subsequent rendering.
     */
    endDrawMask(type = MaskType.Normal) {
        const gl = this.gl;
        this.quitCurrentRegion()
        this.setMaskType(type)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        gl.colorMask(true, true, true, true);
    }

    /**
     * Sets the mask type for rendering
     * @param type - The type of mask to apply
     */
    setMaskType(type: MaskType) {
        const gl = this.gl;
        this.quitCurrentRegion();

        switch (type) {
            case MaskType.Normal:
                gl.stencilFunc(gl.EQUAL, 1, 0xFF);
                break;
            case MaskType.Inverse:
                gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
                break;
        }
    }
    /**
     * Clears the current mask by clearing the stencil buffer.
     * This effectively removes any previously defined mask.
     */
    clearMask() {
        const gl = this.gl;
        gl.clear(gl.STENCIL_BUFFER_BIT);
    }
}

export default Rapid
