import { IAttribute, UniformType } from "../interface";
import Rapid from "../render";
declare class GLShader {
    attributeLoc: Record<string, number>;
    uniformLoc: Record<string, WebGLUniformLocation>;
    program: WebGLProgram;
    private gl;
    constructor(rapid: Rapid, vs: string, fs: string);
    /**
     * Set the uniform of this shader
     * @param uniforms
     * @param usedTextureUnit How many texture units have been used
     */
    setUniforms(uniforms: UniformType, usedTextureUnit: number): void;
    private getUniform;
    /**
     * use this shader
     */
    use(): void;
    private parseShader;
    /**
     * Set vertex attributes in glsl shader
     * @param element
     */
    setAttribute(element: IAttribute): void;
}
export default GLShader;
