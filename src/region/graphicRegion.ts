import { Rapid } from "../render";
import { Region } from "./region";
import GLShader from "../webgl/glshader";
import { ArrayType, WebglBufferArray } from "../buffer";

import VsShaderSource from "../shader/graphic.vert?raw";
import FsShaderSource from "../shader/graphic.frag?raw";

import MaskVsShaderSource from "../shader/mask.vert?raw";
import MaskFsShaderSource from "../shader/mask.frag?raw";

// Per-vertex layout (stride = 20 bytes): 8 + 4 + 8
//   aPosition  vec2   float32×2  offset  0
//   aColor     vec4   u8×4       offset  8
//   aUV        vec2   float32×2  offset 12
const VERTEX_STRIDE = 20;

export class GraphicRegion extends Region {
    private vertexBuffer: WebglBufferArray;
    private vertexCount: number = 0;

    matrixIndex: number = -1
    drawMode: number = this.gl.TRIANGLES

    texture?: WebGLTexture

    maskShader: GLShader
    KEY = "Graphic"

    constructor(rapid: Rapid) {
        super(rapid);
        const gl = this.gl;

        this.vertexBuffer = new WebglBufferArray(gl, ArrayType.Float32, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
        this.createDefaultShader(VsShaderSource, FsShaderSource);
        this.maskShader = this.createMaskShader(MaskVsShaderSource, MaskFsShaderSource);
    }

    createMaskShader(vs: string, fs: string) {
        const gl = this.gl;
        const shader = new GLShader(gl, vs, fs);
        shader.use();
        shader.bindVAO();
        this.vertexBuffer.bindBuffer();
        shader.setAttributes([
            { name: "aPosition", size: 2, type: gl.FLOAT, stride: VERTEX_STRIDE - 4, offset: 0, divisor: 0 },
            { name: "aUV", size: 2, type: gl.FLOAT, stride: VERTEX_STRIDE - 4, offset: 8, divisor: 0 },
        ]);
        shader.unbindVAO();
        if (this.currentShader) {
            this.currentShader.use();
        }
        return shader;
    }

    createShader(vs: string, fs: string) {
        const gl = this.gl;
        const shader = super.createShader(vs, fs);

        shader.use();
        shader.bindVAO();
        this.vertexBuffer.bindBuffer();
        shader.setAttributes([
            { name: "aPosition", size: 2, type: gl.FLOAT, stride: VERTEX_STRIDE, offset: 0, divisor: 0 },
            { name: "aColor", size: 4, type: gl.UNSIGNED_BYTE, normalized: true, stride: VERTEX_STRIDE, offset: 8, divisor: 0 },
            { name: "aUV", size: 2, type: gl.FLOAT, stride: VERTEX_STRIDE, offset: 12, divisor: 0 },
        ]);
        shader.unbindVAO();
        if (this.currentShader) {
            this.currentShader.use();
        }
        return shader;
    }

    /**
     * Begins a new polygon drawing sequence. Must be followed by addVertex() calls and endGraphic().
     * @param matrixIndex The index targeting a specific transform matrix in the MatrixStore.
     * @param drawMode The WebGL drawing primitive mode (e.g., gl.TRIANGLES).
     * @param texture Optional texture to apply over the polygon.
     */
    startGraphic(
        matrixIndex: number,
        drawMode: number = this.gl.TRIANGLES,
        texture?: WebGLTexture,
    ): void {
        this.vertexBuffer.clear();
        this.vertexCount = 0;

        this.matrixIndex = matrixIndex;
        this.drawMode = drawMode;
        this.texture = texture;
    }

    /**
     * Adds a vertex to the current polygon. Local coordinates and color settings.
     * @param x Local X coordinate.
     * @param y Local Y coordinate.
     * @param u UV mapped X value (0-1, default 0).
     * @param v UV mapped Y value (0-1, default 0).
     * @param color Pre-multiplied hex color combined using ABGR byte order (default 0xFFFFFFFF).
     */
    addVertex(
        x: number, y: number,
        u: number = 0, v: number = 0,
        color: number = 0xFFFFFFFF,
    ): void {
        const buf = this.vertexBuffer;
        buf.pushFloat32(x);
        buf.pushFloat32(y);
        if (this.currentShader != this.maskShader) {
            buf.pushUint32(color);
        }
        buf.pushFloat32(u);
        buf.pushFloat32(v);
        this.vertexCount++;
        this.vertexBuffer.makeDirty();
    }

    /**
     * Finishes the graphic construction and dispatches the rendering call immediately.
     */
    endGraphic(): void {
        this.render();
    }

    render() {
        if (this.vertexCount === 0) return;
        super.render();

        const gl = this.gl;
        const shader = this.currentShader;
        const o = this.matrixIndex * 6;
        const md = this.matrixStore.data;

        shader.setUniform("uMatrixRow0", [md[o], md[o + 2], md[o + 4]]);
        shader.setUniform("uMatrixRow1", [md[o + 1], md[o + 3], md[o + 5]]);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            shader.setUniform("uTexture", 0);
            shader.setUniform("uUseTexture", 1);
        } else {
            shader.setUniform("uUseTexture", 0);
        }

        this.vertexBuffer.bindBuffer();
        this.vertexBuffer.bufferData();

        shader.bindVAO();

        gl.drawArrays(this.drawMode, 0, this.vertexCount);
        this.rapid.drawcallCount++;
    }

    override hasPendingContent(): boolean {
        return false;
    }
}
