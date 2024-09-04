import { Rapid, Texture } from "..";
import RenderRegion from "./region";
declare class GraphicRegion extends RenderRegion {
    private vertex;
    private texture?;
    drawType: number;
    constructor(rapid: Rapid);
    startRender(texture?: Texture): void;
    addVertex(x: number, y: number, u: number, v: number, color: number): void;
    protected executeRender(): void;
}
declare const graphicAttributes: ({
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
    normalized: boolean;
} | {
    name: string;
    size: number;
    type: number;
    stride: number;
    offset: number;
    normalized?: undefined;
})[];
export { graphicAttributes };
export default GraphicRegion;
