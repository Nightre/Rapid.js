import { getContext, WebGLContext } from "./webgl/utils";
import GLShader, { CustomGlShader } from "./webgl/glshader";
import { Region } from "./region/region";
import { SpriteRegion } from "./region/spriteRegion";
import { MatrixStack, MatrixStore, ITransformOptions } from "./matrix-engine";
import { GraphicRegion } from "./region/graphicRegion";
import { RenderTexture, Texture, TextureManager } from "./texture";
import { Color } from "./color";
import {
    ICircleOptions,
    IGraphicOptions,
    ILineOptions,
    IMaskImageOptions,
    IRectOptions,
    ISpriteOptions,
    drawCircle,
    drawGraphic,
    drawLine,
    drawMaskImage,
    drawRect,
    drawSprite,
} from "./draw";
import { Vec2 } from "./math";

/**
 * Options for initializing the Rapid application.
 */
export interface IAppOptions {
    /** The HTML canvas element to render onto. */
    canvas: HTMLCanvasElement;

    /** The logical width of the application (CSS pixels). */
    logicWidth?: number;
    /** The logical height of the application (CSS pixels). */
    logicHeight?: number;

    /** The physical width of the application (actual pixels). */
    physicsWidth?: number;
    /** The physical height of the application (actual pixels). */
    physicsHeight?: number;

    /** The default clear color for the application background. */
    backgroundColor?: Color;

    /** Whether to enable MSAA antialiasing on the WebGL canvas. Default: false. */
    antialias?: boolean;

    textureFilter?: TextureFilterMode;

    /** Whether textures are uploaded with premultiplied alpha. Default: true. */
    premultipliedAlpha?: boolean;
}

/**
 * The type of mask to apply.
 */
export enum MaskType {
    /**
     * Draw inside the mask.
     */
    EQUAL,
    /**
     * Draw outside the mask.
     */
    NOT_EQUAL
}

/**
 * Supported blend modes for rendering.
 */
export enum BlendMode {
    /** Normal alpha blending. */
    NORMAL,
    /** Additive blending (useful for glow effects). */
    ADD,
    /** Multiply blending (useful for shadows and darkening). */
    MULTIPLY,
    /** Screen blending (produces a softer additive effect). */
    SCREEN,
    /** Erase blending (removes alpha based on source). */
    ERASE
}

export enum TextureFilterMode {
    LINEAR,
    NEAREST
}

/**
 * The main application class for the Rapid rendering engine.
 * Manages the WebGL context, rendering regions, state, and matrices.
 */
export class Rapid {
    /** The active WebGL context. */
    gl: WebGLContext;
    /** The target HTMLCanvasElement. */
    canvas: HTMLCanvasElement;

    /** The current orthographic projection matrix (16 elements). */
    projection: Float32Array = new Float32Array(16);
    /** Indicates if the projection matrix has changed and needs to be uploaded to shaders. */
    projectionDirty: boolean = true;

    /** The current device pixel ratio. */
    dpr: number;

    /** Background clear color [r, g, b, a], values range from 0 to 255. */
    backgroundColor: Color = Color.Black;

    /** Logical width in CSS pixels, used for coordinate system and projection matrix. */
    logicWidth: number = 0;
    /** Logical height in CSS pixels, used for coordinate system and projection matrix. */
    logicHeight: number = 0;

    /** Physical width (canvas actual pixels = logical width * dpr). */
    physicsWidth: number = 0;
    /** Physical height (canvas actual pixels = logical height * dpr). */
    physicsHeight: number = 0;

    /** The currently active rendering region. */
    currentRegion: Region | null = null;

    /** Maximum number of texture units supported by the device. */
    maxTextureUnits: number = 0;

    /** Matrix stack for hierarchical transformations. */
    matrixStack: MatrixStack = new MatrixStack(this);
    /** Direct access to the underlying matrix store. */
    matrix: MatrixStore;

