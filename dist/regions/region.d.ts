import { IAttribute, WebGLContext } from "../interface";
import { WebglBufferArray } from "../math";
import Rapid from "../render";
import GLShader from "../webgl/glshader";
import { Uniform } from "../webgl/uniform";
declare class RenderRegion {
    currentShader?: GLShader;
    protected webglArrayBuffer: WebglBufferArray;
    protected rapid: Rapid;
    protected gl: WebGLContext;
    protected usedTextures: WebGLTexture[];
    protected shaders: Map<string, GLShader>;
    protected isCostumShader: boolean;
    private costumUnifrom?;
    private defaultShader?;
    private maxTextureUnits;
    constructor(rapid: Rapid);
    getTextureUnitList(): number[];
    protected addVertex(x: number, y: number, ..._: unknown[]): void;
    /**
     * 使用纹理，必须在渲染操作之前
     * @param texture
     * @returns
     */
    useTexture(texture: WebGLTexture): [number, boolean];
    freeTextureUnitNum(): number;
    enterRegion(customShader?: GLShader): void;
    updateProjection(): void;
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
