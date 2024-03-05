import Rapid from "./render"
import { Images } from "./interface"
import { createTexture } from "./webgl/utils"
/**
 * texture manager
 */
class TextureCache {
    private render: Rapid
    private cache: Map<string, BaseTexture> = new Map
    constructor(render: Rapid) {
        this.render = render
    }
    /**
     * create texture from url
     * Equivalent to {@link Texture.fromUrl} method
     * @param url 
     * @param antialias 
     * @returns 
     */
    async textureFromUrl(url: string, antialias: boolean = false) {
        let base = this.cache.get(url)
        if (!base) {
            const image = await this.loadImage(url)
            base = BaseTexture.fromImageSource(this.render, image, antialias)
            this.cache.set(url, base)
        }
        return new Texture(base)
    }
    async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.src = url;
        });
    };
}

/**
 * Each {@link Texture} references a baseTexture, and different textures may have the same baseTexture
 */
class BaseTexture {
    texture: WebGLTexture
    width: number
    height: number
    constructor(texture: WebGLTexture, width: number, height: number) {
        this.texture = texture
        this.width = width
        this.height = height
    }
    static fromImageSource(r: Rapid, image: Images, antialias: boolean = false) {
        return new BaseTexture(
            createTexture(r.gl, image, antialias),
            image.width,
            image.height
        )
    }
}

class Texture {
    /**
     * Reference to the {@link BaseTexture} used by this texture.
     */
    base: BaseTexture;

    /**
     * The x-coordinate of the top-left corner of the clipped region.
     */
    clipX!: number;

    /**
     * The y-coordinate of the top-left corner of the clipped region.
     */
    clipY!: number;

    /**
     * The width of the clipped region.
     */
    clipW!: number;

    /**
     * The height of the clipped region.
     */
    clipH!: number;

    /**
     * The width of the texture.
     */
    width!: number;

    /**
     * The height of the texture.
     */
    height!: number;

    /**
     * Creates a new `Texture` instance with the specified base texture reference.
     * @param base - The {@link BaseTexture} to be used by the texture.
     */
    constructor(base: BaseTexture) {
        this.base = base
        this.setClipRegion(0, 0, base.width, base.height)
    }
    /**
     * Sets the region of the texture to be used for rendering.
     * @param x - The x-coordinate of the top-left corner of the region.
     * @param y - The y-coordinate of the top-left corner of the region.
     * @param w - The width of the region.
     * @param h - The height of the region.
     */
    setClipRegion(x: number, y: number, w: number, h: number) {
        this.clipX = x / this.base.width
        this.clipY = y / this.base.width
        this.clipW = this.clipX + (w / this.base.width)
        this.clipH = this.clipY + (h / this.base.width)
        this.width = w
        this.height = h
    }
    /**
     * Creates a new `Texture` instance from the specified image source.
     * @param rapid - The Rapid instance to use.
     * @param image - The image source to create the texture from.
     * @param antialias - Whether to enable antialiasing for the texture. Default is `false`.
     * @returns A new `Texture` instance created from the image source.
     */
    static fromImageSource(rapid: Rapid, image: Images, antialias: boolean = false) {
        return new Texture(
            BaseTexture.fromImageSource(rapid, image, antialias)
        )
    }
    /**
     * Creates a new `Texture` instance from the specified URL.
     * @param rapid - The Rapid instance to use.
     * @param url - The URL of the image to create the texture from.
     * @returns A new `Texture` instance created from the specified URL.
     */
    static fromUrl(rapid: Rapid, url: string) {
        return rapid.textures.textureFromUrl(url)
    }
}

export {
    Texture,
    BaseTexture,
    TextureCache
}