import fragString from "../shader/graphic.frag";
import vertString from "../shader/graphic.vert";
import RenderRegion from "./region";
//                       aPosition  aColor
const BYTES_PER_VERTEX = 2 * 4 + 4;
const FLOAT32_PER_VERTEX = 3;
class GraphicRegion extends RenderRegion {
    constructor(rapid) {
        const gl = rapid.gl;
        const stride = BYTES_PER_VERTEX;
        super(rapid, [
            { name: "aPosition", size: 2, type: gl.FLOAT, stride },
            { name: "aColor", size: 4, type: gl.UNSIGNED_BYTE, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
        ]);
        Object.defineProperty(this, "vertex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.initDefaultShader(vertString, fragString);
    }
    startRender() {
        this.vertex = 0;
        this.webglArrayBuffer.clear();
    }
    addVertex(x, y, color) {
        this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX);
        super.addVertex(x, y);
        this.webglArrayBuffer.pushUint(color);
        this.vertex += 1;
    }
    executeRender() {
        super.executeRender();
        const gl = this.gl;
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertex);
        this.vertex = 0;
    }
}
export default GraphicRegion;
