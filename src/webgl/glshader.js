import { createShaderProgram } from "./utils";
class GLShader {
    constructor(rapid, vs, fs) {
        Object.defineProperty(this, "attributeLoc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "unifromLoc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "program", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.program = createShaderProgram(rapid.gl, vs, fs);
        this.gl = rapid.gl;
        this.parseShader(vs);
        this.parseShader(fs);
    }
    use() {
        this.gl.useProgram(this.program);
    }
    parseShader(shader) {
        const gl = this.gl;
        const attributeMatches = shader.match(/attribute\s+\w+\s+(\w+)/g);
        if (attributeMatches) {
            for (const match of attributeMatches) {
                const name = match.split(' ')[2];
                this.attributeLoc[name] = gl.getAttribLocation(this.program, name);
            }
        }
        const uniformMatches = shader.match(/uniform\s+\w+\s+(\w+)/g);
        if (uniformMatches) {
            for (const match of uniformMatches) {
                const name = match.split(' ')[2];
                this.unifromLoc[name] = gl.getUniformLocation(this.program, name);
            }
        }
    }
    setAttribute(element) {
        const gl = this.gl;
        gl.vertexAttribPointer(this.attributeLoc[element.name], element.size, element.type, element.normalized || false, element.stride, element.offset || 0);
        gl.enableVertexAttribArray(this.attributeLoc[element.name]);
    }
}
export default GLShader;
