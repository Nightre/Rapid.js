
import { Rapid, Texture } from "..";
import fragString from "../shader/graphic.frag";
import vertString from "../shader/graphic.vert";
import { FLOAT, UNSIGNED_BYTE } from "../webgl/utils";
import RenderRegion from "./region";

//                       aPosition  aColor
const BYTES_PER_VERTEX = 2 * 4 + 4 + 2 * 4
const FLOAT32_PER_VERTEX = 3
class GraphicRegion extends RenderRegion {
    private vertex: number = 0
    private texture?: number
    drawType: number
    constructor(rapid: Rapid) {
        super(rapid, graphicAttributes)
        this.drawType = rapid.gl.TRIANGLE_FAN
        this.initDefaultShader(vertString, fragString)
    }
    startRender(texture?: Texture) {
        this.vertex = 0
        this.webglArrayBuffer.clear()
        if (texture && texture.base) {
            this.texture = this.useTexture(texture.base.texture)
        }
    }
    override addVertex(x: number, y: number, u: number, v: number, color: number): void {
        this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX)
        super.addVertex(x, y)
        this.webglArrayBuffer.pushUint(color)
        this.webglArrayBuffer.push(u)
        this.webglArrayBuffer.push(v)
        this.vertex += 1
    }

    protected override executeRender(): void {
        super.executeRender()
        const gl = this.gl

        gl.uniform1i(this.currentShader!.uniformLoc["uUseTexture"], typeof this.texture == "undefined" ? 0 : 1)
        if (this.texture) {
            gl.uniform1i(this.currentShader!.uniformLoc["uTexture"], this.texture)
        }

        gl.drawArrays(this.drawType, 0, this.vertex)
        this.drawType = this.rapid.gl.TRIANGLE_FAN
        this.vertex = 0
        this.texture = undefined
    }
}

const stride = BYTES_PER_VERTEX
const graphicAttributes = [
    { name: "aPosition", size: 2, type: FLOAT, stride },
    { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
    { name: "aRegion", size: 2, type: FLOAT, stride, offset: 3 * Float32Array.BYTES_PER_ELEMENT }
]
export { graphicAttributes }
export default GraphicRegion