import { IAttribute, WebGLContext } from "../interface";
import { WebglBufferArray } from "../math";
import Rapid from "../render";
import GLShader from "../webgl/glshader";

class RenderRegion {
    currentShader?: GLShader
    protected defaultShader!: GLShader
    protected attribute: IAttribute[]
    protected webglArrayBuffer: WebglBufferArray
    protected rapid: Rapid
    protected gl: WebGLContext
    protected usedTextures: WebGLTexture[] = []
    protected readonly TEXTURE_UNITS_ARRAY: number[]
    protected needBind: Set<number> = new Set
    constructor(rapid: Rapid, attributes?: IAttribute[]) {
        this.attribute = attributes!

        this.rapid = rapid
        this.gl = rapid.gl
        this.webglArrayBuffer = new WebglBufferArray(rapid.gl, Float32Array, rapid.gl.ARRAY_BUFFER)
        this.TEXTURE_UNITS_ARRAY = Array.from({ length: rapid.maxTextureUnits },
            (_, index) => index);
    }
    protected addVertex(x: number, y: number, ..._: unknown[]) {
        const [tx, ty] = this.rapid.transformPoint(x, y)
        this.webglArrayBuffer.push(tx)
        this.webglArrayBuffer.push(ty)
    }
    protected useTexture(texture: WebGLTexture) {
        let textureUnit = this.usedTextures.indexOf(texture)
        if (textureUnit === -1) {
            // 新纹理 
            if (this.usedTextures.length >= this.rapid.maxTextureUnits) {
                this.render()
            }
            this.usedTextures.push(texture)
            textureUnit = this.usedTextures.length - 1
            this.needBind.add(textureUnit)
        }
        return textureUnit
    }
    enterRegion(customShader?: GLShader) {
        this.currentShader = customShader ?? this.defaultShader
        this.currentShader.use()
        this.initializeForNextRender()
        this.webglArrayBuffer.bindBuffer()

        for (const element of this.attribute) {
            this.currentShader!.setAttribute(element)
        }
        this.gl.uniformMatrix4fv(
            this.currentShader.uniformLoc["uProjectionMatrix"],
            false, this.rapid.projection
        )
    }
    exitRegion() { }
    protected initDefaultShader(vs: string, fs: string) {
        this.webglArrayBuffer.bindBuffer()
        this.defaultShader = new GLShader(this.rapid, vs, fs)
    }
    render() {
        this.executeRender()
        this.initializeForNextRender()
    }
    protected executeRender() {

        this.webglArrayBuffer.bufferData()
        const gl = this.gl

        for (const unit of this.needBind) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        }
        this.needBind.clear()
    }
    protected initializeForNextRender() {
        this.webglArrayBuffer.clear()
        this.usedTextures = []
    }
}

export default RenderRegion