import { Rapid } from "./render"
import { createTexture } from "./webgl/utils"
import { Color } from "./color"

export type Images =
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | ImageBitmap
    | OffscreenCanvas;

export enum TextureWrapMode {
    REPEAT,
    CLAMP,
    MIRRORED_REPEAT
}

/**
 * Options for configuring texture creation.
 */
export interface ITextureOptions {
    antialias?: boolean;
    wrap?: TextureWrapMode;
    key?: string;
}

/**
 * Manages texture loading, caching, and creation.
 */
class TextureManager {
    private render: Rapid
    private cache: Map<string, BaseTexture> = new Map()

    constructor(render: Rapid) {
        this.render = render
    }

    /**
     * Asynchronously loads a texture from a URL.
     * @param url - The image URL to load.
     * @param options - Optional configuration for the texture.
     * @returns A promise that resolves to the loaded Texture.
     */
    async load(url: string, options?: ITextureOptions): Promise<Texture> {
        let base = this.cache.get(url)
        if (base) {
            return new Texture(base)
        }

        try {
            const image = await this._fetchImage(url);
            base = BaseTexture.fromSource(this.render, image, options);
            base.uid = url;
            this.cache.set(url, base);

            return new Texture(base);
        } catch (e) {
            console.error(`[TextureManager] Failed to load: ${url}`, e);
            throw e;
        }
    }

    /**
     * Creates a texture synchronously from an existing HTML element (Image, Canvas, Video).
     * @param source - The source image element.
     * @param options - Optional configuration for the texture.
     * @returns The newly created Texture.
     */
    create(source: Images, options?: ITextureOptions): Texture {
        if (options?.key && this.cache.has(options.key)) {
            return new Texture(this.cache.get(options.key)!);
        }

        const base = BaseTexture.fromSource(this.render, source, options);

        if (options?.key) {
            base.uid = options.key;
            this.cache.set(options.key, base);
        }

        return new Texture(base);
    }

    /**
     * Creates a generic Render Texture (FrameBuffer).
     * @param width - The width of the render texture.
     * @param height - The height of the render texture.
     * @param options - Optional configuration for the texture.
     * @returns The newly created RenderTexture.
     */
    createRenderTexture(width: number, height: number, options?: ITextureOptions): RenderTexture {
        return new RenderTexture(this.render, width, height, options);
    }

    /**
     * Creates a TextTexture for rendering text.
     * @param text - The text to display.
     * @param style - Optional styling for the text.
     * @param options - Optional configuration for the texture.
     * @returns The newly created TextTexture.
     */
    createTextTexture(text: string, style?: ITextStyle, options?: ITextureOptions): TextTexture {
        return new TextTexture(this.render, text, style, options);
    }

    /**
     * Destroys a texture and potentially removes its BaseTexture from the cache.
     * If a Texture instance is provided, it decrements the reference count of the BaseTexture.
     * The BaseTexture will only be destroyed if its reference count drops to 0, or if `force` is true.
     * @param textureOrUrl - The texture instance, base texture, or cache key (URL) to destroy.
     * @param force - If true, destroys the underlying BaseTexture immediately regardless of reference count.
     */
    destroy(textureOrUrl: Texture | BaseTexture | string, force: boolean = false): void {
        let base: BaseTexture | undefined;
        let uid: string | undefined;

        if (typeof textureOrUrl === 'string') {
            uid = textureOrUrl;
            base = this.cache.get(uid);
        } else if (textureOrUrl instanceof Texture) {
            base = textureOrUrl.base;
            uid = base?.uid;
            textureOrUrl.destroy(); // Safely decreases the reference count
        } else {
            base = textureOrUrl;
            uid = base.uid;
        }

        // Only physically destroy the WebGL texture if ref count is <= 0 or if explicitly forced
        if (base && (base.refCount <= 0 || force)) {
            base.destroy(this.render.gl);
            if (uid) this.cache.delete(uid);
        }
    }