    /** Region dedicated to fast sprite rendering. */
    spriteRegion: SpriteRegion;
    /** Region dedicated to arbitrary geometry and shapes rendering. */
    graphicRegion: GraphicRegion;

    /** Counts the number of WebGL draw calls made in the current frame. */
    drawcallCount: number = 0;
    /** Indicates whether we are currently writing to the stencil buffer to create a mask. */
    inCreateMask: boolean = false;

    /** Manager for creating and organizing textures. */
    texture: TextureManager;

    /** Whether textures use premultiplied alpha. Set once at construction. */
    premultipliedAlpha: boolean;
    /** Default texture filtering preference and requested canvas MSAA setting. */
    antialias: boolean;

    /** Default filtering mode used when sampling textures. */
    textureFilter: TextureFilterMode;

    /** Internal ping-pong RenderTextures for multi-filter chains. */
    private _filterRT: [RenderTexture | null, RenderTexture | null] = [null, null];

    get height() {
        return this.logicHeight
    }
    get width() {
        return this.logicWidth
    }
    /**
     * Creates a new Rapid application instance.
     * @param options Initialization options including the target canvas.
     */
    constructor(options: IAppOptions) {
        this.canvas = options.canvas;
        this.dpr = window.devicePixelRatio || 1;
        this.antialias = options.antialias ?? false;
        this.textureFilter = options.textureFilter ?? TextureFilterMode.NEAREST;
        this.premultipliedAlpha = options.premultipliedAlpha ?? true;

        const gl = getContext(this.canvas, this.antialias, this.premultipliedAlpha);
        this.gl = gl;

        this.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this.matrix = this.matrixStack.matrix;

        this.spriteRegion = new SpriteRegion(this);
        this.graphicRegion = new GraphicRegion(this);

        const cssW = this.canvas.clientWidth || this.canvas.width;
        const cssH = this.canvas.clientHeight || this.canvas.height;

        // Initialize physics dimensions; fall back to CSS size * DPR if not provided
        this.physicsWidth = options.physicsWidth || Math.round(cssW * this.dpr);
        this.physicsHeight = options.physicsHeight || Math.round(cssH * this.dpr);

        this.logicWidth = options.logicWidth || (this.physicsWidth / this.dpr);
        this.logicHeight = options.logicHeight || (this.physicsHeight / this.dpr);

        this.resize(this.logicWidth, this.logicHeight, this.physicsWidth, this.physicsHeight);

        this.texture = new TextureManager(this);

        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor;
        }

        gl.enable(gl.BLEND);
        if (this.premultipliedAlpha) {
            // Premultiplied alpha: RGB is already multiplied by A
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            // Straight alpha
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        gl.enable(gl.STENCIL_TEST);

        // Default stencil configuration: always pass, keep existing values
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    }

    setTextureFilter(filter: TextureFilterMode) {
        this.textureFilter = filter;
    }

    setAntialias(antialias: boolean) {
        this.antialias = antialias;
    }

    private getColorUint32(color?: Color): number {
        if (!color) return 0xFFFFFFFF;
        return this.premultipliedAlpha ? color.premultipliedUint32 : color.uint32;
    }

    /**
     * Enters a specific rendering region, flushing the previous one if necessary.
     * @param region The rendering region to enter.
     * @param customShader An optional custom shader to use for this region.
     */
    enterRegion(region: Region, customShader?: GLShader | CustomGlShader): void {
        if (this.currentRegion === region && this.currentRegion.isSameShader(customShader)) {
            return;
        }
        this.flush();
        this.currentRegion = region;
        region.enter(customShader);
    }

    drawSprite(options: ISpriteOptions): void {
        drawSprite(this, options);
    }

    drawLine(options: ILineOptions): void {
        drawLine(this, options);
    }

    drawGraphic(options: IGraphicOptions): void {
        drawGraphic(this, options);
    }

