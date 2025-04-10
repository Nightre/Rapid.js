import type Rapid from "../render";
import { Uniform } from "../webgl/uniform";
import RenderRegion from "./region";
import { Texture } from "../texture";
declare class GraphicRegion extends RenderRegion {
    private vertex;
    private texture?;
    private offset;
    drawType: number;
    constructor(rapid: Rapid);
    startRender(offsetX: number, offsetY: number, texture?: Texture, uniforms?: Uniform): void;
    addVertex(x: number, y: number, u: number, v: number, color: number): void;
    protected executeRender(): void;
}
export default GraphicRegion;
