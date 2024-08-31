import { Rapid } from "..";
import RenderRegion from "./region";
declare class GraphicRegion extends RenderRegion {
    private vertex;
    drawType: number;
    constructor(rapid: Rapid);
    startRender(): void;
    addVertex(x: number, y: number, color: number): void;
    drawCircle(x: number, y: number, radius: number, color: number): void;
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
})[];
export { graphicAttributes };
export default GraphicRegion;
