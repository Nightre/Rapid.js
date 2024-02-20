import RenderRegion from "./region";
import Rapid from "../render";
import GLShader from "../webgl/glshader";
declare class SpriteRegion extends RenderRegion {
    private batchSprite;
    private indexBuffer;
    protected readonly MAX_BATCH: number;
    constructor(rapid: Rapid);
    protected addVertex(x: number, y: number, u: number, v: number, textureUnit: number, color: number): void;
    renderSprite(texture: WebGLTexture, width: number, height: number, u0: number, v0: number, u1: number, v1: number, offsetX: number, offsetY: number, color: number): void;
    protected executeRender(): void;
    enterRegion(customShader?: GLShader | undefined): void;
    protected initializeForNextRender(): void;
    private generateFragShader;
}
export default SpriteRegion;
