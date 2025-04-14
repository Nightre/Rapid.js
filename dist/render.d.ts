import { ICircleOptions, IGraphic, ILayerRender, IRapidOptions, IRectOptions, IRenderLineOptions, ISprite, ShaderType as ShaderType, MaskType, WebGLContext } from "./interface";
import { LightManager } from "./light";
import { Color, MatrixStack, Vec2 } from "./math";
import RenderRegion from "./regions/region";
import { FrameBufferObject, Texture, TextureCache } from "./texture";
import { TileMapRender, TileSet } from "./tilemap";
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
    tileMap: TileMapRender;
    light: LightManager;
    width: number;
    height: number;
    backgroundColor: Color;
    readonly devicePixelRatio: number;
    readonly maxTextureUnits: number;
    private readonly defaultColor;
    private currentRegion?;
    private currentRegionName?;
    private regions;
    private currentMaskType;
    private currentTransform;
    private currentFBO;
    /**
     * Constructs a new `Rapid` instance with the given options.
     * @param options - Options for initializing the `Rapid` instance.
     */
    constructor(options: IRapidOptions);
    /**
     * Render a tile map layer.
     * @param data - The map data to render.
     * @param options - The options for rendering the tile map layer.
     */
    renderTileMapLayer(data: (number | string)[][], options: ILayerRender | TileSet): void;
    /**
     * Initializes WebGL context settings.
     * @param gl - The WebGL context.
     */
    private initWebgl;
    /**
     * @ignore
     */
    clearTextureUnit(): void;
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
     * @param hasUnifrom - have costum unifrom
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
     * Executes a callback function within a saved and restored matrix state scope.
     * @param cb - The callback function to execute within the saved and restored matrix state scope.
     */
    withTransform(cb: () => void): void;
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
     * Render
     * @param cb - The function to render.
     */
    render(cb: () => void): void;
    /**
     * Renders a sprite with the specified options.
     *
     * @param options - The rendering options for the sprite, including texture, position, color, and shader.
     */
    renderSprite(options: ISprite): void;
    /**
     * Renders a texture directly without additional options.
     * This is a convenience method that calls renderSprite with just the texture.
     *
     * @param texture - The texture to render at the current transformation position.
     */
    renderTexture(texture: Texture): void;
    /**
     * Renders a line with the specified options.
     *
     * @param options - The options for rendering the line, including points, color, width, and join/cap types.
     */
    renderLine(options: IRenderLineOptions): void;
    /**
     * Renders graphics based on the provided options.
     *
     * @param options - The options for rendering the graphic, including points, color, texture, and draw type.
     */
    renderGraphic(options: IGraphic): void;
    /**
     * Starts the graphic drawing process.
     *
     * @param options - The options for the graphic drawing, including shader, texture, and draw type.
     */
    startGraphicDraw(options: IGraphic): void;
    /**
     * Adds a vertex to the current graphic being drawn.
     *
     * @param offsetX - The X coordinate of the vertex.
     * @param offsetY - The Y coordinate of the vertex.
     * @param uv - The texture UV coordinates for the vertex.
     * @param color - The color of the vertex. Defaults to the renderer's default color.
     */
    addGraphicVertex(offsetX: number, offsetY: number, uv: Vec2, color?: Color): void;
    /**
     * Completes the graphic drawing process and renders the result.
     */
    endGraphicDraw(): void;
    private startDraw;
    private afterDraw;
    /**
     * Renders a rectangle with the specified options.
     *
     * @param options - The options for rendering the rectangle, including width, height, position, and color.
     */
    renderRect(options: IRectOptions): void;
    /**
     * Renders a circle with the specified options.
     *
     * @param options - The options for rendering the circle, including radius, position, color, and segment count.
     */
    renderCircle(options: ICircleOptions): void;
    /**
     * Resizes the canvas and updates the viewport and projection matrix.
     * @param width - The new width of the canvas.
     * @param height - The new height of the canvas.
     */
    resize(logicalWidth: number, logicalHeight: number): void;
    private resizeWebglSize;
    private updateProjection;
    /**
     * Clears the canvas with the background color.
     * @param bgColor - The background color to clear the canvas with.
     */
    clear(bgColor?: Color): void;
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
     * Draw a mask. Automatically calls startDrawMask.
     * @param type - The type of mask to draw.
     * @param cb - The callback function to execute.
     */
    drawMask(type: MaskType | undefined, cb: () => void): void;
    /**
     * Start drawing a mask using the stencil buffer.
     * This method configures the WebGL context to begin defining a mask area.
     */
    startDrawMask(type?: MaskType): void;
    /**
     * End the mask drawing process.
     * This method configures the WebGL context to use the defined mask for subsequent rendering.
     */
    endDrawMask(): void;
    /**
     * Set the mask type for rendering
     * @param type - The mask type to apply
     * @param start - Whether this is the start of mask drawing
     */
    private setMaskType;
    /**
     * Clear the current mask by clearing the stencil buffer.
     * This effectively removes any previously defined mask.
     */
    clearMask(): void;
    /**
     * Creates a custom shader.
     * @param vs - Vertex shader code.
     * @param fs - Fragment shader code.
     * @param type - Shader type.
     * @param textureUnit - The number of textures used by the shader
     * @returns The created shader object.
     */
    createCostumShader(vs: string, fs: string, type: ShaderType, textureUnit?: number): GLShader;
    /**
     * Starts rendering to a Frame Buffer Object (FBO)
     * Sets up the FBO for rendering by binding it, adjusting viewport size and projection
     * @param fbo - The Frame Buffer Object to render to
     */
    startFBO(fbo: FrameBufferObject): void;
    /**
     * Ends rendering to a Frame Buffer Object
     * Restores the default framebuffer and original viewport settings
     * @param fbo - The Frame Buffer Object to unbind
     */
    endFBO(): void;
    /**
     * Convenience method to render to a Frame Buffer Object
     * Handles starting and ending the FBO rendering automatically
     * @param fbo - The Frame Buffer Object to render to
     * @param cb - Callback function containing render commands to execute on the FBO
     */
    drawToFBO(fbo: FrameBufferObject, cb: () => void): void;
}
export default Rapid;