    drawRect(options: IRectOptions): void {
        drawRect(this, options);
    }

    drawCircle(options: ICircleOptions): void {
        drawCircle(this, options);
    }

    /**
     * Starts rendering arbitrary graphics geometries.
     * @param drawMode The WebGL drawing mode (e.g., gl.TRIANGLES, gl.TRIANGLE_FAN).
     * @param texture  An optional texture applied to the graphic vertices.
     * @param customShader An optional custom shader overriding the region's default shader.
     */
    startGraphic(
        drawMode: number = this.gl.TRIANGLES,
        texture?: Texture,
        customShader?: GLShader | CustomGlShader,
        customMatrix?: number
    ): void {
        this.enterRegion(this.graphicRegion, customShader);
        this.graphicRegion.startGraphic(customMatrix ?? this.matrixStack.curWorldM, drawMode, texture);
    }

    /**
     * Starts rendering graphics explicitly for use as a mask, overriding the shader.
     * @param drawMode The WebGL drawing mode (e.g., gl.TRIANGLES).
     * @param texture  An optional texture whose alpha channel may dictate masking rules.
     */
    startMaskGraphic(drawMode: number = this.gl.TRIANGLES, texture?: Texture, customMatrix?: number): void {
        this.startGraphic(drawMode, texture, this.graphicRegion.maskShader, customMatrix);
    }

    /**
     * Utility method: Draws an image directly as a mask using a generic rectangle geometry.
     * @param texture The texture to be used as a mask.
     */
    drawMaskImage(options: IMaskImageOptions): void {
        drawMaskImage(this, options);
    }

    /**
     * Pushes vertices for a rectangle geometry. Should be enclosed by startGraphic and endGraphic.
     * @param w The width of the rectangle.
     * @param h The height of the rectangle.
     * @param color An optional tint color.
     */
    addRectVertex(w: number, h: number, color?: Color): void {
        const unitColor = this.getColorUint32(color);
        this.addGraphicVertex(0, 0, 0, 0, unitColor);
        this.addGraphicVertex(w, 0, 1, 0, unitColor);
        this.addGraphicVertex(w, h, 1, 1, unitColor);
        this.addGraphicVertex(0, h, 0, 1, unitColor);
    }

    /**
     * Pushes vertices for a circle geometry using TRIANGLES or similar primitives.
     * @param r The radius of the circle.
     * @param color An optional tint color.
     * @param segments The number of segments (polygons) used to approximate the circle.
     */
    addCircleVertex(r: number, color?: Color, segments: number = 32): void {
        const angleStep = (Math.PI * 2) / segments;
        const unitColor = this.getColorUint32(color);
        for (let i = 0; i < segments; i++) {
            const angle = angleStep * i;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const u = 0.5 + Math.cos(angle) * 0.5;
            const v = 0.5 + Math.sin(angle) * 0.5;
            this.addGraphicVertex(x, y, u, v, unitColor);
        }
    }

    /**
     * Adds an individual vertex to the current graphics batch.
     * @param x The relative X coordinate of the vertex.
     * @param y The relative Y coordinate of the vertex.
     * @param u The U texture coordinate (0 to 1).
     * @param v The V texture coordinate (0 to 1).
     * @param color The vertex color as a 32-bit unsigned integer.
     */
    addGraphicVertex(
        x: number, y: number,
        u: number = 0, v: number = 0,
        color: number = 0xFFFFFFFF,
    ): void {
        this.graphicRegion.addVertex(x, y, u, v, color);
    }

    /**
     * Ends the current graphics geometry definition, readying it for rendering.
     */
    endGraphic(): void {
        this.graphicRegion.endGraphic();
    }

