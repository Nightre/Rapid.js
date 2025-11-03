import Rapid from "./render"
import { Images, ITextTextureOptions, TextureWrapMode, WebGLContext } from "./interface"
import { createTexture } from "./webgl/utils"
import { Color } from "./math"

/**
 * texture manager
 * @ignore
 */
class TextureCache {
    private render: Rapid
    private cache: Map<string | Images, BaseTexture> = new Map
    private antialias: boolean

    constructor(render: Rapid, antialias: boolean) {
        this.render = render
        this.antialias = antialias
    }
    /**
     * create texture from url
     * Equivalent to {@link Texture.fromUrl} method
     * @param url 
     * @param antialias 
     * @returns 
     */
    async textureFromUrl(url: string, antialias: boolean = this.antialias, wrapMode: TextureWrapMode = TextureWrapMode.CLAMP) {
        let base = this.cache.get(url)
        if (!base) {
            const image = await this.loadImage(url)
            base = BaseTexture.fromImageSource(this.render, image, antialias, wrapMode)
            base.cacheKey = url
            this.cache.set(url, base)
        }
        return new Texture(base)
    }
    /**
     * Create a new `Texture` instance from a FrameBufferObject.
     * @param fbo - The FrameBufferObject to create the texture from.
     * @returns A new `Texture` instance created from the specified FrameBufferObject.
     */
    textureFromFrameBufferObject(fbo: FrameBufferObject) {
        return new Texture(fbo)
    }

    /**
     * Create a new `Texture` instance from an image source.
     * @param source - The image source to create the texture from.
     * @param antialias - Whether to enable antialiasing.
     * @returns A new `Texture` instance created from the specified image source.
     */
    textureFromSource(source: Images, antialias: boolean = this.antialias, wrapMode: TextureWrapMode = TextureWrapMode.CLAMP) {
        let base = this.cache.get(source)
        if (!base) {
            base = BaseTexture.fromImageSource(this.render, source, antialias, wrapMode)
            base.cacheKey = source
            this.cache.set(source, base)
        }
        return new Texture(base)
    }

    /**
     * Load an image from the specified URL.
     * @param url - The URL of the image to load.
     * @returns A promise that resolves to the loaded HTMLImageElement.
     */
    async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.src = url;
        });
    };
    /**
     * Create a new `Text` instance.
     * @param options - The options for rendering the text, such as font, size, color, etc.
     * @returns A new `Text` instance.
     */
    createText(options: ITextTextureOptions) {
        return new Text(this.render, options)
    }
    /**
     * Destroy the texture
     * @param texture 
     */
    destroy(texture: Texture | BaseTexture) {
        const baseTexture = texture instanceof Texture ? texture.base : texture;
        if (baseTexture) {
            baseTexture.destroy(this.render.gl);
            this.removeCache(baseTexture);
        }
    }
    /**
     * Create a new FrameBufferObject instance
     * @param width - Width of the framebuffer
     * @param height - Height of the framebuffer
     * @param antialias - Whether to enable antialiasing
     * @returns A new FrameBufferObject instance
     */
    createFrameBufferObject(width: number, height: number, antialias: boolean = this.antialias) {
        return new FrameBufferObject(this.render, width, height, antialias)
    }

    private removeCache(baseTexture: BaseTexture) {
        // 直接使用 cacheKey 来删除，高效且正确
        if (baseTexture.cacheKey) {
            this.cache.delete(baseTexture.cacheKey);
        }
    }
}

/**
 * Each {@link Texture} references a baseTexture, and different textures may have the same baseTexture
 */
class BaseTexture {
    texture: WebGLTexture
    width: number
    height: number
    wrapMode: TextureWrapMode
    cacheKey: string | Images | null = null

    constructor(texture: WebGLTexture, width: number, height: number, wrapMode: TextureWrapMode = TextureWrapMode.CLAMP) {
        this.texture = texture
        this.width = width
        this.height = height
        this.wrapMode = wrapMode
    }
    static fromImageSource(r: Rapid, image: Images, antialias: boolean = false, wrapMode: TextureWrapMode = TextureWrapMode.CLAMP) {
        return new BaseTexture(
            createTexture(r.gl, image, antialias, false, false, wrapMode),
            image.width,
            image.height
        )
    }
    /**
     * Destroy the texture
     * @param gl 
     * @ignore
     */
    destroy(gl: WebGLContext) {
        gl.deleteTexture(this.texture)
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
        this.setBaseTexture(base)
    }
    /**
     * Set or change BaseTexture
     * @param base 
     * @param scale 
     */
    setBaseTexture(base?: BaseTexture) {
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
        this.clipY = y / this.base.height
        this.clipW = this.clipX + (w / this.base.width)
        this.clipH = this.clipY + (h / this.base.height)
        this.width = w * this.scale
        this.height = h * this.scale

        return this
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

    static fromFrameBufferObject(fbo: FrameBufferObject) {
        return new Texture(fbo);
    }

    /**
     * Converts the current texture into a spritesheet.
     * @param rapid - The Rapid instance to use.
     * @param spriteWidth - The width of each sprite in the spritesheet.
     * @param spriteHeight - The height of each sprite in the spritesheet.
     * @returns An array of `Texture` instances representing the sprites in the spritesheet.
     */
    createSpritesheet(spriteWidth: number, spriteHeight: number, columns?: number, rows?: number, startX?: number, startY?: number): Texture[] {
        if (!this.base) return [];
        const sprites: Texture[] = [];

        const calcColumns = columns ?? Math.floor(this.base.width / spriteWidth);
        const calcRows = rows ?? Math.floor(this.base.height / spriteHeight);

        for (let y = 0; y < calcRows; y++) {
            for (let x = 0; x < calcColumns; x++) {
                const sprite = this.clone();
                sprite.setClipRegion(
                    (x + (startX ?? 0)) * spriteWidth,
                    (y + (startY ?? 0)) * spriteHeight,
                    spriteWidth,
                    spriteHeight
                );
                sprites.push(sprite);
            }
        }
        return sprites;
    }
    /**
     * Clone the current texture
     * @returns A new `Texture` instance with the same base texture reference.
     */
    clone() {
        return new Texture(this.base)
    }
}

/**
 * @ignore
 */
export const SCALEFACTOR = 2.5
class Text extends Texture {
    private readonly options: ITextTextureOptions;
    private readonly rapid: Rapid;
    protected override scale: number = 1 / SCALEFACTOR
    text: string;

