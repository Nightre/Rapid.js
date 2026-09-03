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
//   aPosition    vec2        float32×2  offset  8  (x, y)
//   aScale       vec2        float32×2  offset 16  (scaleX, scaleY)
//   aRotation    float       float32×1  offset 20  (angle in radians)
//   aUVRect      vec4        float32×4  offset 36  (u0, v0, u1, v1)
//   aColor       vec4        uint8×4    offset 40  (r, g, b, a, 0–255)
//   aOrigin      vec2        float32×2  offset 48  (normalized pivot)
const INSTANCE_STRIDE = 48;
const INSTANCE_ELEMS = INSTANCE_STRIDE / 4;

export class ParticleRegion extends SpriteRegion {
    KEY = "ParticleSprite"
    texture?: Texture
    customMatrix?: number
    particleLoopCache = new Map<string, Function>();

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
        x: ArrayLike<number>,
        y: ArrayLike<number>,
        rotation: ArrayLike<number> | number = 0,
        color: ArrayLike<Color> | ArrayLike<number> | number = 0xFFFFFFFF,
        count: number,
        scaleX: ArrayLike<number> | number = 1,
        scaleY: ArrayLike<number> | number = 1,
        u0: ArrayLike<number> | number = 0,
        v0: ArrayLike<number> | number = 0,
        u1: ArrayLike<number> | number = 1,
        v1: ArrayLike<number> | number = 1,
        flipX: boolean = false,
        flipY: boolean = false,
        isRotated: boolean = false,
        originX: number = 0.5,
        originY: number = 0.5,
        premultipliedAlpha: boolean,
        reverseOrder: boolean = false,
        customMatrix?: number
    ): void {
        if (!texture.glTexture || count <= 0) return;
        if (this.texture && texture !== this.texture) {
            this.flush();
        }

        const uniScaleX = typeof scaleX == "number"
        const uniScaleY = typeof scaleY == "number"
        const uniRotation = typeof rotation == "number"
        const uniColor = typeof color == "number"
        const uniUV = typeof u0 == "number"
        const numberColor = !uniColor && typeof color[0] == "number"

        let rawWidth = texture.rawWidth * (flipX ? -1 : 1);
        if (uniScaleX) {
            rawWidth *= scaleX
        }

        let rawHeight = texture.rawHeight * (flipY ? -1 : 1);
        if (uniScaleY) {
            rawHeight *= scaleY
        }
        if (uniUV) {
            rawWidth *= u1 as number - (u0 as number)
            rawHeight *= v1 as number - (v0 as number)
        }

        let rotationOffset = isRotated ? Math.PI / 2 : 0;
        if (uniRotation) {
            rotationOffset += rotation
        }
        const staticColor = color ?? 0xFFFFFFFF
        const loopFunction = this.getParticleLoop(
            uniScaleX,
            uniScaleY,
            uniRotation,
            uniUV,
            uniColor,
            numberColor,
            reverseOrder,
            premultipliedAlpha,
        )

        if (!this.texture) {
            this.texture = texture;
            this.useTexture(texture.glTexture, 0, 0);
        }

        const batchCount = count;
        const buf = this.instanceBuffer;
        let index = buf.usedElemNum;

        buf.resize(batchCount * INSTANCE_ELEMS);
        const f32 = buf.float32!;
        const u32 = buf.uint32!;

        index = loopFunction(
            x, y, scaleX, scaleY, rotation, u0, v0, u1, v1, color,
            f32, u32, rawWidth, rawHeight, rotationOffset, staticColor,
            originX, originY, count, batchCount, index
        )

        buf.usedElemNum = index;
        buf.makeDirty();
        this.instanceCount += batchCount;

        this.customMatrix = customMatrix
        this.flush()
    }

    getParticleLoop(
        uniScaleX: boolean,
        uniScaleY: boolean,
        uniRotation: boolean,
        uniUV: boolean,
        uniColor: boolean,
        numberColor: boolean,
        reverseOrder: boolean,
        premultipliedAlpha: boolean,
    ): Function {
        const flags = [...arguments].join("_")

        if (this.particleLoopCache.has(flags)) {
            return this.particleLoopCache.get(flags)!;
        }

        let code = `
return function( x, y, scaleX, scaleY, rotation, u0, v0, u1, v1, color, f32, u32, rawWidth, rawHeight, rotationOffset, staticColor, originX, originY, count, batchCount, index ) {
    ${(uniScaleX && uniUV) ? `const baseSx = rawWidth;` : ''}
    ${(uniScaleY && uniUV) ? `const baseSy = rawHeight;` : ''}

    const endIdx = index + batchCount * 12;
    let idx = index;
    if (endIdx > f32.length) return index;
    
    ${reverseOrder
        ? `for (let src = count - 1; idx < endIdx; src--, idx += 12) {`
        : `for (let src = 0; idx < endIdx; src++, idx += 12) {`
    }
        f32[idx]     = x[src];
        f32[idx + 1] = y[src];

        ${uniUV ? `
        f32[idx + 2] = ${uniScaleX ? 'baseSx' : 'rawWidth * scaleX[src]'};
        f32[idx + 3] = ${uniScaleY ? 'baseSy' : 'rawHeight * scaleY[src]'};
        f32[idx + 4] = ${uniRotation ? 'rotationOffset' : 'rotation[src] + rotationOffset'};
        f32[idx + 5] = u0;
        f32[idx + 6] = v0;
        f32[idx + 7] = u1;
        f32[idx + 8] = v1;
        ` : `
        const cu0 = u0[src], cv0 = v0[src], cu1 = u1[src], cv1 = v1[src];
        f32[idx + 2] = (rawWidth * (cu1 - cu0)) ${uniScaleX ? '' : '* scaleX[src]'};
        f32[idx + 3] = (rawHeight * (cv1 - cv0)) ${uniScaleY ? '' : '* scaleY[src]'};
        f32[idx + 4] = ${uniRotation ? 'rotationOffset' : 'rotation[src] + rotationOffset'};
        f32[idx + 5] = cu0;
        f32[idx + 6] = cv0;
        f32[idx + 7] = cu1;
        f32[idx + 8] = cv1;
        `}

        u32[idx + 9] = ${
            uniColor ? 'staticColor' :
            numberColor ? 'color[src]' :
            `color[src].${premultipliedAlpha ? 'premultipliedUint32' : 'uint32'}`
        };

        f32[idx + 10] = originX;
        f32[idx + 11] = originY;
    }
    return idx;
}
`;
        const compiledFunc = new Function(code)();
        this.particleLoopCache.set(flags, compiledFunc);

        return compiledFunc;
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
        const worldMatrix = m.getMatrix(this.customMatrix ?? ms.curWorldM)

        const matrix = composeProjectionWithAffine(this.rapid.projection, worldMatrix)
        this.currentShader.setUniform("u_projection", matrix);

        drawArraysInstanced(gl, gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
        this.rapid.drawcallCount++;
        this.texture = undefined;
        this.customMatrix = undefined
    }
}
