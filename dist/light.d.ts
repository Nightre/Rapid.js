import { Vec2 } from "./math";
import Rapid from "./render";
export declare class LightManager {
    render: Rapid;
    constructor(render: Rapid);
    createLightShadowMaskPolygon(occlusion: Vec2[][], lightSource: Vec2, baseProjectionLength?: number): Vec2[][];
}
