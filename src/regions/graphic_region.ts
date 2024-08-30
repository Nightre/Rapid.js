
import { Rapid } from "..";
import fragString from "../shader/graphic.frag";
import vertString from "../shader/graphic.vert";
import { FLOAT, UNSIGNED_BYTE } from "../webgl/utils";
import RenderRegion from "./region";

//                       aPosition  aColor
const BYTES_PER_VERTEX = 2 * 4 + 4
const FLOAT32_PER_VERTEX = 3
class GraphicRegion extends RenderRegion {
    private vertex: number = 0
    constructor(rapid: Rapid) {
        super(rapid, graphicAttributes)

        this.initDefaultShader(vertString, fragString)
    }
    startRender() {
        this.vertex = 0
        this.webglArrayBuffer.clear()
    }
    override addVertex(x: number, y: number, color: number): void {
        this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX)
        super.addVertex(x, y)
        this.webglArrayBuffer.pushUint(color)
        this.vertex += 1
    }
    drawCircle(x: number, y: number, radius: number, color: number): void {
        const numSegments = 30; // Increase this for a smoother circle
        const angleStep = (2 * Math.PI) / numSegments;

        this.startRender();
        this.addVertex(x, y, color); // Center point

        for (let i = 0; i <= numSegments; i++) {
            const angle = i * angleStep;
            const dx = x + radius * Math.cos(angle);
            const dy = y + radius * Math.sin(angle);
            this.addVertex(dx, dy, color);
        }

        this.executeRender();
    }

    protected override executeRender(): void {
        super.executeRender()
        const gl = this.gl

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertex)
        this.vertex = 0
    }
}

const stride = BYTES_PER_VERTEX
const graphicAttributes = [
    { name: "aPosition", size: 2, type: FLOAT, stride },
    { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
]
export { graphicAttributes }
export default GraphicRegion