    /**
     * Resizes the canvas, updates internal viewport values, and recreates projection boundaries.
     * @param logicWidth The new logical display width.
     * @param logicHeight The new logical display height.
     * @param cssWidth Optional CSS display width.
     * @param cssHeight Optional CSS display height.
     */
    resize(logicWidth: number, logicHeight: number, cssWidth?: number, cssHeight?: number): void {
        this.flush();
        const cssW = cssWidth ?? this.canvas.clientWidth ?? this.canvas.width;
        const cssH = cssHeight ?? this.canvas.clientHeight ?? this.canvas.height;

        if (cssWidth !== undefined) {
            this.canvas.style.width = cssW + 'px';
        }

        if (cssHeight !== undefined) {
            this.canvas.style.height = cssH + 'px';
        }

        this.physicsWidth = Math.round(cssW * this.dpr);
        this.physicsHeight = Math.round(cssH * this.dpr);

        this.canvas.width = this.physicsWidth;
        this.canvas.height = this.physicsHeight;


        this.logicWidth = logicWidth;
        this.logicHeight = logicHeight;

        this.gl.viewport(0, 0, this.physicsWidth, this.physicsHeight);
        this.updateProjection(0, this.logicWidth, this.logicHeight, 0);

        console.log(`[RESIZE] logic ：${this.logicWidth}, ${this.logicHeight}`)
        console.log(`[RESIZE] physics ：${this.physicsWidth}, ${this.physicsHeight}`)
    }

    /**
     * Updates the projection matrix using an orthographic mapping.
     * Automatically sets local flag projectionDirty.
     */
    private updateProjection(left: number, right: number, bottom: number, top: number): void {
        this.updateOrthMatrix(this.projection, left, right, bottom, top);
        this.projectionDirty = true;
    }

    /**
     * Clears the active framebuffer applying the default background color.
     */
    clear(): void {
        const gl = this.gl;
        this.backgroundColor.setClearColor(gl);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        this.drawcallCount = 0;
        this.matrixStack.reset()
    }

    /**
     * Populates an orthographic projection matrix in place.
     * Avoids continuous Float32Array allocations for performance reasons.
     */
    private updateOrthMatrix(out: Float32Array, left: number, right: number, bottom: number, top: number): void {
        out[0] = 2 / (right - left);
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = 2 / (top - bottom);
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = -1;
        out[11] = 0;
        out[12] = -(right + left) / (right - left);
        out[13] = -(top + bottom) / (top - bottom);
        out[14] = 0;
        out[15] = 1;
    }

    /**
     * Flushes currently buffered rendering operations across all active regions.
     */
    flush(): void {
        if (this.currentRegion) {
            this.currentRegion.exit();
            this.currentRegion = null;
        }
    }

    /**
     * Applies a chain of shaders to a texture sequentially using ping-pong RenderTextures.
     * Each shader receives the output of the previous one as its input.
     * Two internal RenderTextures are reused across calls (resized as needed).
     *
     * @param source   The input texture to start the filter chain from.
     * @param shaders  An ordered array of CustomGlShader to apply in sequence.
     * @returns The RenderTexture containing the final filtered result.
     *          Draw it with `rapid.drawSprite({ texture: result })` to display it on screen.
     *
     * @example
     * const result = rapid.applyFilters(tex, [blurShader, outlineShader]);
     * rapid.drawSprite({ texture: result });
     */
    applyFilters(source: Texture, shaders: CustomGlShader[]): RenderTexture {
        if (shaders.length === 0) {
            throw new Error("applyFilters: shaders array must not be empty.");
        }

        // source.width/height already reflects the region size (not the full base texture).
        // drawSprite uses the region UV, so only the region pixels are rendered into the RT.
        // The output RT contains the "baked" region content — no region metadata needed.
        const width = source.width;
        const height = source.height;

        // Ensure both ping-pong RTs exist and match the source size (grow-only: no GPU
        // reallocation unless size exceeds the previous maximum)
        for (let i = 0; i < 2; i++) {
            if (!this._filterRT[i]) {
                this._filterRT[i] = this.texture.createRenderTexture({width, height});
            } else {
                this._filterRT[i]!.resize(width, height);
            }
        }

        let inputTex: Texture = source;
        let rtIndex = 0;

        this.matrixStack.save()
        this.matrixStack.identity();
        for (let i = 0; i < shaders.length; i++) {
            const outputRT = this._filterRT[rtIndex % 2]!;

            this.enterRenderTexture(outputRT);
            this.clearRenderTexture();
            // Draw the full source (or previous pass output) as a full-RT quad at (0,0).
            // The projection is already set to (0, w, h, 0) by enterRenderTexture.

            this.drawSprite({ texture: inputTex, shader: shaders[i] });

            this.leaveRenderTexture();

            inputTex = outputRT;
            rtIndex++;
        }
        this.matrixStack.restore()

        return inputTex as RenderTexture;
    }


