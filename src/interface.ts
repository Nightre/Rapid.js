import { Color, Vec2 } from "./math";
import { Texture } from "./texture";
import GLShader from "./webgl/glshader";

export type WebGLContext = WebGL2RenderingContext | WebGLRenderingContext;

export interface IRapiadOptions {
    canvas: HTMLCanvasElement
    pixelDensity?: number
    width?: number
    height?: number,
    backgroundColor?: Color
}
export interface IAttribute {
    name: string
    size: number
    type: number
    normalized?: boolean
    stride: number
    offset?: number
}
export interface IRenderSpriteOptions {
    color?: Color;
    shader?: GLShader;
    uniforms?: UniformType
}
export interface ITextOptions {
    /**
     * The text string to be rendered.
     */
    text: string;

    /**
     * The font size for the text.
     * Default is 16.
     */
    fontSize?: number;

    /**
     * The font family for the text.
     * Default is 'Arial'.
     */
    fontFamily?: string;

    /**
     * The color of the text.
     * Default is '#000000' (black).
     */
    color?: string;

    /**
     * The alignment of the text. 
     * Possible values: 'left', 'right', 'center', 'start', 'end'.
     * Default is 'left'.
     */
    textAlign?: CanvasTextAlign;

    /**
     * The baseline of the text.
     * Possible values: 'top', 'hanging', 'middle', 'alphabetic', 'ideographic', 'bottom'.
     * Default is 'top'.
     */
    textBaseline?: CanvasTextBaseline;

    /**
     * Whether to apply antialiasing to the texture.
     * Default is `false`.
     */
    antialias?: boolean;
}

export enum JoinTyps {
    BEVEL,
    ROUND,
    MITER,
}

export enum CapTyps {
    BUTT,
    ROUND,
    SQUARE,
}

export interface ILineOptions {
    cap?: CapTyps;
    join?: JoinTyps;
    width?: number;
    miterLimit?: number;
}
export interface IRenderLineOptions extends ILineOptions {
    points: Vec2[],
    color?: Color
}
export interface IGraphicOptions {
    points: Vec2[],
    color?: Color | Color[],
    drawType?: number,
    uv?: Vec2[],
    texture?: Texture,
    shader?: GLShader
}
export enum RenderStatus {
    NORMAL,
    MASK
}

export enum MaskType {
    Normal = 'normal',
    Inverse = 'inverse'
}
export type UniformType = Record<string, number | Array<any> | boolean>
export type Images = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas