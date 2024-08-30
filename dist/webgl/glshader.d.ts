import { IAttribute, UniformType } from "../interface";
import Rapid from "../render";
declare class GLShader {
    attributeLoc: Record<string, number>;
    uniformLoc: Record<string, WebGLUniformLocation>;
    program: WebGLProgram;
    attribute: IAttribute[];
    private gl;
    constructor(rapid: Rapid, vs: string, fs: string, attribute: IAttribute[]);
    setUniforms(uniforms: UniformType): void;
    private getUniform;
    use(): void;
    parseShader(shader: string): void;
    setAttribute(element: IAttribute): void;
}
export default GLShader;
