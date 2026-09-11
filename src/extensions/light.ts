import { MaskType } from "../render";
import type { Rapid } from "../render";
import { CustomGlShader } from "../webgl/glshader";
import type { UniformValue } from "../webgl/glshader";
import FsShaderSource from "../shader/light.frag?raw";
import VsShaderSource from "../shader/light.vert?raw";

import { Vec2 } from "../math";
import { RenderTexture, Texture } from "../texture";
import { Color } from "../color";
import type { MatrixSaveState } from "../matrix-engine";
import { toArray } from "../utils";
import { generateShader } from "../webgl/utils";
import { Region } from "../region/region";

export const MAX_LIGHTS = 8

export class LightShader extends CustomGlShader {
    constructor(rapid: Rapid, vs: string = "", fs: string = "", usedTextureUnitNum = 0, uniforms?: Record<string, UniformValue>) {
        super(
            rapid,
            vs, fs,
            usedTextureUnitNum + 2,
            uniforms
        )
        this.prefix.push("light_")
    }

    getGLShader(region: Region, key: string, baseVS: string, baseFS: string) {
        const fs = generateShader(FsShaderSource, region.getMaxTexutreUnit(this), "layer", "lightUV", "lightTex = ")
        baseFS = this.replaceCustomCode(baseFS, fs)
        baseVS = this.replaceCustomCode(baseVS, VsShaderSource)

        return super.getGLShader(region, key, baseVS, baseFS)
    }
}

export type LightMatrix = number | MatrixSaveState

export interface ILight {
    lightMatrix: LightMatrix | LightMatrix[],
    normalMap: Texture,
    lightTexture: Texture[] | Texture,
    metallic?: number,
    roughness?: number,
    color?: Color | Color[],
    lightHeight?: number | number[],
    customShader?: LightShader,

    normalScaleY?: number
    normalScaleX?: number
}

export class Light {
    shader: CustomGlShader
    rapid: Rapid
    rt: RenderTexture

    constructor(rapid: Rapid) {
        this.rapid = rapid
        this.shader = new LightShader(rapid)
        this.rt = rapid.texture.createRenderTexture({ width: 0, height: 0 })
    }

    lightShadow(texture: Texture, lightMatrix: LightMatrix, points: Array<Vec2>) {
        if (points.length === 0) return

        const rapid = this.rapid
        const matrixIndex = typeof lightMatrix === "number" ? lightMatrix : lightMatrix.world
        const light = new Vec2(texture.rawWidth * 0.5, texture.rawHeight * 0.5)

        const texturePoints = points.map(point => {
            // 先把顶点转化为世界
            const world = rapid.matrixStack.localToWorld(point.x, point.y)
            // 转化到LightTexture的基向量。1代表LightTexture的直径
            const local = rapid.matrix.worldToLocal(matrixIndex, world.x, world.y)
            return new Vec2(
                // 要把LightTexture的基向量转化为RenderTexture的坐标
                // 纹理是从左上角开始的，所以要 + 0.5
                (local.x + 0.5) * texture.rawWidth,
                (local.y + 0.5) * texture.rawHeight,
            )
        })

        this.rt.resize(texture.rawWidth, texture.rawHeight);

        // 贴图外接圆半径 1.05 作为安全余量
        const R = Math.hypot(texture.rawWidth, texture.rawHeight) * 0.5 * 1.05;

        rapid.drawToRenderTexture(this.rt, () => {
            rapid.withMask(() => {
                rapid.startMaskGraphic(rapid.gl.TRIANGLES);

                for (let i = 0; i < texturePoints.length; i++) {
                    const a = texturePoints[i];
                    const b = texturePoints[(i + 1) % texturePoints.length];

                    const aDir = a.subtract(light).normalized();
                    const bDir = b.subtract(light).normalized();

                    const dot = Math.max(-0.999, Math.min(1, aDir.dot(bDir)));
                    const cosHalf = Math.sqrt((1 + dot) * 0.5);
                    const dist = R / cosHalf;

                    const farA = light.add(aDir.multiply(dist));
                    const farB = light.add(bDir.multiply(dist));

                    rapid.addGraphicVertex(a.x, a.y);
                    rapid.addGraphicVertex(b.x, b.y);
                    rapid.addGraphicVertex(farB.x, farB.y);

                    rapid.addGraphicVertex(a.x, a.y);
                    rapid.addGraphicVertex(farB.x, farB.y);
                    rapid.addGraphicVertex(farA.x, farA.y);
                }

                rapid.endGraphic();
            }, () => {
                rapid.drawSprite({ texture })
            }, MaskType.NOT_EQUAL)
        })
        return this.rt
    }


    setupLight(option: ILight) {
        const shader = option.customShader ?? this.shader
        const matrices = toArray(option.lightMatrix, MAX_LIGHTS)
        const colors = toArray(option.color, MAX_LIGHTS)
        const heights = toArray(option.lightHeight, MAX_LIGHTS)
        const lightTexture = toArray(option.lightTexture, MAX_LIGHTS)
        shader.setUniforms({
            uResolution: [this.rapid.physicsWidth, this.rapid.physicsHeight],
            uLogicalResolution: [this.rapid.logicWidth, this.rapid.logicHeight],
            uNormalMap: option.normalMap.glTexture!,
            uLightTextureId: lightTexture.map(l => l.glTexture),
            uLightCount: matrices.length,
            uLightMatrix: Float32Array.from(matrices.flatMap(matrix =>
                Array.from(this.rapid.matrix.getMatrix(typeof matrix === "number" ? matrix : matrix.world))
            )),
            uLightColor: Float32Array.from(matrices.flatMap((_, i) => {
                const color = colors[i] ?? colors[0]
                return color ? [color.r / 255, color.g / 255, color.b / 255, color.a / 255] : [1, 1, 1, 1]
            })),
            uLightHeight: Float32Array.from(matrices.map((_, i) => heights[i] ?? heights[0] ?? 80)),
            uMetallic: option.metallic ?? 0.8,
            uRoughness: option.roughness ?? 0.15,
            uNormalScale: [option.normalScaleX ?? 1, option.normalScaleY ?? 1],
        })

        return shader
    }
}
