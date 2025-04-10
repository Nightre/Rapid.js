import { IAttribute, WebGLContext } from "../interface";
import { WebglBufferArray } from "../math";
import Rapid from "../render";
import GLShader from "../webgl/glshader";
import { Uniform } from "../webgl/uniform";
declare class RenderRegion {
    currentShader?: GLShader;
    private currentShaderName;
    protected webglArrayBuffer: WebglBufferArray;
    protected rapid: Rapid;
    protected gl: WebGLContext;
    protected usedTextures: WebGLTexture[];
    protected needBind: Set<number>;
    protected shaders: Map<string, GLShader>;
    protected isCostumShader: boolean;
    protected readonly MAX_TEXTURE_UNIT_ARRAY: number[];
    private costumUnifrom?;
    private defaultShader?;
    constructor(rapid: Rapid);
    setTextureUnits(usedTexture: number): number[];
    protected addVertex(x: number, y: number, ..._: unknown[]): void;
    protected useTexture(texture: WebGLTexture): number;
    enterRegion(customShader?: GLShader): void;
    setCostumUnifrom(newCurrentUniform: Uniform): boolean;
    exitRegion(): void;
    protected initDefaultShader(vs: string, fs: string, attributes?: IAttribute[]): void;
    setShader(name: string, vs: string, fs: string, attributes?: IAttribute[]): void;
    getShader(name: string): GLShader | undefined;
    render(): void;
    protected executeRender(): void;
    protected initializeForNextRender(): void;
    hasPendingContent(): boolean;
    isShaderChanged(shader?: GLShader): boolean;
}
export default RenderRegion;