    /**
     * Destroys all cached textures and clears the cache, ignoring reference counts.
     */
    destroyAll(): void {
        for (const base of this.cache.values()) {
            base.destroy(this.render.gl);
        }
        this.cache.clear();
    }

    private _fetchImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image resource: ${url}`));
            img.src = url;
        });
    }
}

/**
 * The underlying GPU resource holder for a texture.
 * Implements simple reference counting.
 */
class BaseTexture {
    public glTexture: WebGLTexture | null = null;
    public width: number;
    public height: number;
    public uid?: string;
    public refCount: number = 0;

    constructor(texture: WebGLTexture, width: number, height: number) {
        this.glTexture = texture;
        this.width = width;
        this.height = height;
    }

    /**
     * Creates a BaseTexture from an image source.
     * @param render - The Rapid renderer instance.
     * @param source - The image source.
     * @param options - Optional configuration.
     * @returns The created BaseTexture.
     */
    static fromSource(render: Rapid, source: Images, options?: ITextureOptions): BaseTexture {
        const antialias = options?.antialias ?? false;
        const wrap = options?.wrap ?? TextureWrapMode.CLAMP;
        const glTexture = createTexture(render.gl, source, antialias, wrap);
        return new BaseTexture(glTexture, source.width, source.height);
    }

    /**
     * Updates the content of the existing texture (e.g. for Video or dynamic Canvas).
     * Uses texSubImage2D if dimensions haven't changed for better performance.
     * @param gl - The WebGL rendering context.
     * @param source - The new image source.
     */
    updateSource(gl: WebGL2RenderingContext, source: Images): void {
        if (!this.glTexture) return;
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        if (this.width === source.width && this.height === source.height) {
            // High-performance path: replace texture content when size is identical
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
        } else {
            // Re-allocate texture storage if dimensions have changed
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            this.width = source.width;
            this.height = source.height;
        }
    }

    /**
     * Destroys the WebGL texture resource.
     * @param gl - The WebGL rendering context.
     */
    destroy(gl: WebGL2RenderingContext): void {
        if (this.glTexture) {
            gl.deleteTexture(this.glTexture);
            this.glTexture = null;
        }
    }
}

/**
 * A lightweight reference to a BaseTexture, containing UV clipping and logical size information.
 */
class Texture {
    public base?: BaseTexture;

    public uvX: number = 0;
    public uvY: number = 0;
    public uvW: number = 1;
    public uvH: number = 1;

    public width: number = 0;
    public height: number = 0;
    public scale: number = 1;

    public flipY: boolean = false;
    public glTexture: WebGLTexture | null = null;

    constructor(base?: BaseTexture) {
        if (base) this.setBase(base);
    }

    /**
     * Sets the base texture and increments its reference count.
     * @param base - The BaseTexture instance.
     * @returns The current Texture instance.
     */
    setBase(base: BaseTexture): this {
        if (this.base === base) return this;

        if (this.base) {
            this.base.refCount--;
        }

        this.base = base;
        this.base.refCount++;

        this.setRegion(0, 0, base.width, base.height);
        this.glTexture = base.glTexture;
        return this;
    }

    /**
     * Sets the visible region (clipping) in pixels relative to the BaseTexture.
     * @param x - The x coordinate in pixels.
     * @param y - The y coordinate in pixels.
     * @param w - The width in pixels.
     * @param h - The height in pixels.
     * @returns The current Texture instance.
     */
    setRegion(x: number, y: number, w: number, h: number): this {
        if (!this.base) return this;

        this.uvX = x / this.base.width;
        this.uvY = y / this.base.height;
        this.uvW = this.uvX + (w / this.base.width);
        this.uvH = this.uvY + (h / this.base.height);

        if (this.flipY) {
            const v = this.uvY;
            this.uvY = this.uvH;
            this.uvH = v;
        }

        this.width = w * this.scale;
        this.height = h * this.scale;

        return this;
    }

    /**
     * Creates a new Texture representing a sub-region of this Texture.
     * @param x - The x coordinate in pixels, relative to this texture's logical start.
     * @param y - The y coordinate in pixels, relative to this texture's logical start.
     * @param width - The width of the sub-texture in pixels.
     * @param height - The height of the sub-texture in pixels.
     * @returns A new Texture pointing to the sub-region.
     */
    getSubTexture(x: number, y: number, width: number, height: number): Texture {
        if (!this.base) return new Texture();

        const tex = this.clone();

        // Convert current UV offset back to pixels and add the sub-coordinates
        const startX = this.uvX * this.base.width;
        const startY = this.uvY * this.base.height;

        tex.setRegion(startX + x, startY + y, width, height);
        return tex;
    }

    /**
     * Creates a shallow copy of this Texture, sharing the same BaseTexture.
     * @returns A new Texture instance.
     */
    clone(): Texture {
        const t = new Texture(this.base); // setBase handles ref count
        t.scale = this.scale;
        t.uvX = this.uvX; t.uvY = this.uvY;
        t.uvW = this.uvW; t.uvH = this.uvH;
        t.width = this.width; t.height = this.height;
        t.flipY = this.flipY;
        return t;
    }

    /**
     * Utility to split this texture into a grid of sprite textures.
     * Sub-textures will respect the current UV offsets.
     * @param cellWidth - The width of each cell in pixels.
     * @param cellHeight - The height of each cell in pixels.
     * @param cols - Optional number of columns. Truncates based on texture width if omitted.
     * @param rows - Optional number of rows. Truncates based on texture height if omitted.
     * @returns An array of split Textures.
     */
    splitGrid(cellWidth: number, cellHeight: number, cols?: number, rows?: number): Texture[] {
        if (!this.base) return [];
        const res: Texture[] = [];

        const baseW = this.width / this.scale;
        const baseH = this.height / this.scale;

        const c = cols ?? Math.floor(baseW / cellWidth);
        const r = rows ?? Math.floor(baseH / cellHeight);

        for (let y = 0; y < r; y++) {
            for (let x = 0; x < c; x++) {
                res.push(this.getSubTexture(x * cellWidth, y * cellHeight, cellWidth, cellHeight));
            }
        }
        return res;
    }

    /**
     * Marks this Texture as destroyed, decrementing the BaseTexture reference count.
     */
    destroy(): void {
        if (this.base) {
            this.base.refCount--;
            this.base = undefined;
        }
        this.glTexture = null;
    }
}

/**
 * A texture that can be rendered to (wraps a WebGL Framebuffer).
 */
class RenderTexture extends Texture {
    private framebuffer: WebGLFramebuffer | null;
    private renderbuffer: WebGLRenderbuffer | null;
    private gl: WebGL2RenderingContext;
    private _base: BaseTexture;
    public flipY: boolean = true;

    constructor(render: Rapid, width: number, height: number, options?: ITextureOptions) {
        super();
        this.gl = render.gl;

        const antialias = options?.antialias ?? true;
        const wrapMode = options?.wrap ?? TextureWrapMode.CLAMP;

        const glTex = createTexture(this.gl, { width, height }, antialias, wrapMode, true);
        this._base = new BaseTexture(glTex, width, height);
        this.setBase(this._base);

        this.framebuffer = this.gl.createFramebuffer();
        this.renderbuffer = this.gl.createRenderbuffer();

        if (!this.framebuffer || !this.renderbuffer) {
            throw new Error("Failed to create Framebuffer or Renderbuffer");
        }

        this.resize(width, height, true);
    }

    /**
     * Resizes the render texture buffers.
     * @param width - The new width.
     * @param height - The new height.
     * @param force - Force regeneration even if the size is the same.
     */
    resize(width: number, height: number, force: boolean = false): void {
        if (!force && this.width === width && this.height === height) return;

        const gl = this.gl;
        this.width = width;
        this.height = height;
        this._base.width = width;
        this._base.height = height;

        gl.bindTexture(gl.TEXTURE_2D, this._base.glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // 2D only mode - use STENCIL_INDEX8, no depth buffer
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._base.glTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Activates this texture as the current render target.
     * @param clearColor - Optional color to clear the buffer with.
     */
    activate(clearColor?: Color): void {
        if (!this.framebuffer) return;
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.width, this.height);

        if (clearColor) {
            gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        }
    }

    /**
     * Deactivates this texture, returning rendering to the default frame buffer.
     */
    deactivate(): void {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Destroys the framebuffer, renderbuffer, and base texture.
     */
    destroy(): void {
        super.destroy(); // Dec ref
        if (this.framebuffer) this.gl.deleteFramebuffer(this.framebuffer);
        if (this.renderbuffer) this.gl.deleteRenderbuffer(this.renderbuffer);
        this._base.destroy(this.gl);
    }
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
    lineHeight?: number;
}

const defaultTextStyle: ITextStyle = {
    fontFamily: "Arial",
    fontSize: 24,
    fontWeight: "normal",
    fill: "#ffffff",
    strokeThickness: 0,
    align: "left",
    baseline: "top",
};

/**
 * A texture that renders text using an internal HTML Canvas.
 */
class TextTexture extends Texture {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private render: Rapid;
    private _text: string;
    private _style: ITextStyle;
    private _base: BaseTexture;
    flipY = true

    constructor(render: Rapid, text: string, style?: ITextStyle, options?: ITextureOptions) {
        super();
        this.render = render;
        this._style = { ...defaultTextStyle, ...style };
        this._text = text;

        this.canvas = document.createElement("canvas");
        const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Failed to get 2d context for TextTexture");
        this.ctx = ctx;

        this.canvas.width = 1;
        this.canvas.height = 1;

        const glTexture = createTexture(render.gl, this.canvas, options?.antialias ?? true, options?.wrap ?? TextureWrapMode.CLAMP);
        this._base = new BaseTexture(glTexture, 1, 1);
        this.setBase(this._base);

        this.update();
    }

    public get text(): string {
        return this._text;
    }

    /**
     * Set new text and update the texture
     */
    public set text(value: string) {
        if (this._text !== value) {
            this._text = value;
            this.update();
        }
    }

    public get style(): ITextStyle {
        return this._style;
    }

    /**
     * Set new style partially and update the texture
     */
    public set style(value: Partial<ITextStyle>) {
        this._style = { ...this._style, ...value };
        this.update();
    }

    /**
     * Updates the internal canvas and uploads it to WebGL
     */
    public update(): void {
        const ctx = this.ctx;
        const font = `${this._style.fontWeight} ${this._style.fontSize}px ${this._style.fontFamily}`;
        ctx.font = font;

        const lines = this._text.split('\n');
        let maxWidth = 0;
        let totalHeight = 0;
        const lineHeight = this._style.lineHeight ?? (this._style.fontSize! * 1.2);

        for (const line of lines) {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
            totalHeight += lineHeight;
        }

        const padding = (this._style.strokeThickness || 0) * 2;
        const canvasWidth = Math.ceil(maxWidth + padding) || 1;
        const canvasHeight = Math.ceil(totalHeight + padding) || 1;

        // Only resize if actually changed, because resizing clears canvas
        if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
        } else {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Must set font again if canvas resized
        ctx.font = font;
        ctx.textBaseline = this._style.baseline || "top";
        ctx.textAlign = this._style.align || "left";

        let y = padding / 2;
        for (const line of lines) {
            let x = padding / 2;
            if (this._style.align === "center") {
                x = this.canvas.width / 2;
            } else if (this._style.align === "right") {
                x = this.canvas.width - padding / 2;
            }

            if (this._style.stroke && this._style.strokeThickness! > 0) {
                ctx.lineWidth = this._style.strokeThickness!;
                ctx.strokeStyle = this._style.stroke as string;
                ctx.strokeText(line, x, y);
            }

            if (this._style.fill) {
                ctx.fillStyle = this._style.fill as string;
                ctx.fillText(line, x, y);
            }

            y += lineHeight;
        }

        this._base.updateSource(this.render.gl, this.canvas);
        this.setRegion(0, 0, this._base.width, this._base.height);
    }
}

export {
    TextureManager,
    Texture,
    RenderTexture,
    TextTexture
}