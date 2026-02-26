import { Rapid } from "../render";
import { Region } from "./region";
import { CustomGlShader } from "../webgl/glshader";
import { ArrayType, WebglBufferArray } from "../buffer";
import { drawArraysInstanced, generateFragShader, UNSIGNED_BYTE } from "../webgl/utils";

import VsShaderSource from "../shader/sprite.vert?raw";
import FsShaderSource from "../shader/sprite.frag?raw";

// Per-instance buffer stride: 12 floats + 2 uint32 = 48 bytes
// layout:
//   aMatrixRow0  vec3        float32×3  offset  0  (a, c, tx)
//   aMatrixRow1  vec3        float32×3  offset 12  (b, d, ty)
//   aUVRect      vec4        float32×4  offset 24  (u0, v0, u1, v1)
//   aColor       vec4 u8×4   uint32×1   offset 40  (r,g,b,a 0-255, normalized)
//   aTextureId   float u8×1  uint32×1   offset 44  (texture unit index)
const INSTANCE_STRIDE = 48;

// Static quad vertices: 4 × vec2 for TRIANGLE_STRIP
// (0,0) (1,0) (0,1) (1,1)
const QUAD_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

export class SpriteRegion extends Region {
    private instanceBuffer: WebglBufferArray;
    private quadBuffer: WebglBufferArray;
    private instanceCount: number = 0;
    KEY = "Sprite"

    constructor(rapid: Rapid) {
        super(rapid);
        const gl = this.gl;

        // Static quad geometry buffer
        this.quadBuffer = new WebglBufferArray(gl, ArrayType.Float32, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
        this.quadBuffer.bindBuffer();
        for (const v of QUAD_VERTICES) this.quadBuffer.pushFloat32(v);
        this.quadBuffer.makeDirty();
        this.quadBuffer.bufferData();

        // Dynamic per-instance buffer — use Uint32 base type so we can
        // write both float32 and uint32 into the same ArrayBuffer
        this.instanceBuffer = new WebglBufferArray(gl, ArrayType.Uint32, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);

        const fs = generateFragShader(FsShaderSource, rapid.maxTextureUnits);
        this.createDefaultShader(VsShaderSource, fs);
    }

    createShader(vs: string, fs: string) {
        const shader = super.createShader(vs, fs);

        shader.use();
        shader.bindVAO();
        this.instanceBuffer.bindBuffer();
        shader.setAttributes([
            { name: "aMatrixRow0", size: 3, stride: INSTANCE_STRIDE, offset: 0, divisor: 1 },
            { name: "aMatrixRow1", size: 3, stride: INSTANCE_STRIDE, offset: 12, divisor: 1 },
            { name: "aUVRect", size: 4, stride: INSTANCE_STRIDE, offset: 24, divisor: 1 },
            { name: "aColor", size: 4, type: UNSIGNED_BYTE, normalized: true, stride: INSTANCE_STRIDE, offset: 40, divisor: 1 },
            { name: "aTextureId", size: 1, type: UNSIGNED_BYTE, stride: INSTANCE_STRIDE, offset: 44, divisor: 1 },
        ]);
        this.quadBuffer.bindBuffer();
        shader.setAttributes([
            { name: "aVertex", size: 2, stride: 8, offset: 0, divisor: 0 },
        ]);
        shader.unbindVAO();
        if (this.currentShader) {
            this.currentShader.use();
        }
        return shader;
    }

    createCustomShader(customShader: CustomGlShader) {
        const fs = generateFragShader(FsShaderSource, this.rapid.maxTextureUnits - customShader.usedTextureUnitNum);
        return customShader.getGLShader(this, this.KEY, this.vs, fs)
    }

    /**
     * Draws a textured sprite via instanced rendering to significantly improve performance.
     * @param texture The WebGLTexture to map.
     * @param matrixIndex The index for the transform matrix in MatrixStore.
     * @param width Render width.
     * @param height Render height.
     * @param u0 Left UV mapped coordinate (default 0).
     * @param v0 Top UV mapped coordinate (default 0).
     * @param u1 Right UV mapped coordinate (default 1).
     * @param v1 Bottom UV mapped coordinate (default 1).
     * @param color The tint color as packed ABGR uniform uint32 (default 0xFFFFFFFF).
     */
    drawSprite(
        texture: WebGLTexture,
        matrixIndex: number,
        width: number, height: number,
        u0: number = 0, v0: number = 0, u1: number = 1, v1: number = 1,
        color: number = 0xFFFFFFFF,
    ): void {
        // No free texture units — flush first to reset, then register
        if (this.freeTextureUnitNum === 0) {
            this.flush();
        }

        const textureId = this.useTexture(texture);

        // Read 2×3 affine matrix from MatrixStore and bake width/height into it.
        // We scale columns by width/height so the unit quad maps to pixel size.
        const o = matrixIndex * 6;
        const md = this.matrixStore.data;

        const buf = this.instanceBuffer;
        const index = buf.usedElemNum

        buf.resize(12)
        const f32 = buf.float32!;
        const u32 = buf.uint32!;

        f32[index] = md[o] * width;
        f32[index + 1] = md[o + 2] * height;
        f32[index + 2] = md[o + 4];

        f32[index + 3] = md[o + 1] * width;
        f32[index + 4] = md[o + 3] * height;
        f32[index + 5] = md[o + 5];

        f32[index + 6] = u0;
        f32[index + 7] = v0;

        f32[index + 8] = u1;
        f32[index + 9] = v1;

        u32[index + 10] = color;
        u32[index + 11] = textureId;

        buf.usedElemNum += 12;
        buf.makeDirty();
        this.instanceCount++;
    }

    override render(): void {
        if (this.instanceCount === 0) return;
        super.render();

        const gl = this.gl;
        const shader = this.currentShader;

        // Upload instance data, then replay all attribute bindings via VAO
        this.instanceBuffer.bindBuffer();
        this.instanceBuffer.bufferData();
        shader.bindVAO();

        drawArraysInstanced(gl, gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
        this.rapid.drawcallCount++;
    }

    override resetRender(): void {
        super.resetRender();
        this.instanceBuffer.clear();
        this.instanceCount = 0;
    }

    override hasPendingContent(): boolean {
        return this.instanceCount > 0;
    }
}

