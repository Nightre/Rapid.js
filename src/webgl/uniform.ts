import { UniformType, WebGLContext } from '../interface';

export class Uniform {
    private data: UniformType
    isDirty: boolean = false
    constructor(data: UniformType) {
        this.data = data
    }
    setUniform(key: string, data: UniformType[string]) {
        if (this.data[key] != data) {
            this.isDirty = true
        }
        this.data[key] = data
    }
    /**
     * @ignore
     */
    clearDirty() {
        this.isDirty = false
    }
    getUnifromNames(){
        return Object.keys(this.data)
    }
    bind(gl: WebGLContext, uniformName: string, loc: WebGLUniformLocation, usedTextureUnit: number) {
        const value = this.data[uniformName];
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
        } else if (value.base?.texture) {
            gl.activeTexture(gl.TEXTURE0 + usedTextureUnit);
            gl.bindTexture(gl.TEXTURE_2D, value.base.texture);
            gl.uniform1i(loc, usedTextureUnit);
            usedTextureUnit += 1
        } else {
            console.error(`Unsupported uniform type for ${uniformName}:`, typeof value);
        }
        return usedTextureUnit
    }
}