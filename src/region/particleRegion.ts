import { SpriteRegion } from "./spriteRegion";
import VsShaderSource from "../shader/particle.vert?raw";
import FsShaderSource from "../shader/particle.frag?raw";
import { Rapid } from "../render";
import GLShader, { CustomGlShader } from "../webgl/glshader";
import { drawArraysInstanced, UNSIGNED_BYTE } from "../webgl/utils";
import { Texture } from "../texture";
import { composeProjectionWithAffine } from "../math";
import { Color } from "../color";

// Per-instance buffer stride: 11 floats + 1 packed color = 48 bytes
// layout:
//   aPosition    vec2        float32×2  offset  0  (x, y)
//   aScale       vec2        float32×2  offset  8  (scaleX, scaleY)
//   aRotation    float       float32×1  offset 16  (angle in radians)
//   aUVRect      vec4        float32×4  offset 20  (u0, v0, u1, v1)
//   aColor       vec4        uint8×4    offset 36  (r, g, b, a, 0–255)
//   aOrigin      vec2        float32×2  offset 40  (normalized pivot)
const INSTANCE_STRIDE = 48;
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
            { name: "aOrigin", size: 2, stride: INSTANCE_STRIDE, offset: 40, divisor: 1 },
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

    drawParticles(
        texture: Texture,
        x: Array<number>,
        y: Array<number>,
        rotation: Array<number>,
        color: Array<Color>,
        count: number,
        scaleX: Array<number> | number = 1,
        scaleY: Array<number> | number = 1,
        u0: number = 0, v0: number = 0, u1: number = 1, v1: number = 1,
        flipX: boolean = false,
        flipY: boolean = false,
        isRotated: boolean = false,
        originX: number = 0.5,
        originY: number = 0.5,
        premultipliedAlpha: boolean,
    ): void {
        if (!texture.glTexture || count <= 0) return;

        let offset = 0;

        const uniScaleX = typeof scaleX == "number"
        const uniScaleY = typeof scaleY == "number"

        let rawWidth = texture.rawWidth * (flipX ? -1 : 1);
        if (uniScaleX) {
            rawWidth *= scaleX
        }

        let rawHeight = texture.rawHeight * (flipY ? -1 : 1);
        if (uniScaleY) {
            rawHeight *= scaleY
        }

        const rotationOffset = isRotated ? Math.PI / 2 : 0;

        while (offset < count) {
            if (this.texture && texture !== this.texture) {
                this.flush();
            }

            if (!this.texture) {
                this.texture = texture;
                this.useTexture(texture.glTexture, 0, 0);
            }

            const batchCount = count - offset;
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
                f32[index + 2] = uniScaleX ? rawWidth : rawWidth * scaleX[sourceIndex];
                f32[index + 3] = uniScaleY ? rawHeight : rawHeight * scaleY[sourceIndex];

                // aRotation
                f32[index + 4] = rotation[sourceIndex] + rotationOffset;

                // aUVRect
                f32[index + 5] = u0;
                f32[index + 6] = v0;
                f32[index + 7] = u1;
                f32[index + 8] = v1;

                // aColor
                const curColor = color[sourceIndex]
                if (curColor) {
                    u32[index + 9] = premultipliedAlpha ? curColor.premultipliedUint32 : curColor.uint32;
                } else {
                    u32[index + 9] = 0xFFFFFFFF;
                }

                // aOrigin
                f32[index + 10] = originX;
                f32[index + 11] = originY;
                index += INSTANCE_ELEMS;
            }

            buf.usedElemNum = index;
            buf.makeDirty();
            this.instanceCount += batchCount;
            offset += batchCount;
        }
    }

    override render(): void {
        if (this.instanceCount === 0) return;
        this.prepareRender();

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

        const ms = this.rapid.matrixStack
        const m = this.rapid.matrix
        const worldMatrix = m.getMatrix(ms.curWorldM)

        const matrix = composeProjectionWithAffine(this.rapid.projection, worldMatrix)
        this.currentShader.setUniform("u_projection", matrix);

        drawArraysInstanced(gl, gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
        this.rapid.drawcallCount++;
        this.texture = undefined;
    }
}
