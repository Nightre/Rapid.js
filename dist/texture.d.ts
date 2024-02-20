import Rapid from "./render";
import { Images } from "./interface";
/**
 * texture manager
 */
declare class TextureCache {
    private render;
    private cache;
    constructor(render: Rapid);
    /**
     * create texture from url
     * Equivalent to {@link Texture.fromUrl} method
     * @param url
     * @param antialias
     * @returns
     */
    textureFromUrl(url: string, antialias?: boolean): Promise<Texture>;
    loadImage(url: string): Promise<HTMLImageElement>;
}
/**
 * Each {@link Texture} references a baseTexture, and different textures may have the same baseTexture
 */
declare class BaseTexture {
    texture: WebGLTexture;
    width: number;
    height: number;
    constructor(texture: WebGLTexture, width: number, height: number);
    static fromImageSource(r: Rapid, image: Images, antialias?: boolean): BaseTexture;
}
declare class Texture {
    /**
     * Reference to the {@link BaseTexture} used by this texture.
     */
    base: BaseTexture;
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
     * Creates a new `Texture` instance with the specified base texture reference.
     * @param base - The {@link BaseTexture} to be used by the texture.
     */
    constructor(base: BaseTexture);
    /**
     * Sets the region of the texture to be used for rendering.
     * @param x - The x-coordinate of the top-left corner of the region.
     * @param y - The y-coordinate of the top-left corner of the region.
     * @param w - The width of the region.
     * @param h - The height of the region.
     */
    setClipRegion(x: number, y: number, w: number, h: number): void;
    /**
     * Creates a new `Texture` instance from the specified image source.
     * @param rapid - The Rapid instance to use.
     * @param image - The image source to create the texture from.
     * @param antialias - Whether to enable antialiasing for the texture. Default is `false`.
     * @returns A new `Texture` instance created from the image source.
     */
    static fromImageSource(rapid: Rapid, image: Images, antialias?: boolean): Texture;
    /**
     * Creates a new `Texture` instance from the specified URL.
     * @param rapid - The Rapid instance to use.
     * @param url - The URL of the image to create the texture from.
     * @returns A new `Texture` instance created from the specified URL.
     */
    static fromUrl(rapid: Rapid, url: string): Promise<Texture>;
}
export { Texture, BaseTexture, TextureCache };
