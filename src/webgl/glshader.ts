import { IAttribute, UniformType, WebGLContext } from "../interface"
import Rapid from "../render"
import { createShaderProgram, generateFragShader } from "./utils"

class GLShader {
    attributeLoc: Record<string, number> = {}
    uniformLoc: Record<string, WebGLUniformLocation> = {}
    program: WebGLProgram
    attribute: IAttribute[]
    private gl: WebGLContext

    constructor(rapid: Rapid, vs: string, fs: string, attribute: IAttribute[]) {
        const processedFragmentShaderSource = generateFragShader(fs, rapid.maxTextureUnits)
        this.program = createShaderProgram(rapid.gl, vs, processedFragmentShaderSource)
        this.gl = rapid.gl
        this.attribute = attribute
        this.parseShader(vs);
        this.parseShader(processedFragmentShaderSource);
    }
    setUniforms(uniforms: UniformType) {
        const gl = this.gl;
        for (const uniformName in uniforms) {
            const value = uniforms[uniformName];
            const loc = this.getUniform(uniformName);
            if (typeof value === 'number') {
                gl.uniform1f(loc, value);
            } else if (Array.isArray(value)) {
                switch (value.length) {
                    case 1:
                        if (Number.isInteger(value[0])) {
                            gl.uniform1i(loc, value[0]);
                        } else {
                            gl.uniform1f(loc, value[0]);
                        }
                        break;
                    case 2:
                        if (Number.isInteger(value[0])) {
                            gl.uniform2iv(loc, value);
                        } else {
                            gl.uniform2fv(loc, value);
                        }
                        break;
                    case 3:
                        if (Number.isInteger(value[0])) {
                            gl.uniform3iv(loc, value);
                        } else {
                            gl.uniform3fv(loc, value);
                        }
                        break;
                    case 4:
                        if (Number.isInteger(value[0])) {
                            gl.uniform4iv(loc, value);
                        } else {
                            gl.uniform4fv(loc, value);
                        }
                        break;
                    case 9:
                        gl.uniformMatrix3fv(loc, false, value);
                        break;
                    case 16:
                        gl.uniformMatrix4fv(loc, false, value);
                        break;
                    default:
                        console.error(`Unsupported uniform array length for ${uniformName}:`, value.length);
                        break;
                }
            } else if (typeof value === 'boolean') {
                gl.uniform1i(loc, value ? 1 : 0);
            } else {
                console.error(`Unsupported uniform type for ${uniformName}:`, typeof value);
            }
        }
    }
    
    private getUniform(name: string) {
        return this.uniformLoc[name]
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
                const loc = gl.getAttribLocation(this.program, name)!
                if (loc != -1) this.attributeLoc[name] = loc
            }
        }

        const uniformMatches = shader.match(/uniform\s+\w+\s+(\w+)/g);
        if (uniformMatches) {
            for (const match of uniformMatches) {
                const name = match.split(' ')[2];
                this.uniformLoc[name] = gl.getUniformLocation(this.program, name)!;
            }
        }
    }
    setAttribute(element: IAttribute) {
        const loc = this.attributeLoc[element.name]
        if (typeof loc != "undefined") {
            const gl = this.gl
            gl.vertexAttribPointer(
                loc,
                element.size,
                element.type,
                element.normalized || false,
                element.stride,
                element.offset || 0
            );
            gl.enableVertexAttribArray(loc);
        }
    }
}

export default GLShader