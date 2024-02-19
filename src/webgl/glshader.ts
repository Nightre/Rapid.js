import { IAttribute, WebGLContext } from "../interface"
import Rapid from "../render"
import { createShaderProgram } from "./utils"

class GLShader {
    attributeLoc: Record<string, number> = {}
    unifromLoc: Record<string, WebGLUniformLocation> = {}
    private program: WebGLProgram
    private gl: WebGLContext

    constructor(rapid: Rapid, vs: string, fs: string) {
        this.program = createShaderProgram(rapid.gl, vs, fs)
        this.gl = rapid.gl
        this.parseShader(vs);
    }
    use() {
        this.gl.useProgram(this.program)
    }
    parseShader(shader: string) {
        const gl = this.gl

        const attributeMatches = shader.match(/attribute\s+\w+\s+(\w+)/g);
        if (attributeMatches) {
            for (const match of attributeMatches) {
                const name = match.split(' ')[2];
                this.attributeLoc[name] = gl.getAttribLocation(this.program, name)!;
                gl.enableVertexAttribArray(this.attributeLoc[name]);
            }
        }

        const uniformMatches = shader.match(/uniform\s+\w+\s+(\w+)/g);
        if (uniformMatches) {
            for (const match of uniformMatches) {
                const name = match.split(' ')[2];
                this.unifromLoc[name] = gl.getUniformLocation(this.program, name)!;
            }
        }
    }
    setAttribute(element: IAttribute) {
        const gl = this.gl
        gl.vertexAttribPointer(
            this.attributeLoc[element.name],
            element.size,
            element.type,
            element.normalized || false,
            element.stride,
            element.offset || 0
        );
    }
}

export default GLShader