    enterRenderTexture(rt: RenderTexture): void {
        this.flush();
        rt.activate();

        this.gl.viewport(0, 0, rt.width, rt.height);
        this.updateProjection(0, rt.width, rt.height, 0);
    }

    /**
     * Clears a RenderTexture to a solid color.
     * Must be called while the RT is the active render target (i.e. inside enterRenderTexture/leaveRenderTexture).
     * Can also be called standalone — it will bind the RT, clear it, but NOT restore the main framebuffer.
     * @param rt    The render texture to clear.
     * @param color Clear color. Defaults to transparent black (0, 0, 0, 0).
     */
    clearRenderTexture(color: Color = new Color(0, 0, 0, 0)): void {
        this.flush();
        const gl = this.gl;
        color.setClearColor(gl)
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /**
     * Completes rendering to an offscreen render texture and reverts rendering back to the main canvas.
     */
    leaveRenderTexture(): void {
        this.flush();

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.physicsWidth, this.physicsHeight);
        this.updateProjection(0, this.logicWidth, this.logicHeight, 0);
    }

    /**
     * Convenience wrapper: enters a RenderTexture, optionally clears it, runs a callback, then leaves.
     * @param rt    The RenderTexture to render into.
     * @param cb    The callback containing draw calls to execute inside the RT.
     * @param color Clear color before rendering. Pass `null` to skip clearing. Defaults to transparent black.
     *
     * @example
     * rapid.drawToRenderTexture(myRT, () => {
     *     rapid.drawSprite({ texture: mySprite });
     * });
     */
    drawToRenderTexture(rt: RenderTexture, cb: () => void, color: Color | null = new Color(0, 0, 0, 0)): void {
        this.enterRenderTexture(rt);
        try {
            if (color !== null) {
                this.clearRenderTexture(color);
            }
            cb();
        } finally {
            this.leaveRenderTexture();
        }
    }

    /**
     * Convenience wrapper: writes a mask using the stencil buffer, then renders within it, then exits the mask.
     * @param maskCb   Callback that defines the mask geometry (drawn to stencil, not visible).
     * @param drawCb   Callback containing the actual draw calls masked by the stencil.
     * @param type     Mask type: EQUAL (draw inside) or NOT_EQUAL (draw outside). Defaults to EQUAL.
     * @param ref      Stencil reference value. Defaults to 1.
     *
     * @example
     * rapid.withMask(
     *     () => rapid.drawRect({ width: 200, height: 200 }),
     *     () => rapid.drawSprite({ texture: myTexture }),
     * );
     */
    withMask(maskCb: () => void, drawCb: () => void, type: MaskType = MaskType.EQUAL, ref: number = 1): void {
        this.clearMask();
        this.startDrawMask(ref);
        try {
            maskCb();
        } finally {
            this.endDrawMask();
        }

        this.enterMask(type, ref);
        try {
            drawCb();
        } finally {
            this.exitMask();
        }
    }

