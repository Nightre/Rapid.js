import RenderRegion from "./region";
import fragString from "../shader/sprite.frag";
import vertString from "../shader/sprite.vert";
import Rapid from "../render";
import { WebglElementBufferArray } from "../math";
import { WebGLContext } from "../interface";
import { FLOAT32_PER_SPRITE, INDEX_PER_SPRITE, VERTEX_PER_SPRITE, SPRITE_ELMENT_PER_VERTEX } from "../const";
import GLShader from "../webgl/glshader";

class SpriteElementArray extends WebglElementBufferArray {
    constructor(gl: WebGLContext) {
        super(gl, INDEX_PER_SPRITE, VERTEX_PER_SPRITE)
    }
    protected addObject(vertex: number): void {
        super.addObject()
        this.push(vertex)
        this.push(vertex + 3)
        this.push(vertex + 2)

        this.push(vertex)
        this.push(vertex + 1)
        this.push(vertex + 2)
    }
}


class SpriteRegion extends RenderRegion {
    private batchSprite: number = 0
    private indexBuffer: SpriteElementArray
    private usedTextures: WebGLTexture[] = []
    private colorBuffer: Uint32Array
    private readonly TEXTURE_UNITS_ARRAY: number[]
    private readonly MAX_BATCH: number
    constructor(rapid: Rapid) {
        const gl = rapid.gl
        const ELEMENT_SIZE = Float32Array.BYTES_PER_ELEMENT // = Uint32Array.BYTES_PER_ELEMENT
        const stride = SPRITE_ELMENT_PER_VERTEX * ELEMENT_SIZE
        super(rapid, [
            { name: "aPosition", size: 2, type: gl.FLOAT, stride },
            { name: "aRegion", size: 2, type: gl.FLOAT, stride, offset: 2 * ELEMENT_SIZE },
            { name: "aTextureId", size: 1, type: gl.FLOAT, stride, offset: 4 * ELEMENT_SIZE },
            { name: "aColor", size: 4, type: gl.UNSIGNED_BYTE, stride, offset: 5 * ELEMENT_SIZE, normalized: true },
        ])
        this.initDefaultShader(
            vertString,
            this.generateFragShader(fragString, rapid.MAX_TEXTURE_UNITS)
        )
        this.MAX_BATCH = this.getMaxBatchNnm()
        this.indexBuffer = new SpriteElementArray(gl)
        this.TEXTURE_UNITS_ARRAY = Array.from({ length: rapid.MAX_TEXTURE_UNITS },
            (_, index) => index);
        this.colorBuffer = new Uint32Array(this.webglArrayBuffer.arraybuffer)
    }
    protected onWebglArrayBufferResize(arrayBuffer: ArrayBuffer): void {
        this.colorBuffer = new Uint32Array(arrayBuffer)
    }
    private useTexture(texture: WebGLTexture) {
        let textureUnit = this.usedTextures.indexOf(texture)
        if (textureUnit === -1) {
            // 新纹理 
            if (this.usedTextures.length >= this.rapid.MAX_TEXTURE_UNITS) {
                this.render()
            }
            this.usedTextures.push(texture)
            textureUnit = this.usedTextures.length - 1
        }
        return textureUnit
    }
    protected addVertex(x: number, y: number, u: number, v: number, textureUnit: number, color: number): void {
        super.addVertex(x, y)

        this.webglArrayBuffer.push(u)
        this.webglArrayBuffer.push(v)
        this.webglArrayBuffer.push(textureUnit)
        //this.webglArrayBuffer.usedElemNum++
        this.colorBuffer[this.webglArrayBuffer.usedElemNum++] = color /// 0xFFFFFFF
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
        color: number
    ) {
        if (this.batchSprite > this.MAX_BATCH) {
            this.render()
        }
        this.batchSprite++
        this.indexBuffer.setObjects(this.batchSprite)
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

        const texU = u0 + u1
        const texV = v0 + v1

        this.addVertex(offsetX, offsetY, u0, v0, textureUnit, color) // 0
        this.addVertex(posX, offsetY, texU, v0, textureUnit, color) // 1
        this.addVertex(posX, posY, texU, texV, textureUnit, color) // 2
        this.addVertex(offsetX, posY, u0, texV, textureUnit, color) // 3
    }
    protected executeRender(): void {
        super.executeRender()
        const gl = this.gl
        this.usedTextures.forEach((texture, unit) => {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
        });
        this.indexBuffer.bindBuffer()
        this.indexBuffer.bufferData()
        this.gl.uniform1iv(
            this.currentShader!.unifromLoc["uTextures"],
            this.TEXTURE_UNITS_ARRAY
        )
        gl.drawElements(gl.TRIANGLES, this.batchSprite * INDEX_PER_SPRITE, gl.UNSIGNED_SHORT, 0)
    }
    enterRegion(customShader?: GLShader | undefined): void {
        super.enterRegion(customShader)

        this.gl.uniform1iv(
            this.currentShader!.unifromLoc["uTextures"],
            this.TEXTURE_UNITS_ARRAY
        )
    }
    protected initializeForNextRender(): void {
        super.initializeForNextRender()
        this.batchSprite = 0
        this.usedTextures = []
    }
    private generateFragShader(fs: string, max: number) {
        let code = ""
        fs = fs.replace("%TEXTURE_NUM%", max.toString())

        for (let index = 0; index < max; index++) {
            if (index == 0) {
                code += `if(vTextureId == ${index}.0)`
            } else if (index == max - 1) {
                code += `else`
            } else {
                code += `else if(vTextureId == ${index}.0)`
            }
            code += `{color = texture2D(uTextures[${index}], vRegion);}`
        }
        fs = fs.replace("%GET_COLOR%", code)

        return fs
    }
    private getMaxBatchNnm() {
        // webgl does not seem to provide a way to obtain the maximum webglbuffer
        return 10922
    }
}

export default SpriteRegion