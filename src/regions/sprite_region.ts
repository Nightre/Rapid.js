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
    ) {
        let rendered = false
        if (this.batchSprite >= MAX_BATCH) {
            !rendered && this.render()
            rendered = true
        }
        if (uniforms && this.setCostumUnifrom(uniforms)) {
            !rendered && this.render()
            this.currentShader!.setUniforms(uniforms, 0)
            rendered = true
        }
        if (this.rapid.projectionDirty) {
            !rendered && this.render()
            this.updateProjection()
            rendered = true
        }

        if (flipX) {
            const temp = u0;
            u0 = u1;
            u1 = temp;
        }
        if (flipY) {
            const temp = v0;
            v0 = v1;
            v1 = temp;
        }
        this.batchSprite++
        this.webglArrayBuffer.resize(FLOAT32_PER_SPRITE)

        const textureUnit = this.useTexture(texture)

        /**
         * 0-----1
         * | \   |
         * |   \ |
         * 3-----2
         */
        const posX = offsetX + width
        const posY = offsetY + height

        this.addVertex(offsetX, offsetY, u0, v0, textureUnit, color) // 0
        this.addVertex(posX, offsetY, u1, v0, textureUnit, color) // 1
        this.addVertex(posX, posY, u1, v1, textureUnit, color) // 2
        this.addVertex(offsetX, posY, u0, v1, textureUnit, color) // 3
    }
    protected override executeRender(): void {
        super.executeRender()
        const gl = this.gl
        gl.drawElements(gl.TRIANGLES, this.batchSprite * INDEX_PER_SPRITE, gl.UNSIGNED_SHORT, 0)
    }
    override enterRegion(customShader?: GLShader | undefined): void {
        super.enterRegion(customShader)
        this.indexBuffer.bindBuffer()

        this.gl.uniform1iv(
            this.currentShader!.uniformLoc["uTextures"],
            this.setTextureUnits(this.currentShader!.usedTexture)
        )
    }
    protected override initializeForNextRender(): void {
        super.initializeForNextRender()
        this.batchSprite = 0
    }
    override hasPendingContent(): boolean {
        return this.batchSprite > 0
    }
}

export default SpriteRegion