    /**
     * Convenience wrapper: saves the matrix stack, applies an optional transform, runs a callback, then restores.
     * When `transform` is provided, delegates to `matrixStack.applyTransform()` which handles
     * position, rotation, scale, offset, and origin automatically.
     * @param cb        The callback to execute within the saved transform context.
     * @param transform Optional transform options to apply before running the callback.
     * @param width     The logical width used to resolve `origin` anchoring. Defaults to 0.
     * @param height    The logical height used to resolve `origin` anchoring. Defaults to 0.
     *
     * @example
     * // Simple save/restore
     * rapid.withTransform(() => {
     *     rapid.matrixStack.translate(100, 100);
     *     rapid.drawSprite({ texture: myTexture });
     * });
     *
     * @example
     * // With a transform applied
     * rapid.withTransform(() => {
     *     rapid.drawSprite({ texture: myTexture });
     * }, { x: 100, y: 50, rotation: Math.PI / 4, origin: 0.5 }, myTexture.width, myTexture.height);
     */
    withTransform(cb: () => void, transform?: ITransformOptions, width: number = 0, height: number = 0): void {
        if (transform) {
            const shouldRestore = transform.saveTransform ?? true;
            try {
                // save in applyTransform
                this.matrixStack.applyTransform(transform, width, height);
                cb();
            } finally {
                if (shouldRestore) {
                    this.matrixStack.restore();
                }
            }
        } else {
            this.matrixStack.save();
            try {
                cb();
            } finally {
                this.matrixStack.restore();
            }
        }
    }

    /**
     * Convenience wrapper: enables scissor clipping for a region, runs a callback, then disables it.
     * @param x      Left edge in logical pixels.
     * @param y      Top edge in logical pixels.
     * @param width  Width in logical pixels.
     * @param height Height in logical pixels.
     * @param cb     The callback to execute within the scissor region.
     *
     * @example
     * rapid.withScissor(50, 50, 300, 200, () => {
     *     rapid.drawSprite({ texture: myTexture });
     * });
     */
    withScissor(x: number, y: number, width: number, height: number, cb: () => void): void {
        this.startScissor(x, y, width, height);
        try {
            cb();
        } finally {
            this.endScissor();
        }
    }

    /**
     * Convenience wrapper: sets a blend mode, runs a callback, then restores NORMAL blend mode.
     * @param mode The BlendMode to apply for the duration of the callback.
     * @param cb   The callback to execute under the given blend mode.
     *
     * @example
     * rapid.withBlendMode(BlendMode.ADD, () => {
     *     rapid.drawSprite({ texture: glowTexture });
     * });
     */
    withBlendMode(mode: BlendMode, cb: () => void): void {
        this.setBlendMode(mode);
        try {
            cb();
        } finally {
            this.setBlendMode(BlendMode.NORMAL);
        }
    }

    /**
     * Starts drawing into the stencil buffer to construct a rendering mask.
     * @param ref The stencil reference value.
     * @param mask The stencil bitmask.
     */
    startDrawMask(ref: number = 1, mask: number = 0xFF): void {
        this.flush();
        const gl = this.gl;

        gl.stencilMask(mask);
        // Disable rendering to color buffers
        gl.colorMask(false, false, false, false);

        gl.stencilFunc(gl.ALWAYS, ref, mask);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

        this.enterRegion(this.graphicRegion, this.graphicRegion.maskShader);
        this.inCreateMask = true;
    }

    /**
     * Finishes the mask drawing phase and restores color buffer writing.
     */
    endDrawMask(): void {
        this.flush();
        const gl = this.gl;
        gl.colorMask(true, true, true, true);
        gl.stencilMask(0x00);
        this.inCreateMask = false;
    }

    /**
     * Clears bounds created into the stencil mask.
     * @param mask The bitmask specifying which stencil layer to clear.
     */
    clearMask(mask: number = 0xFF): void {
        this.flush();
        const gl = this.gl;
        gl.stencilMask(mask);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        this.inCreateMask = false;
    }

