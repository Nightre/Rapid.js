import { Rapid, TextureFilterMode } from './render';
import { Color } from './color';
export type Images = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas;
export declare enum TextureWrapMode {
    REPEAT = 0,
    CLAMP = 1,
    MIRRORED_REPEAT = 2
}
/**
 * Options for configuring texture creation.
 */
export interface ITextureOptions {
    textureFilter?: TextureFilterMode;
    wrap?: TextureWrapMode;
    premultipliedAlpha?: boolean;
    key?: string;
}
/**
 * Manages texture loading, caching, and creation.
 */
declare class TextureManager {
    private render;
    private cache;
    constructor(render: Rapid);
    /**
     * Asynchronously loads a texture from a URL.
     * @param url - The image URL to load.
     * @param options - Optional configuration for the texture.
     * @returns A promise that resolves to the loaded Texture.
     */
    load(url: string, options?: ITextureOptions): Promise<Texture>;
    /**
     * Creates a texture synchronously from an existing HTML element (Image, Canvas, Video).
     * @param source - The source image element.
     * @param options - Optional configuration for the texture.
     * @returns The newly created Texture.
     */
    create(source: Images, options?: ITextureOptions): Texture;
    /**
     * Creates a generic Render Texture (FrameBuffer).
     * @param width - The width of the render texture.
     * @param height - The height of the render texture.
     * @param options - Optional configuration for the texture.
     * @returns The newly created RenderTexture.
     */
    createRenderTexture(options: IRenderTextureOptions): RenderTexture;
    /**
     * Creates a TextTexture for rendering text.
     * @param options - Optional configuration for the texture.
     * @returns The newly created TextTexture.
     */
    createTextTexture(options?: ITextOptions): TextTexture;
    /**
     * Destroys a texture and potentially removes its BaseTexture from the cache.
     * If a Texture instance is provided, it decrements the reference count of the BaseTexture.
     * The BaseTexture will only be destroyed if its reference count drops to 0, or if `force` is true.
     * @param textureOrUrl - The texture instance, base texture, or cache key (URL) to destroy.
     * @param force - If true, destroys the underlying BaseTexture immediately regardless of reference count.
     */
    destroy(textureOrUrl: Texture | BaseTexture | string, force?: boolean): void;
    /**
     * Destroys all cached textures and clears the cache, ignoring reference counts.
     */
    destroyAll(): void;
    private _fetchImage;
}
/**
 * The underlying GPU resource holder for a texture.
 * Implements simple reference counting.
 */
export declare class BaseTexture {
    glTexture: WebGLTexture | null;
    width: number;
    height: number;
    uid?: string;
    refCount: number;
    constructor(texture: WebGLTexture, width: number, height: number);
    /**
     * Creates a BaseTexture from an image source.
     * @param render - The Rapid renderer instance.
     * @param source - The image source.
     * @param options - Optional configuration.
     * @returns The created BaseTexture.
     */
    static fromSource(render: Rapid, source: Images, options?: ITextureOptions): BaseTexture;
    /**
     * Updates the content of the existing texture (e.g. for Video or dynamic Canvas).
     * Uses texSubImage2D if dimensions haven't changed for better performance.
     * @param gl - The WebGL rendering context.
     * @param source - The new image source.
     */
    updateSource(gl: WebGL2RenderingContext, source: Images, options?: ITextureOptions): void;
    /**
     * Dynamically updates the texture filtering mode.
     */
    setFilterMode(gl: WebGL2RenderingContext, filterMode: TextureFilterMode): void;
    /**
     * Dynamically updates the texture wrap mode.
     */
    setWrapMode(gl: WebGL2RenderingContext, wrapMode: TextureWrapMode): void;
    /**
     * Destroys the WebGL texture resource.
     * @param gl - The WebGL rendering context.
     */
    destroy(gl: WebGL2RenderingContext): void;
}
/**
 * A lightweight reference to a BaseTexture, containing UV clipping and logical size information.
 */
