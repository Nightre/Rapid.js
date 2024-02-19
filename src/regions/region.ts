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
    constructor(rapid: Rapid, attributes?: IAttribute[]) {
        this.attribute = attributes!
        this.rapid = rapid
        this.gl = rapid.gl
        this.webglArrayBuffer = new WebglBufferArray(rapid.gl, Float32Array, rapid.gl.ARRAY_BUFFER)
    }
    protected addVertex(x: number, y: number, ..._: unknown[]) {
        const [tx, ty] = this.rapid.transformPoint(x, y)
        this.webglArrayBuffer.push(tx)
        this.webglArrayBuffer.push(ty)
    }
    enterRegion(customShader?: GLShader) {
        this.currentShader = customShader ?? this.defaultShader
        this.currentShader.use()
        this.initializeForNextRender()
        this.webglArrayBuffer.bindBuffer()
        this.attribute.forEach((element) => {
            this.currentShader?.setAttribute(element)
        })
        this.gl.uniformMatrix4fv(
            this.currentShader.unifromLoc["uProjectionMatrix"],
            false, this.rapid.projection
        )
    }
    exitRegion() { }
    protected initDefaultShader(vs: string, fs: string) {
        this.defaultShader = new GLShader(this.rapid, vs, fs)
    }
    render() {
        this.executeRender()
        this.initializeForNextRender()
    }
    protected executeRender() {
        this.webglArrayBuffer.bindBuffer()
        this.webglArrayBuffer.bufferData()
    }
    protected initializeForNextRender() {
        this.webglArrayBuffer.clear()
    }
}

export default RenderRegion