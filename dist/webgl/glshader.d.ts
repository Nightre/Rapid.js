import { IAttribute, UniformType } from "../interface";
import Rapid from "../render";
declare class GLShader {
    attributeLoc: Record<string, number>;
    uniformLoc: Record<string, WebGLUniformLocation>;
    program: WebGLProgram;
    private gl;
    constructor(rapid: Rapid, vs: string, fs: string);
    setUniforms(uniforms: UniformType, usedTextureUnit: number): void;
    private getUniform;
    use(): void;
    parseShader(shader: string): void;
    setAttribute(element: IAttribute): void;
}
export default GLShader;