    constructor(rapid: Rapid, options: ITextTextureOptions) {
        super()
        this.rapid = rapid
        this.options = options;
        this.text = options.text || ' '
        this.updateTextImage()
    }

    private updateTextImage() {
        if (this.base) {
            // Clean up old texture before creating a new one
            this.base.destroy(this.rapid.gl);
        }
        const canvas = this.createTextCanvas();
        this.setBaseTexture(BaseTexture.fromImageSource(this.rapid, canvas, true));
    }

    private createTextCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get 2D canvas context');

        const fontSize = this.options.fontSize || 16;
        const font = `${fontSize}px ${this.options.fontFamily || 'Arial'}`;
        const lines = this.text.split('\n');

        // 1. Measure text dimensions
        context.font = font;
        let maxWidth = 0;
        for (const line of lines) {
            const metrics = context.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        }
        const totalHeight = fontSize * lines.length;

        // 2. Set canvas size and drawing properties
        canvas.width = Math.ceil(maxWidth) * SCALEFACTOR;
        canvas.height = Math.ceil(totalHeight) * SCALEFACTOR;
        context.scale(SCALEFACTOR, SCALEFACTOR);

        // Re-apply properties after scaling
        context.font = font;
        context.fillStyle = this.options.color ? this.options.color.toHexString() : '#000';
        context.textAlign = this.options.textAlign || 'left';
        context.textBaseline = this.options.textBaseline || 'top';

        // Adjust x position based on text alignment
        let xPosition = 0;
        if (this.options.textAlign === 'center') {
            xPosition = maxWidth / 2;
        } else if (this.options.textAlign === 'right') {
            xPosition = maxWidth;
        }
		
        // 3. Draw text
        let yOffset = 0;
        for (const line of lines) {
            context.fillText(line, xPosition, yOffset);
            yOffset += fontSize;
        }

        return canvas;
    }

    /**
     * Updates the displayed text. Re-renders the texture if the text has changed.
     * @param text - The new text to display.
     */
    setText(text: string) {
        if (this.text === text) return;
        this.text = text || ' ';
        this.updateTextImage();
    }
}

class FrameBufferObject extends BaseTexture {
    private framebuffer: WebGLFramebuffer;
    private gl: WebGLContext;
    private readonly stencilBuffer: WebGLRenderbuffer;

    /**
     * Creates a new FrameBufferObject instance
     * @param render - The Rapid instance to use
     * @param width - Width of the framebuffer
     * @param height - Height of the framebuffer
     * @param antialias - Whether to enable antialiasing
     */
    constructor(render: Rapid, width: number, height: number, antialias: boolean = false) {
        // Create the texture first
        const gl = render.gl;
        const texture = createTexture(gl, { width, height }, antialias, true, false)

        // Create and setup framebuffer
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
            gl.deleteTexture(texture);
            throw new Error('Failed to create WebGL framebuffer');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );

        const stencilBuffer = gl.createRenderbuffer();
        if (!stencilBuffer) {
            gl.deleteFramebuffer(framebuffer);
            gl.deleteTexture(texture);
            throw new Error("Failed to create depth-stencil renderbuffer");
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, stencilBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.STENCIL_ATTACHMENT,
            gl.RENDERBUFFER,
            stencilBuffer
        );

        super(texture, width, height);

        this.gl = gl;
        this.framebuffer = framebuffer;
        this.stencilBuffer = stencilBuffer;

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    /**
     * Bind the framebuffer for rendering
     * @ignore
     */
    bind(bgColor: Color) {
        const gl = this.gl

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    }

    /**
     * Unbind the framebuffer and restore default framebuffer
     * @ignore
     */
    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    /**
     * Resize the framebuffer
     * @param width - New width
     * @param height - New height
     */
    resize(width: number, height: number) {
        if (this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    /**
     * Override destroy method to clean up framebuffer resources
     * @param gl - WebGL context
     */
    override destroy(gl: WebGLContext) {
        gl.deleteFramebuffer(this.framebuffer);
        gl.deleteRenderbuffer(this.stencilBuffer);
        super.destroy(gl);
    }
}

export {
    Text,
    Texture,
    BaseTexture,
    TextureCache,
    FrameBufferObject
}