import { IGraphicOptions, IRapiadOptions, IRenderLineOptions, IRenderSpriteOptions, WebGLContext } from "./interface"
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
    private readonly defaultColorBlack = new Color(0, 0, 0, 255)

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
            if (this.currentRegion) {
                this.currentRegion.render();
                this.currentRegion.exitRegion();
            }

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
        this.startGraphicDraw();
        if (options.drawType) {
            (this.currentRegion as GraphicRegion).drawType = options.drawType;
        }
        options.points.forEach(vec => {
            this.addGraphicVertex(vec.x + offsetX, vec.y + offsetY, options.color || this.defaultColorBlack);
        });
        this.endGraphicDraw();
    }
    /**
     * Starts a graphic drawing process with an optional custom shader.
     * @param customShader - An optional custom shader to use.
     */
    startGraphicDraw(customShader?: GLShader) {
        this.setRegion("graphic", customShader);
        (this.currentRegion as GraphicRegion).startRender()
    }

    /**
     * Adds a vertex to the current graphic drawing with a specified position and color.
     * @param x - The X position of the vertex.
     * @param y - The Y position of the vertex.
     * @param color - The color of the vertex.
     */
    addGraphicVertex(x: number | Vec2, y?: number | Color, color?: Color): void {
        if (x instanceof Vec2) {
            return this.addGraphicVertex(x.x, x.y, y as Color)
        }
        (this.currentRegion as GraphicRegion).addVertex(x, y as number, color!.uint32)
    }

    /**
     * Ends the graphic drawing process by rendering the current graphic region.
     */
    endGraphicDraw() {
        (this.currentRegion as GraphicRegion).render()
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
}

export default Rapid
