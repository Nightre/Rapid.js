import { getContext, WebGLContext } from "./webgl/utils";
import GLShader, { CustomGlShader } from "./webgl/glshader";
import { Region } from "./region/region";
import { SpriteRegion } from "./region/spriteRegion";
import { MatrixStack, MatrixStore } from "./matrix-engine";
import { GraphicRegion } from "./region/graphicRegion";
import { RenderTexture, Texture, TextureManager } from "./texture";
import { Color } from "./color";
import { ILineRenderOptions, getLineGeometry } from "./line";

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

    /** Background clear color [r, g, b, a], values range from 0 to 1. */
    backgroundColor: Color = Color.Black();

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

    /** Internal ping-pong RenderTextures for multi-filter chains. */
    private _filterRT: [RenderTexture | null, RenderTexture | null] = [null, null];

    /**
     * Creates a new Rapid application instance.
     * @param options Initialization options including the target canvas.
     */
    constructor(options: IAppOptions) {
        this.canvas = options.canvas;
        this.dpr = window.devicePixelRatio || 1;

        const gl = getContext(this.canvas);
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
        // Premultiplied alpha blending: RGB is already multiplied by A in the texture
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.enable(gl.STENCIL_TEST);

        // Default stencil configuration: always pass, keep existing values
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

        // Expose debug variable globally
        // @ts-ignore
        window.debug = this;
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

    /**
     * Draws a rectangular sprite using the current world matrix from matrixStack.
     * @param texture  The WebGL texture wrapper.
     * @param color    An optional tint color applied to the sprite.
     * @param customShader An optional custom shader overriding the region's default shader.
     */
    drawSprite(
        texture: Texture,
        color?: Color,

        flipX: boolean = false,
        flipY: boolean = false,

        customShader?: GLShader | CustomGlShader,
        customMatrix?: number
    ): void {
        if (this.inCreateMask) {
            return;
        }
        this.enterRegion(this.spriteRegion, customShader);

        let u = texture.uvX, v = texture.uvY, w = texture.uvW, h = texture.uvH;
        if (flipX) { u += w; w = -w; }
        if (flipY) { v += h; h = -h; }

        this.spriteRegion.drawSprite(
            texture,
            customMatrix ?? this.matrixStack.curWorldM,
            u,
            v,
            w,
            h,
            color?.uint32 ?? 0xFFFFFFFF,
        );
    }

    /**
     * Draws a line geometry based on the provided options.
     * @param options Line rendering options.
     * @param color An optional tint color applied to the line.
     * @param customShader An optional custom shader overriding the region's default shader.
     * @param customMatrix An optional custom matrix to use for transformation.
     */
    drawLine(
        options: ILineRenderOptions,
        color?: Color,
        customShader?: GLShader | CustomGlShader,
        customMatrix?: number
    ): void {
        if (this.inCreateMask) {
            return;
        }

        const { vertices, uv } = getLineGeometry(options);
        if (vertices.length === 0) return;

        this.startGraphic(this.gl.TRIANGLES, options.texture, customShader, customMatrix);
        const unitColor = color?.uint32 ?? 0xFFFFFFFF;
        for (let i = 0; i < vertices.length; i++) {
            this.addGraphicVertex(vertices[i].x, vertices[i].y, uv[i].x, uv[i].y, unitColor);
        }
        this.endGraphic();
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
        this.graphicRegion.startGraphic(customMatrix ?? this.matrixStack.curWorldM, drawMode, texture?.glTexture!);
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
    drawMaskImage(texture: Texture, customMatrix?: number): void {
        this.startMaskGraphic(this.gl.TRIANGLE_FAN, texture, customMatrix);
        this.addRectVertex(texture.width, texture.height);
        this.endGraphic();
    }

    /**
     * Pushes vertices for a rectangle geometry. Should be enclosed by startGraphic and endGraphic.
     * @param w The width of the rectangle.
     * @param h The height of the rectangle.
     * @param color An optional tint color.
     */
    addRectVertex(w: number, h: number, color?: Color): void {
        const unitColor = color?.uint32 ?? 0xFFFFFFFF;
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
        const unitColor = color?.uint32 ?? 0xFFFFFFFF;
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
     * @param physicsWidth Optional new physical pixel width (canvas width).
     * @param physicsHeight Optional new physical pixel height (canvas height).
     */
    resize(logicWidth: number, logicHeight: number, physicsWidth?: number, physicsHeight?: number): void {
        this.flush();
        const cssW = this.canvas.clientWidth || this.canvas.width;
        const cssH = this.canvas.clientHeight || this.canvas.height;

        this.logicWidth = logicWidth;
        this.logicHeight = logicHeight;

        this.physicsWidth = physicsWidth || Math.round(cssW * this.dpr);
        this.physicsHeight = physicsHeight || Math.round(cssH * this.dpr);

        this.canvas.width = this.physicsWidth;
        this.canvas.height = this.physicsHeight;

        this.gl.viewport(0, 0, this.physicsWidth, this.physicsHeight);
        this.updateProjection(0, this.logicWidth, this.logicHeight, 0);
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
        const { r, g, b, a } = this.backgroundColor;
        gl.clearColor(r, g, b, a);
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
     *          Draw it with `rapid.drawSprite(result)` to display it on screen.
     *
     * @example
     * const result = rapid.applyFilters(tex, [blurShader, outlineShader]);
     * rapid.drawSprite(result);
     */
    applyFilters(source: Texture, shaders: CustomGlShader[]): RenderTexture {
        if (shaders.length === 0) {
            throw new Error("applyFilters: shaders array must not be empty.");
        }

        // source.width/height already reflects the region size (not the full base texture).
        // drawSprite uses the region UV, so only the region pixels are rendered into the RT.
        // The output RT contains the "baked" region content — no region metadata needed.
        const w = source.width;
        const h = source.height;

        // Ensure both ping-pong RTs exist and match the source size (grow-only: no GPU
        // reallocation unless size exceeds the previous maximum)
        for (let i = 0; i < 2; i++) {
            if (!this._filterRT[i]) {
                this._filterRT[i] = this.texture.createRenderTexture(w, h);
            } else {
                this._filterRT[i]!.resize(w, h);
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

            this.drawSprite(inputTex, undefined, false, false, shaders[i]);

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
        gl.clearColor(color.r, color.g, color.b, color.a);
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
                // Premultiplied alpha: source RGB is already multiplied by A
                gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
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
}
