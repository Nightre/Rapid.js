import RenderRegion from "./region";
import Rapid from "../render";
import { UniformType } from "../interface";
import GLShader from "../webgl/glshader";
declare class SpriteRegion extends RenderRegion {
    private batchSprite;
    private indexBuffer;
    protected readonly MAX_BATCH: number;
    constructor(rapid: Rapid);
    protected addVertex(x: number, y: number, u: number, v: number, textureUnit: number, color: number): void;
    renderSprite(texture: WebGLTexture, width: number, height: number, u0: number, v0: number, u1: number, v1: number, offsetX: number, offsetY: number, color: number, uniforms?: UniformType): void;
    protected executeRender(): void;
    enterRegion(customShader?: GLShader | undefined): void;
    protected initializeForNextRender(): void;
    hasPendingContent(): boolean;
}
declare const spriteAttributes: ({
    name: string;
    size: number;
    type: number;
    stride: number;
    offset?: undefined;
    normalized?: undefined;
} | {
    name: string;
    size: number;
    type: number;
    stride: number;
    offset: number;
    normalized?: undefined;
} | {
    name: string;
    size: number;
    type: number;
    stride: number;
    offset: number;
    normalized: boolean;
})[];
export { spriteAttributes };
export default SpriteRegion;
