import RenderRegion from "./region";
import fragString from "../shader/sprite.frag";
import vertString from "../shader/sprite.vert";

import Rapid from "../render";
import { WebglElementBufferArray } from "../math";
import { UniformType, WebGLContext } from "../interface";
import GLShader from "../webgl/glshader";
import { FLOAT, UNSIGNED_BYTE } from "../webgl/utils";
import { Uniform } from "../webgl/uniform";
import { spriteAttributes } from "./attributes"

const INDEX_PER_SPRITE = 6
const VERTEX_PER_SPRITE = 4

const SPRITE_ELMENT_PER_VERTEX = 5

const FLOAT32_PER_SPRITE = VERTEX_PER_SPRITE * SPRITE_ELMENT_PER_VERTEX
// 2 ** 16 = Unit16 MAX_VALUE / VERTEX_PER_SPRITE = MAX_BATCH
const MAX_BATCH = Math.floor(2 ** 16 / VERTEX_PER_SPRITE)

class SpriteElementArray extends WebglElementBufferArray {
    constructor(gl: WebGLContext, max: number) {
        super(gl, INDEX_PER_SPRITE, VERTEX_PER_SPRITE, max)
    }
    protected override addObject(vertex: number): void {
        super.addObject()
        this.pushUint16(vertex)
        this.pushUint16(vertex + 1)
        this.pushUint16(vertex + 2)

        this.pushUint16(vertex)
        this.pushUint16(vertex + 3)
        this.pushUint16(vertex + 2)
    }
}

class SpriteRegion extends RenderRegion {
    private batchSprite: number = 0
    private indexBuffer: SpriteElementArray
    private spriteTextureUnits: number[] = []
    private spriteTextureUnitIndexOffset: number = 0

    constructor(rapid: Rapid) {
        const gl = rapid.gl
        super(rapid)
        this.setShader("default", vertString, fragString, spriteAttributes)
        this.indexBuffer = new SpriteElementArray(gl, MAX_BATCH)
    }

    protected override addVertex(x: number, y: number, u: number, v: number, textureUnit: number, color: number): void {
        super.addVertex(x, y)

        this.webglArrayBuffer.pushFloat32(u)
        this.webglArrayBuffer.pushFloat32(v)
        this.webglArrayBuffer.pushFloat32(textureUnit)
        this.webglArrayBuffer.pushUint32(color)
    }
    renderSprite(texture: WebGLTexture,
        width: number,
        height: number,
        u0: number,
        v0: number,
        u1: number,
        v1: number,
        offsetX: number,
        offsetY: number,
        color: number,
        uniforms?: Uniform,
        flipX?: boolean,
        flipY?: boolean,
        additionalTexturenit: number = 0
    ) {
        if (
            1 + additionalTexturenit > this.freeTextureUnitNum()
            || this.batchSprite >= MAX_BATCH
            || (uniforms && this.setCostumUnifrom(uniforms))
            || this.rapid.projectionDirty
        ) {
            this.render()

            if (uniforms) this.currentShader!.setUniforms(uniforms, this)
            if (this.rapid.projectionDirty) this.updateProjection()
        }

        this.batchSprite++
        this.webglArrayBuffer.resize(FLOAT32_PER_SPRITE)

        const [textureUnit, isNew] = this.useTexture(texture)
        if (isNew) {
            this.spriteTextureUnits.push(textureUnit)
            this.spriteTextureUnitIndexOffset = this.spriteTextureUnits[0]
        }
        const textureIndex = textureUnit - this.spriteTextureUnitIndexOffset
        /**
         * 0-----1
         * | \   |
         * |   \ |
         * 3-----2
         */

        const uA = flipX ? u1 : u0
        const uB = flipX ? u0 : u1
        const vA = flipY ? v1 : v0
        const vB = flipY ? v0 : v1

        const x1 = offsetX
        const x2 = offsetX + width
        const y1 = offsetY
        const y2 = offsetY + height

        this.addVertex(x1, y1, uA, vA, textureIndex, color)
        this.addVertex(x2, y1, uB, vA, textureIndex, color)
        this.addVertex(x2, y2, uB, vB, textureIndex, color)
        this.addVertex(x1, y2, uA, vB, textureIndex, color)
    }

    protected override executeRender(): void {
        super.executeRender()
        if (this.batchSprite <= 0) return

        const gl = this.gl
        if (this.spriteTextureUnits.length > 0) {
            this.gl.uniform1iv(
                this.currentShader!.uniformLoc["uTextures"],
                this.spriteTextureUnits
            )
        }
        gl.drawElements(gl.TRIANGLES, this.batchSprite * INDEX_PER_SPRITE, gl.UNSIGNED_SHORT, 0)
    }
    override enterRegion(customShader?: GLShader | undefined): void {
        super.enterRegion(customShader)
        this.indexBuffer.bindBuffer()
    }
    protected override initializeForNextRender(): void {
        super.initializeForNextRender()
        this.batchSprite = 0
        this.spriteTextureUnits.length = 0
    }
    override hasPendingContent(): boolean {
        return this.batchSprite > 0
    }
}

export default SpriteRegion