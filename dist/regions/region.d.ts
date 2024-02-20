import { IAttribute, WebGLContext } from "../interface";
import { WebglBufferArray } from "../math";
import Rapid from "../render";
import GLShader from "../webgl/glshader";
declare class RenderRegion {
    currentShader?: GLShader;
    protected defaultShader: GLShader;
    protected attribute: IAttribute[];
    protected webglArrayBuffer: WebglBufferArray;
    protected rapid: Rapid;
    protected gl: WebGLContext;
    protected usedTextures: WebGLTexture[];
    protected readonly TEXTURE_UNITS_ARRAY: number[];
    constructor(rapid: Rapid, attributes?: IAttribute[]);
    protected addVertex(x: number, y: number, ..._: unknown[]): void;
    protected useTexture(texture: WebGLTexture): number;
    enterRegion(customShader?: GLShader): void;
    exitRegion(): void;
    protected initDefaultShader(vs: string, fs: string): void;
    render(): void;
    protected executeRender(): void;
    protected initializeForNextRender(): void;
}
export default RenderRegion;
