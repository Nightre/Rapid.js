import { Rapid } from "..";
import RenderRegion from "./region";
declare class GraphicRegion extends RenderRegion {
    private vertex;
    constructor(rapid: Rapid);
    startRender(): void;
    addVertex(x: number, y: number, color: number): void;
    drawCircle(x: number, y: number, radius: number, color: number): void;
    protected executeRender(): void;
}
export default GraphicRegion;
