import { Color } from "./math";
import GLShader from "./webgl/glshader";
export type WebGLContext = WebGL2RenderingContext | WebGLRenderingContext;
export interface IRapiadOptions {
    canvas: HTMLCanvasElement;
    pixelDensity?: number;
    width?: number;
    height?: number;
    backgroundColor?: Color;
}
export interface IAttribute {
    name: string;
    size: number;
    type: number;
    normalized?: boolean;
    stride: number;
    offset?: number;
}
export interface IRenderSpriteOptions {
    color?: Color;
    shader?: GLShader;
    uniforms?: UniformType;
}
export type UniformType = Record<string, number | Array<any>>;
export type Images = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas;
