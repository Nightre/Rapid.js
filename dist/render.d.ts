import { IRapiadOptions, IRenderLineOptions, IRenderSpriteOptions, WebGLContext } from "./interface";
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
    private readonly defaultColorBlack;
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
    renderLine(offsetX: number | undefined, offsetY: number | undefined, options: IRenderLineOptions): void;
    renderGraphic(offsetX: number | undefined, offsetY: number | undefined, vertexs: Vec2[], color?: Color, drawType?: number): void;
    /**
     * Starts a graphic drawing process with an optional custom shader.
     * @param customShader - An optional custom shader to use.
     */
    startGraphicDraw(customShader?: GLShader): void;
    /**
     * Adds a vertex to the current graphic drawing with a specified position and color.
     * @param x - The X position of the vertex.
     * @param y - The Y position of the vertex.
     * @param color - The color of the vertex.
     */
    addGraphicVertex(x: number | Vec2, y?: number | Color, color?: Color): void;
    /**
     * Ends the graphic drawing process by rendering the current graphic region.
     */
    endGraphicDraw(): void;
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
}
export default Rapid;
