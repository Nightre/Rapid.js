import { ILineOptions } from "./interface";
import { Vec2 } from "./math";
/**
 * @ignore
 */
export declare const getLineNormal: (points: Vec2[], closed?: boolean) => {
    normal: Vec2;
    miters: number;
}[];
export declare const getLineGeometry: (options: ILineOptions) => Vec2[];
