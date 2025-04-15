import { IAttribute, ShaderType } from "../interface";
import Rapid from "../render";
import { Uniform } from "./uniform";
import RenderRegion from "../regions/region";
declare class GLShader {
    attributeLoc: Record<string, number>;
    uniformLoc: Record<string, WebGLUniformLocation>;
    program: WebGLProgram;
    textureUnitNum: number;
    private attributes;
    private gl;
    constructor(rapid: Rapid, vs: string, fs: string, attributes?: IAttribute[], textureUnitNum?: number);
    /**
     * Set the uniform of this shader
     * @param uniforms
     * @param usedTextureUnit How many texture units have been used
     */
    setUniforms(uniform: Uniform, region: RenderRegion): void;
    private getUniform;
    /**
     * use this shader
     */
    use(): void;
    private parseShader;
    /**
     * Set vertex attribute in glsl shader
     * @param element
     */
    setAttribute(element: IAttribute): void;
    /**
     * Set vertex attributes in glsl shader
     * @param elements
     */
    setAttributes(elements: IAttribute[]): void;
    updateAttributes(): void;
    static createCostumShader(rapid: Rapid, vs: string, fs: string, type: ShaderType, textureUnitNum?: number): GLShader;
}
export default GLShader;
