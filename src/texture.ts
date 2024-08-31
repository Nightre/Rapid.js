import Rapid from "./render"
import { Images, ITextOptions } from "./interface"
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
    createText(options: ITextOptions) {
        return new Text(this.render, options)
    }
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
    base?: BaseTexture;

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
     * Image scaling factor
     */
    protected scale: number = 1
    /**
     * Creates a new `Texture` instance with the specified base texture reference.
     * @param base - The {@link BaseTexture} to be used by the texture.
     */
    constructor(base?: BaseTexture) {
        this.setBaseTextur(base)
    }
    /**
     * Set or change BaseTexture
     * @param base 
     * @param scale 
     */
    setBaseTextur(base?: BaseTexture) {
        if (base) {
            this.base = base
            this.setClipRegion(0, 0, base.width, base.height)
        }
    }
    /**
     * Sets the region of the texture to be used for rendering.
     * @param x - The x-coordinate of the top-left corner of the region.
     * @param y - The y-coordinate of the top-left corner of the region.
     * @param w - The width of the region.
     * @param h - The height of the region.
     */
    setClipRegion(x: number, y: number, w: number, h: number) {
        if (!this.base) return
        this.clipX = x / this.base.width
        this.clipY = y / this.base.width
        this.clipW = this.clipX + (w / this.base.width)
        this.clipH = this.clipY + (h / this.base.height)
        this.width = w * this.scale
        this.height = h * this.scale
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
export const SCALEFACTOR = 2
class Text extends Texture {
    private options: ITextOptions;
    private rapid: Rapid;
    protected override scale: number = 1 / SCALEFACTOR
    text: string;

    /**
     * Creates a new `Text` instance.
     * @param options - The options for rendering the text, such as font, size, color, etc.
     */
    constructor(rapid: Rapid, options: ITextOptions) {
        super()
        this.rapid = rapid
        this.options = options;
        this.text = options.text || ''
        this.updateTextImage()
    }
    private updateTextImage() {
        const canvas = this.createTextCanvas();
        this.setBaseTextur(BaseTexture.fromImageSource(this.rapid, canvas, true))
    }

    private createTextCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to get canvas context');
        }

        context.font = `${this.options.fontSize || 16}px ${this.options.fontFamily || 'Arial'}`;
        context.fillStyle = this.options.color || '#000';
        context.textAlign = this.options.textAlign || 'left';
        context.textBaseline = this.options.textBaseline || 'top';

        // Measure text to adjust canvas size
        const lines = this.text.split('\n');
        let maxWidth = 0;
        let totalHeight = 0;

        for (const line of lines) {
            const metrics = context.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
            totalHeight += (this.options.fontSize || 16);
        }

        canvas.width = maxWidth * SCALEFACTOR;
        canvas.height = totalHeight * SCALEFACTOR;
        context.scale(SCALEFACTOR, SCALEFACTOR);
        // Redraw the text on the correctly sized canvas
        context.font = `${this.options.fontSize || 16}px ${this.options.fontFamily || 'Arial'}`;
        context.fillStyle = this.options.color || '#000';
        context.textAlign = this.options.textAlign || 'left';
        context.textBaseline = this.options.textBaseline || 'top';
        let yOffset = 0;
        for (const line of lines) {
            context.fillText(line, 0, yOffset);
            yOffset += (this.options.fontSize || 16);
        }

        return canvas;
    }
    /**
     * Update the displayed text
     * @param text 
     */
    setText(text: string) {
        this.text = text
        this.updateTextImage()
    }
}

export {
    Text,
    Texture,
    BaseTexture,
    TextureCache
}