declare class Texture {
    base?: BaseTexture;
    uvX: number;
    uvY: number;
    uvW: number;
    uvH: number;
    rawWidth: number;
    rawHeight: number;
    offsetX: number;
    offsetY: number;
    scale: number;
    isAtlas: boolean;
    flipY: boolean;
    isRotated: boolean;
    glTexture: WebGLTexture | null;
    get width(): number;
    get height(): number;
    protected _px: number;
    protected _py: number;
    protected _pw: number;
    protected _ph: number;
    constructor(base?: BaseTexture);
    /**
     * Sets the base texture and increments its reference count.
     * @param base - The BaseTexture instance.
     * @returns The current Texture instance.
     */
    setBase(base: BaseTexture): this;
    /**
     * Sets the visible region (clipping) in pixels relative to the BaseTexture.
     * @param x - The x coordinate in pixels.
     * @param y - The y coordinate in pixels.
     * @param w - The width in pixels.
     * @param h - The height in pixels.
     * @returns The current Texture instance.
     */
    setRegion(x: number, y: number, w: number, h: number): this;
    /**
     * Creates a new Texture representing a sub-region of this Texture.
     * @param x - The x coordinate in pixels, relative to this texture's logical start.
     * @param y - The y coordinate in pixels, relative to this texture's logical start.
     * @param width - The width of the sub-texture in pixels.
     * @param height - The height of the sub-texture in pixels.
     * @returns A new Texture pointing to the sub-region.
     */
    getSubTexture(x: number, y: number, width: number, height: number): Texture;
    /**
     * Creates a shallow copy of this Texture, sharing the same BaseTexture.
     * @returns A new Texture instance.
     */
    clone(target?: Texture): Texture;
    /**
     * Utility to split this texture into a grid of sprite textures.
     * Sub-textures will respect the current UV offsets.
     * @param cellWidth - The width of each cell in pixels.
     * @param cellHeight - The height of each cell in pixels.
     * @param cols - Optional number of columns. Truncates based on texture width if omitted.
     * @param rows - Optional number of rows. Truncates based on texture height if omitted.
     * @returns An array of split Textures.
     */
    splitGrid(cellWidth: number, cellHeight: number, cols?: number, rows?: number): Texture[];
    /**
     * Creates a Texture directly from an image source, bypassing the TextureManager.
     * @param source - The image element, canvas, video, or bitmap.
     * @param options - Optional antialias and wrap mode settings.
     */
    static fromImageSource(render: Rapid, source: Images, options?: ITextureOptions): Texture;
    /**
     * Marks this Texture as destroyed, decrementing the BaseTexture reference count.
     */
    destroy(): void;
}
export interface IRenderTextureOptions extends ITextureOptions {
    width: number;
    height: number;
    clearColor?: Color;
}
/**
 * A texture that can be rendered to (wraps a WebGL Framebuffer).
 */
declare class RenderTexture extends Texture {
    private framebuffer;
    private renderbuffer;
    private gl;
    flipY: boolean;
    clearColor?: Color;
    /** Actual GPU-allocated dimensions — grow-only, never shrink */
    private _allocW;
    private _allocH;
    constructor(render: Rapid, options: IRenderTextureOptions);
    /**
     * Resizes the render texture using a grow-only GPU allocation strategy.
     *
     * - GPU memory is only reallocated when the new size **exceeds** the current allocation.
     * - Shrinking only updates the logical dimensions and UV sub-region — no GPU work.
     *
     * This makes it safe to call every frame with varying sizes (e.g. inside applyFilters).
     *
     * @param width  - New logical width.
     * @param height - New logical height.
     * @param force  - Force full GPU reallocation regardless of current allocation size.
     */
    resize(width: number, height: number, force?: boolean): void;
    /**
     * Activates this texture as the current render target.
     * @param clear - Whether to clear the render target after activation.
     */
    activate(clear?: boolean): void;
    clear(clearColor?: Color): void;
    /**
     * Deactivates this texture, returning rendering to the default frame buffer.
     */
    deactivate(): void;
    /**
     * Get raw pixels from the render texture.
     * @param x - X coordinate in logical pixel space (top-left origin).
     * @param y - Y coordinate in logical pixel space (top-left origin).
     * @param width - Width of the region to read.
     * @param height - Height of the region to read.
     */
    GetPixels(x?: number, y?: number, width?: number, height?: number): Uint8Array;
    /**
     * Get the color at a pixel in the render texture.
     * @param x - X coordinate in logical pixel space (top-left origin).
     * @param y - Y coordinate in logical pixel space (top-left origin).
     */
    GetColorAt(x: number, y: number): Color;
    /**
     * Destroys the framebuffer, renderbuffer, and base texture.
     */
    destroy(): void;
}
export interface ITextStyle {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fill?: string | CanvasGradient | CanvasPattern;
    stroke?: string | CanvasGradient | CanvasPattern;
    strokeThickness?: number;
    align?: "left" | "center" | "right";
    baseline?: CanvasTextBaseline;
}
export interface ITextOptions extends ITextStyle, ITextureOptions {
    text?: string;
}
/**
 * A texture that renders text using an internal HTML Canvas.
 */
declare class TextTexture extends Texture {
    private canvas;
    private ctx;
    private render;
    private _text;
    private _style;
    private options;
    flipY: boolean;
    constructor(render: Rapid, options?: ITextOptions);
    get text(): string;
    /**
     * Set new text and update the texture
     */
    set text(value: string);
    get style(): ITextStyle;
    /**
     * Set new style partially and update the texture
     */
    set style(value: Partial<ITextStyle>);
    private updateOffset;
    /**
     * Updates the internal canvas and uploads it to WebGL
     */
    update(): void;
}
export { TextureManager, Texture, RenderTexture, TextTexture };
