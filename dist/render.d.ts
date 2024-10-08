import { IGraphicOptions, IRapiadOptions, IRenderLineOptions, IRenderSpriteOptions, MaskType, WebGLContext } from "./interface";
import { Color, MatrixStack, Vec2 } from "./math";
import RenderRegion from "./regions/region";
import { Texture, TextureCache } from "./texture";
import GLShader from "./webgl/glshader";
/**
 * The `Rapid` class provides a WebGL-based rendering engine.
 */
declare class Rapid {
    gl: WebGLContext;
    canvas: HTMLCanvasElement;
    projection: Float32Array;
    projectionDirty: boolean;
    matrixStack: MatrixStack;
    textures: TextureCache;
    width: number;
    height: number;
    backgroundColor: Color;
    readonly devicePixelRatio: number;
    readonly maxTextureUnits: number;
    private readonly defaultColor;
    private currentRegion?;
    private currentRegionName?;
    private regions;
    /**
     * Constructs a new `Rapid` instance with the given options.
     * @param options - Options for initializing the `Rapid` instance.
     */
    constructor(options: IRapiadOptions);
    /**
     * Initializes WebGL context settings.
     * @param gl - The WebGL context.
     */
    private initWebgl;
    /**
     * Registers built-in regions such as sprite and graphic regions.
     */
    private registerBuildInRegion;
    /**
     * Registers a custom render region with a specified name.
     * @param name - The name of the region.
     * @param regionClass - The class of the region to register.
     */
    registerRegion(name: string, regionClass: typeof RenderRegion): void;
    private quitCurrentRegion;
    /**
     * Sets the current render region by name and optionally a custom shader.
     * @param regionName - The name of the region to set as current.
     * @param customShader - An optional custom shader to use with the region.
     */
    setRegion(regionName: string, customShader?: GLShader): void;
    /**
     * Saves the current matrix state to the stack.
     */
    save(): void;
    /**
     * Restores the matrix state from the stack.
     */
    restore(): void;
    /**
     * Starts the rendering process, resetting the matrix stack and clearing the current region.
     * @param clear - Whether to clear the matrix stack. Defaults to true.
     */
    startRender(clear?: boolean): void;
    /**
     * Ends the rendering process by rendering the current region.
     */
    endRender(): void;
    /**
     * Renders a sprite with the specified texture, offset, and options.
     * @param texture - The texture to render.
     * @param offsetX - The X offset for the sprite. Defaults to 0.
     * @param offsetY - The Y offset for the sprite. Defaults to 0.
     * @param options - Rendering options including color and custom shader.
     */
    renderSprite(texture: Texture, offsetX?: number, offsetY?: number, options?: IRenderSpriteOptions | Color): void;
    /**
     * Renders a line with the specified options.
     *
     * @param offsetX - The X offset to apply when rendering the line. Defaults to 0.
     * @param offsetY - The Y offset to apply when rendering the line. Defaults to 0.
     * @param options - The options for rendering the line, including points and color.
     */
    renderLine(offsetX: number | undefined, offsetY: number | undefined, options: IRenderLineOptions): void;
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
    renderGraphic(offsetX: number | undefined, offsetY: number | undefined, options: IGraphicOptions | Vec2[]): void;
    /**
     * Renders a rectangle
     * @param offsetX - The X coordinate of the top-left corner of the rectangle
     * @param offsetY - The Y coordinate of the top-left corner of the rectangle
     * @param width - The width of the rectangle
     * @param height - The height of the rectangle
     * @param color - The color of the rectangle
     */
    renderRect(offsetX: number, offsetY: number, width: number, height: number, color?: Color): void;
    /**
     * Renders a circle
     * @param offsetX - The X coordinate of the circle's center
     * @param offsetY - The Y coordinate of the circle's center
     * @param radius - The radius of the circle
     * @param color - The color of the circle
     * @param segments - The number of segments to use when rendering the circle, default is 32
     */
    renderCircle(offsetX: number, offsetY: number, radius: number, color?: Color, segments?: number): void;
    /**
     * Resizes the canvas and updates the viewport and projection matrix.
     * @param width - The new width of the canvas.
     * @param height - The new height of the canvas.
     */
    resize(width: number, height: number): void;
    /**
     * Clears the canvas with the background color.
     */
    clear(): void;
    /**
     * Creates an orthogonal projection matrix.
     * @param left - The left bound of the projection.
     * @param right - The right bound of the projection.
     * @param bottom - The bottom bound of the projection.
     * @param top - The top bound of the projection.
     * @returns The orthogonal projection matrix as a `Float32Array`.
     */
    private createOrthMatrix;
    /**
     * Transforms a point by applying the current matrix stack.
     * @param x - The X coordinate of the point.
     * @param y - The Y coordinate of the point.
     * @returns The transformed point as an array `[newX, newY]`.
     */
    transformPoint(x: number, y: number): number[] | Vec2;
    /**
     * Starts drawing a mask using the stencil buffer.
     * This method sets up the WebGL context to begin defining a mask area.
     */
    startDrawMask(): void;
    /**
     * Ends the mask drawing process.
     * This method configures the WebGL context to use the defined mask for subsequent rendering.
     */
    endDrawMask(type?: MaskType): void;
    /**
     * Sets the mask type for rendering
     * @param type - The type of mask to apply
     */
    setMaskType(type: MaskType): void;
    /**
     * Clears the current mask by clearing the stencil buffer.
     * This effectively removes any previously defined mask.
     */
    clearMask(): void;
}
export default Rapid;
