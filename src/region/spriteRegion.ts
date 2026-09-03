import { Rapid } from "../render";
import { Region } from "./region";
import { CustomGlShader } from "../webgl/glshader";
import { ArrayType, WebglBufferArray } from "../buffer";
import { drawArraysInstanced, generateShader, UNSIGNED_BYTE } from "../webgl/utils";

import VsShaderSource from "../shader/sprite.vert?raw";
import FsShaderSource from "../shader/sprite.frag?raw";

import { Texture } from "../texture";

// Per-instance buffer stride: 12 floats + 2 uint32 = 48 bytes
// layout:
//   aMatrixRow0  vec3        float32×3  offset  12 (a, c, tx)
//   aMatrixRow1  vec3        float32×3  offset  24 (b, d, ty)
//   aUVRect      vec4        float32×4  offset  40 (u0, v0, u1, v1)
//   aColor       vec4 u8×4   uint32×1   offset  44 (r,g,b,a 0-255, normalized)
//   aTextureId   float u8×1  uint32×1   offset  48 (texture unit index)
const INSTANCE_STRIDE = 48;

// Static quad vertices: 4 × vec2 for TRIANGLE_STRIP
// (0,0) (1,0) (0,1) (1,1)
export const QUAD_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

export class SpriteRegion extends Region {
    protected instanceBuffer!: WebglBufferArray;
    protected quadBuffer!: WebglBufferArray;
    protected instanceCount: number = 0;
    protected localSpriteMatrix = new Float32Array(6);
    protected worldSpriteMatrix = new Float32Array(6);

    KEY = "Sprite"

    constructor(rapid: Rapid) {
        super(rapid);

        this.createBuffer()
        this.createDefaultShader()
    }

    createBuffer() {
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
    }

    createDefaultShader() {
        const rapid = this.rapid
        const fs = generateShader(FsShaderSource, rapid.maxTextureUnits);
        const vs = generateShader(VsShaderSource, rapid.maxTextureUnits);
        this.vs = vs;
        this.fs = fs;
        this.defaultShader = this.createShader(vs, fs)
        return this.defaultShader;
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
        const fs = generateShader(FsShaderSource, this.rapid.maxTextureUnits - customShader.usedTextureUnitNum);
        const vs = generateShader(VsShaderSource, this.rapid.maxTextureUnits - customShader.usedTextureUnitNum);

        return customShader.getGLShader(this, this.KEY, vs, fs)
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
        texture: Texture,
        matrixIndex: number,
        u0: number = 0, v0: number = 0, u1: number = 1, v1: number = 1,
        color: number = 0xFFFFFFFF,
        paddingX: number = 0,
        paddingY: number = 0,
        flipX: boolean = false,
        flipY: boolean = false,
        isRotated: boolean = false,
    ): void {
        const o = matrixIndex * 6;
        const md = this.matrixStore.data;

        this.drawSpriteAffine(
            texture,
            md[o],
            md[o + 1],
            md[o + 2],
            md[o + 3],
            md[o + 4],
            md[o + 5],
            u0,
            v0,
            u1,
            v1,
            color,
            paddingX,
            paddingY,
            flipX,
            flipY,
            isRotated,
        );
    }

    drawSpriteAffine(
        texture: Texture,

        matrixA: number,
        matrixB: number,
        matrixC: number,
        matrixD: number,
        matrixTx: number,
        matrixTy: number,

        u0: number = 0, v0: number = 0, u1: number = 1, v1: number = 1,
        color: number = 0xFFFFFFFF,
        paddingX: number = 0,
        paddingY: number = 0,
        flipX: boolean = false,
        flipY: boolean = false,
        isRotated: boolean = false,
    ): void {
        const base = texture.base!;

        const rawWidth = texture.rawWidth;
        const rawHeight = texture.rawHeight;

        const offsetX = texture.offsetX;
        const offsetY = texture.offsetY;

        // base.width is full texture size, texture.width is alts texture size
        const textureId = this.useTexture(
            texture.glTexture!,
            paddingX / base.width,
            paddingY / base.height
        );

        const buf = this.instanceBuffer;
        const index = buf.usedElemNum

        buf.resize(12)
        const f32 = buf.float32!;
        const u32 = buf.uint32!;

        const width = isRotated ? rawHeight : rawWidth;
        const height = isRotated ? rawWidth : rawHeight;

        const drawWidth = width + 2 * paddingX;
        const drawHeight = height + 2 * paddingY;

        const originX = offsetX - paddingX;
        const originY = offsetY - paddingY;

        const local = this.localSpriteMatrix;

        if (isRotated) {
            local[0] = 0;
            local[1] = flipY ? drawHeight : -drawHeight;
            local[2] = flipX ? -drawWidth : drawWidth;
            local[3] = 0;
            local[4] = originX + (flipX ? drawWidth : 0);
            local[5] = originY + (flipY ? 0 : drawHeight);
        } else {
            local[0] = flipX ? -drawWidth : drawWidth;
            local[1] = 0;
            local[2] = 0;
            local[3] = flipY ? -drawHeight : drawHeight;
            local[4] = originX + (flipX ? drawWidth : 0);
            local[5] = originY + (flipY ? drawHeight : 0);
        }

        const world = this.worldSpriteMatrix;
        world[0] = matrixA * local[0] + matrixC * local[1];
        world[1] = matrixB * local[0] + matrixD * local[1];
        world[2] = matrixA * local[2] + matrixC * local[3];
        world[3] = matrixB * local[2] + matrixD * local[3];

        world[4] = matrixTx + matrixA * local[4] + matrixC * local[5];
        world[5] = matrixTy + matrixB * local[4] + matrixD * local[5];

        f32[index + 6] = u0;
        f32[index + 7] = v0;

        f32[index + 8] = u1;
        f32[index + 9] = v1;

        u32[index + 10] = color;
        u32[index + 11] = textureId;

        if (this.rapid.roundPixels) {
            world[4] = Math.round(world[4]);
            world[5] = Math.round(world[5]);
        }

        f32[index] = world[0];
        f32[index + 1] = world[2];
        f32[index + 2] = world[4];
        f32[index + 3] = world[1];
        f32[index + 4] = world[3];
        f32[index + 5] = world[5];

        buf.usedElemNum += 12;
        buf.makeDirty();
        this.instanceCount++;
    }

    override render(): void {
        if (this.instanceCount === 0) return;
        this.prepareRender();

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