    /**
     * Enters a constrained rendering phase masked by the existing stencil buffer values.
     * @param type Equality check type. Use "equal" to draw inside the mask, or "notEqual" to draw outside.
     * @param ref The reference value to test against.
     * @param mask The bitmask specifying which stencil bits to consider.
     */
    enterMask(type: MaskType, ref: number = 1, mask: number = 0xFF): void {
        this.flush();
        const gl = this.gl;

        gl.colorMask(true, true, true, true);
        gl.stencilMask(0x00);
        gl.stencilFunc(type === MaskType.EQUAL ? gl.EQUAL : gl.NOTEQUAL, ref, mask);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        this.inCreateMask = false;
    }

    /**
     * Exits the masked rendering phase, restoring default full-screen stencil values tests.
     */
    exitMask(): void {
        this.flush();
        const gl = this.gl;

        gl.colorMask(true, true, true, true);
        gl.stencilMask(0xFF);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        this.inCreateMask = false;
    }

    /**
     * Configures the global WebGL blending behavior.
     * @param mode The targeted BlendMode to switch onto.
     */
    setBlendMode(mode: BlendMode): void {
        this.flush(); // Must flush previous draw calls rendering with the old blend mode
        const gl = this.gl;

        // Use blendFuncSeparate to correctly handle alpha channels
        // Important for offscreen targets (FBOs) to resolve alpha mixing issues (e.g., rendering darkening bugs)
        switch (mode) {
            case BlendMode.NORMAL:
                if (this.premultipliedAlpha) {
                    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                } else {
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }
                break;

            case BlendMode.ADD:
                // Additive blending (glow effects) — works the same with premultiplied
                gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
                break;

            case BlendMode.MULTIPLY:
                // Multiply blending (shadows)
                gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                break;

            case BlendMode.SCREEN:
                // Screen blending (softer additive)
                gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                break;

            case BlendMode.ERASE:
                // Erase: subtract source alpha from destination
                gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
                break;
        }
    }

    /**
     * Enables rectangular scissor clipping. Only pixels within the specified
     * rectangle (in logical coordinates) will be rendered.
     * Coordinates use the same system as your drawing calls (top-left origin).
     * @param x Left edge in logical pixels.
     * @param y Top edge in logical pixels.
     * @param width Width in logical pixels.
     * @param height Height in logical pixels.
     */
    startScissor(x: number, y: number, width: number, height: number): void {
        this.flush();
        const gl = this.gl;
        const scaleX = this.physicsWidth / this.logicWidth;
        const scaleY = this.physicsHeight / this.logicHeight;

        // Convert logical coords to physical pixels, flipping Y for WebGL (bottom-left origin)
        const px = Math.round(x * scaleX);
        const py = Math.round(this.physicsHeight - (y + height) * scaleY);
        const pw = Math.round(width * scaleX);
        const ph = Math.round(height * scaleY);

        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(px, py, pw, ph);
    }

    /**
     * Disables scissor clipping, restoring full-canvas rendering.
     */
    endScissor(): void {
        this.flush();
        this.gl.disable(this.gl.SCISSOR_TEST);
    }

    renderCamera(transform: ITransformOptions) {
        this.matrixStack.applyTransform(transform)

        const m = this.matrixStack.curWorldM
        this.matrix.invert(m)
    }

    logicToPhysics(p:Vec2) {
        return p.multiply(new Vec2(
            this.physicsWidth / this.logicWidth,
            this.physicsHeight / this.logicHeight
        ))
    }

    physicsToLogic(p:Vec2) {
        return p.multiply(new Vec2(
            this.logicWidth / this.physicsWidth,
            this.logicHeight / this.physicsHeight
        ))
    }

    cssToDevicePixel(p:Vec2){
        return p.mul(this.dpr)
    }

    devicePixelToCss(p:Vec2){
        return p.divide(this.dpr)
    }
}
