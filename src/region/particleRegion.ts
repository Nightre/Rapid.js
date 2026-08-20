import { SpriteRegion } from "./spriteRegion";
import VsShaderSource from "../shader/particle.vert?raw";
import FsShaderSource from "../shader/particle.frag?raw";
import { Rapid } from "../render";
import GLShader, { CustomGlShader } from "../webgl/glshader";
import { drawArraysInstanced, UNSIGNED_BYTE } from "../webgl/utils";
import { Texture } from "../texture";
import { MAX_INSTANCES } from "./region";
import { composeProjectionWithAffine } from "../math";

// Per-instance buffer stride: 9 floats + 1 packed color = 40 bytes
// layout:
//   aPosition    vec2        float32×2  offset  0  (x, y)
//   aScale       vec2        float32×2  offset  8  (scaleX, scaleY)
//   aRotation    float       float32×1  offset 16  (angle in radians)
//   aUVRect      vec4        float32×4  offset 20  (u0, v0, u1, v1)
//   aColor       vec4        float32×4  offset 36  (r, g, b, a, 0–1)
const INSTANCE_STRIDE = 40;
const INSTANCE_ELEMS = INSTANCE_STRIDE / 4;

export class ParticleRegion extends SpriteRegion {
    KEY = "ParticleSprite"
    texture?: Texture

    constructor(rapid: Rapid) {
        super(rapid)
    }

    createCustomShader(customShader: CustomGlShader) {
        // override sprite Region
        return customShader.getGLShader(this, this.KEY, VsShaderSource, FsShaderSource)
    }

    createDefaultShader() {
        const fs = FsShaderSource;
        const vs = VsShaderSource;
        this.vs = vs;
        this.fs = fs;
        this.defaultShader = this.createShader(vs, fs)
        return this.defaultShader;
    }

    enter(customShader?: GLShader | CustomGlShader): void {
        super.enter(customShader)
        this.currentShader.setUniform("u_projection", this.rapid.projection);
    }

    createShader(vs: string, fs: string) {
        const shader = super.createShader(vs, fs);

        shader.use();
        shader.bindVAO();
        this.instanceBuffer.bindBuffer();
        shader.setAttributes([
            { name: "aPosition", size: 2, stride: INSTANCE_STRIDE, offset: 0, divisor: 1 },
            { name: "aScale", size: 2, stride: INSTANCE_STRIDE, offset: 8, divisor: 1 },
            { name: "aRotation", size: 1, stride: INSTANCE_STRIDE, offset: 16, divisor: 1 },
            { name: "aUVRect", size: 4, stride: INSTANCE_STRIDE, offset: 20, divisor: 1 },
            { name: "aColor", size: 4, type: UNSIGNED_BYTE, normalized: true, stride: INSTANCE_STRIDE, offset: 36, divisor: 1 },
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

    drawParticle(
        texture: Texture,
        x: number = 0, y: number = 0,
        scaleX: number = 1, scaleY: number = 1,
        rotation: number = 0,
        u0: number = 0, v0: number = 0, u1: number = 1, v1: number = 1,
        color: number = 0xFFFFFFFF,
        flipX: boolean = false,
        flipY: boolean = false,
        isRotated: boolean = false,
    ): void {
        if (this.instanceCount >= MAX_INSTANCES || (this.texture && texture != this.texture)) {
            this.flush();
        }

        if (texture.glTexture) {
            this.texture = texture
            // It does not rely on the region to set the texture;
            // it merely occupies a texture unit to prevent the custom shader from overwriting it
            this.useTexture(texture.glTexture, 0, 0)
        }

        const buf = this.instanceBuffer;
        const index = buf.usedElemNum;
        const rawWidth = texture.rawWidth;
        const rawHeight = texture.rawHeight;

        buf.resize(INSTANCE_ELEMS);
        const f32 = buf.float32!;
        const u32 = buf.uint32!;

        // aPosition
        f32[index] = x;
        f32[index + 1] = y;

        // aScale
        f32[index + 2] = scaleX * (flipX ? -1 : 1) * rawWidth;
        f32[index + 3] = scaleY * (flipY ? -1 : 1) * rawHeight;

        // aRotation
        f32[index + 4] = rotation;
        if (isRotated) {
            f32[index + 4] += Math.PI / 2;
        }

        // aUVRect
        f32[index + 5] = u0;
        f32[index + 6] = v0;
        f32[index + 7] = u1;
        f32[index + 8] = v1;

        // aColor
        u32[index + 9] = color;

        buf.usedElemNum += INSTANCE_ELEMS;
        buf.makeDirty();
        this.instanceCount++;
    }

    drawParticles(
        texture: Texture,
        x: Array<number>,
        y: Array<number>,
        rotation: Array<number>,
        color: Array<number>,
        count: number,
        scaleX: number = 1,
        scaleY: number = 1,
        u0: number = 0, v0: number = 0, u1: number = 1, v1: number = 1,
        flipX: boolean = false,
        flipY: boolean = false,
        isRotated: boolean = false,
    ): void {
        if (!texture.glTexture || count <= 0) return;

        let offset = 0;
        const rawWidth = texture.rawWidth * scaleX * (flipX ? -1 : 1);
        const rawHeight = texture.rawHeight * scaleY * (flipY ? -1 : 1);
        const rotationOffset = isRotated ? Math.PI / 2 : 0;

        while (offset < count) {
            if (this.texture && texture !== this.texture) {
                this.flush();
            }

            if (!this.texture) {
                this.texture = texture;
                this.useTexture(texture.glTexture, 0, 0);
            }

            const remaining = count - offset;
            const available = MAX_INSTANCES - this.instanceCount;
            const batchCount = Math.min(remaining, available);
            const buf = this.instanceBuffer;
            let index = buf.usedElemNum;

            buf.resize(batchCount * INSTANCE_ELEMS);
            const f32 = buf.float32!;
            const u32 = buf.uint32!;

            for (let i = 0; i < batchCount; i++) {
                const sourceIndex = offset + i;

                // aPosition
                f32[index] = x[sourceIndex];
                f32[index + 1] = y[sourceIndex];

                // aScale
                f32[index + 2] = rawWidth;
                f32[index + 3] = rawHeight;

                // aRotation
                f32[index + 4] = rotation[sourceIndex] + rotationOffset;

                // aUVRect
                f32[index + 5] = u0;
                f32[index + 6] = v0;
                f32[index + 7] = u1;
                f32[index + 8] = v1;

                // aColor
                u32[index + 9] = color[sourceIndex];
                index += INSTANCE_ELEMS;
            }

            buf.usedElemNum = index;
            buf.makeDirty();
            this.instanceCount += batchCount;
            offset += batchCount;

            if (this.instanceCount >= MAX_INSTANCES) {
                this.flush();
            }
        }
    }

    override render(): void {
        if (this.instanceCount === 0) return;
        super.render();

        const gl = this.gl
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture.glTexture);
        }

        const shader = this.currentShader;

        // Upload instance data, then replay all attribute bindings via VAO
        this.instanceBuffer.bindBuffer();
        this.instanceBuffer.bufferData();
        shader.bindVAO();

        const matrix = composeProjectionWithAffine(this.rapid.projection, this.worldSpriteMatrix)
        this.currentShader.setUniform("u_projection", matrix);

        drawArraysInstanced(gl, gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
        this.rapid.drawcallCount++;
        this.texture = undefined;
    }
}
