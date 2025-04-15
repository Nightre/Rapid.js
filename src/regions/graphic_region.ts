
import type Rapid from "../render";
import fragString from "../shader/graphic.frag";
import vertString from "../shader/graphic.vert";
import { Uniform } from "../webgl/uniform";
import RenderRegion from "./region";
import { graphicAttributes } from "./attributes";
import { Texture } from "../texture";
import { Vec2 } from "../math";

//                       aPosition  aColor
const FLOAT32_PER_VERTEX = 3
class GraphicRegion extends RenderRegion {
    private vertex: number = 0
    private texture?: number
    private offset = Vec2.ZERO 
    drawType: number
    constructor(rapid: Rapid) {
        super(rapid)
        this.drawType = rapid.gl.TRIANGLE_FAN
        this.setShader('default', vertString, fragString, graphicAttributes)
    }
    startRender(offsetX: number, offsetY: number, texture?: Texture, uniforms?:Uniform) {
        uniforms && this.currentShader?.setUniforms(uniforms, this)
        this.offset = new Vec2(offsetX, offsetY)
        this.vertex = 0
        this.webglArrayBuffer.clear()
        if (texture && texture.base) {
            this.texture = this.useTexture(texture.base.texture)[0]
        }
    }
    override addVertex(x: number, y: number, u: number, v: number, color: number): void {
        this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX)
        super.addVertex(x + this.offset.x, y + this.offset.y)
        this.webglArrayBuffer.pushUint32(color)
        this.webglArrayBuffer.pushFloat32(u)
        this.webglArrayBuffer.pushFloat32(v)
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

export default GraphicRegion