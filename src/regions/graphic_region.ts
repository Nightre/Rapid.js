
import { Rapid } from "..";
import fragString from "../shader/graphic.frag";
import vertString from "../shader/graphic.vert";
import RenderRegion from "./region";

//             aPosition  aColor
const BYTES_PER_VERTEX = (2 * 4) + (4)

class GraphicRegion extends RenderRegion {
    private vertex: number = 0
    constructor(rapid: Rapid) {
        const gl = rapid.gl
        
        const stride = BYTES_PER_VERTEX
        super(rapid, [
            { name: "aPosition", size: 2, type: gl.FLOAT, stride },
            { name: "aColor", size: 4, type: gl.UNSIGNED_BYTE, stride, offset: 5 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
        ])
        this.initDefaultShader(vertString, fragString)
    }
    protected addVertex(x: number, y: number, color: number): void {
        super.addVertex(x, y)
        this.webglArrayBuffer.pushUint(color)
    }
    renderGraphic(vertexs: number[], offsetX = 0, offsetY = 0, color: number) {
        this.vertex = (vertexs.length / 2)
        this.webglArrayBuffer.resize(this.vertex * BYTES_PER_VERTEX)
        for (let index = 0; index < vertexs.length; index += 2) {
            this.addVertex(
                vertexs[index] + offsetX,
                vertexs[index + 1] + offsetY,
                color
            )
        }
        this.executeRender()
    }
    protected executeRender(): void {
        super.executeRender()
        const gl = this.gl
        gl.drawArrays(gl.TRIANGLE_FAN, this.vertex, 0)
    }
}

export default GraphicRegion