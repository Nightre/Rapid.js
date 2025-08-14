import Rapid from "./render";
import { Images, ITextTextureOptions, TextureWrapMode, WebGLContext } from "./interface";
import { Color } from "./math";
/**
 * texture manager
 * @ignore
 */
declare class TextureCache {
    private render;
    private cache;
    private antialias;
    constructor(render: Rapid, antialias: boolean);
    /**
     * create texture from url
     * Equivalent to {@link Texture.fromUrl} method
     * @param url
     * @param antialias
     * @returns
     */
    textureFromUrl(url: string, antialias?: boolean, wrapMode?: TextureWrapMode): Promise<Texture>;
    /**
     * Create a new `Texture` instance from a FrameBufferObject.
     * @param fbo - The FrameBufferObject to create the texture from.
     * @returns A new `Texture` instance created from the specified FrameBufferObject.
     */
    textureFromFrameBufferObject(fbo: FrameBufferObject): Texture;
    /**
     * Create a new `Texture` instance from an image source.
     * @param source - The image source to create the texture from.
     * @param antialias - Whether to enable antialiasing.
     * @returns A new `Texture` instance created from the specified image source.
     */
    textureFromSource(source: Images, antialias?: boolean, wrapMode?: TextureWrapMode): Texture;
    /**
     * Load an image from the specified URL.
     * @param url - The URL of the image to load.
     * @returns A promise that resolves to the loaded HTMLImageElement.
     */
    loadImage(url: string): Promise<HTMLImageElement>;
    /**
     * Create a new `Text` instance.
     * @param options - The options for rendering the text, such as font, size, color, etc.
     * @returns A new `Text` instance.
     */
    createText(options: ITextTextureOptions): Text;
    /**
     * Destroy the texture
     * @param texture
     */
    destroy(texture: Texture | BaseTexture): void;
    /**
     * Create a new FrameBufferObject instance
     * @param width - Width of the framebuffer
     * @param height - Height of the framebuffer
     * @param antialias - Whether to enable antialiasing
     * @returns A new FrameBufferObject instance
     */
    createFrameBufferObject(width: number, height: number, antialias?: boolean): FrameBufferObject;
    private removeCache;
}
/**
 * Each {@link Texture} references a baseTexture, and different textures may have the same baseTexture
 */
declare class BaseTexture {
    texture: WebGLTexture;
    width: number;
    height: number;
    wrapMode: TextureWrapMode;
    cacheKey: string | Images | null;
    constructor(texture: WebGLTexture, width: number, height: number, wrapMode?: TextureWrapMode);
    static fromImageSource(r: Rapid, image: Images, antialias?: boolean, wrapMode?: TextureWrapMode): BaseTexture;
    /**
     * Destroy the texture
     * @param gl
     * @ignore
     */
    destroy(gl: WebGLContext): void;
}
declare class Texture {
    /**
     * Reference to the {@link BaseTexture} used by this texture.
     */
    base?: BaseTexture;
    /**
     * The x-coordinate of the top-left corner of the clipped region.
     */
    clipX: number;
    /**
     * The y-coordinate of the top-left corner of the clipped region.
     */
    clipY: number;
    /**
     * The width of the clipped region.
     */
    clipW: number;
    /**
     * The height of the clipped region.
     */
    clipH: number;
    /**
     * The width of the texture.
     */
    width: number;
    /**
     * The height of the texture.
     */
    height: number;
    /**
     * Image scaling factor
     */
    protected scale: number;
    /**
     * Creates a new `Texture` instance with the specified base texture reference.
     * @param base - The {@link BaseTexture} to be used by the texture.
     */
    constructor(base?: BaseTexture);
    /**
     * Set or change BaseTexture
     * @param base
     * @param scale
     */
    setBaseTexture(base?: BaseTexture): void;
    /**
     * Sets the region of the texture to be used for rendering.
     * @param x - The x-coordinate of the top-left corner of the region.
     * @param y - The y-coordinate of the top-left corner of the region.
     * @param w - The width of the region.
     * @param h - The height of the region.
     */
    setClipRegion(x: number, y: number, w: number, h: number): this | undefined;
    /**
     * Creates a new `Texture` instance from the specified image source.
     * @param rapid - The Rapid instance to use.
     * @param image - The image source to create the texture from.
     * @param antialias - Whether to enable antialiasing for the texture. Default is `false`.
     * @returns A new `Texture` instance created from the image source.
     */
    static fromImageSource(rapid: Rapid, image: Images, antialias?: boolean): Texture;
    static fromFrameBufferObject(fbo: FrameBufferObject): Texture;
    /**
     * Converts the current texture into a spritesheet.
     * @param rapid - The Rapid instance to use.
     * @param spriteWidth - The width of each sprite in the spritesheet.
     * @param spriteHeight - The height of each sprite in the spritesheet.
     * @returns An array of `Texture` instances representing the sprites in the spritesheet.
     */
    createSpritesheet(spriteWidth: number, spriteHeight: number): Texture[];
    /**
     * Clone the current texture
     * @returns A new `Texture` instance with the same base texture reference.
     */
    clone(): Texture;
}
/**
 * @ignore
 */
export declare const SCALEFACTOR = 2;
declare class Text extends Texture {
    private readonly options;
    private readonly rapid;
    protected scale: number;
    text: string;
    constructor(rapid: Rapid, options: ITextTextureOptions);
    private updateTextImage;
    private createTextCanvas;
    /**
     * Updates the displayed text. Re-renders the texture if the text has changed.
     * @param text - The new text to display.
     */
    setText(text: string): void;
}
declare class FrameBufferObject extends BaseTexture {
    private framebuffer;
    private gl;
    private readonly stencilBuffer;
    /**
     * Creates a new FrameBufferObject instance
     * @param render - The Rapid instance to use
     * @param width - Width of the framebuffer
     * @param height - Height of the framebuffer
     * @param antialias - Whether to enable antialiasing
     */
    constructor(render: Rapid, width: number, height: number, antialias?: boolean);
    /**
     * Bind the framebuffer for rendering
     * @ignore
     */
    bind(bgColor: Color): void;
    /**
     * Unbind the framebuffer and restore default framebuffer
     * @ignore
     */
    unbind(): void;
    /**
     * Resize the framebuffer
     * @param width - New width
     * @param height - New height
     */
    resize(width: number, height: number): void;
    /**
     * Override destroy method to clean up framebuffer resources
     * @param gl - WebGL context
     */
    destroy(gl: WebGLContext): void;
}
export { Text, Texture, BaseTexture, TextureCache, FrameBufferObject };
