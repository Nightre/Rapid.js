import { IAttribute } from "../interface";
import Rapid from "../render";
declare class GLShader {
    attributeLoc: Record<string, number>;
    unifromLoc: Record<string, WebGLUniformLocation>;
    program: WebGLProgram;
    private gl;
    constructor(rapid: Rapid, vs: string, fs: string);
    use(): void;
    parseShader(shader: string): void;
    setAttribute(element: IAttribute): void;
}
export default GLShader;
