import { ILineStyleOptions } from "./interface";
import { Vec2 } from "./math";
/**
 * @ignore
 */
export declare const getLineNormal: (points: Vec2[], closed?: boolean) => {
    normals: {
        normal: Vec2;
        miters: number;
    }[];
    length: number;
};
export declare const getLineGeometry: (options: ILineStyleOptions) => {
    vertices: Vec2[];
    uv: Vec2[];
};
