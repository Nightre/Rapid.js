import { Color, Vec2 } from "./math";
import { Texture } from "./texture";
import { TileSet } from "./tilemap";
import GLShader from "./webgl/glshader";
import { Uniform } from "./webgl/uniform";
/**
 * @ignore
 */
export type WebGLContext = WebGL2RenderingContext | WebGLRenderingContext;
/**
 * @ignore
 */
export interface IMathStruct<T> {
    clone(obj: T): T;
    copy(obj: T): void;
    equal(obj: T): boolean;
}
export interface IRapidOptions {
    canvas: HTMLCanvasElement;
    width?: number;
    height?: number;
    backgroundColor?: Color;
    antialias?: boolean;
}
export interface IAttribute {
    name: string;
    size: number;
    type: number;
    normalized?: boolean;
    stride: number;
    offset?: number;
}
export interface ITransformOptions {
    position?: Vec2;
    scale?: Vec2 | number;
    rotation?: number;
    offset?: Vec2;
    x?: number;
    y?: number;
    offsetX?: number;
    offsetY?: number;
    origin?: Vec2 | number;
    restoreTransform?: boolean;
    saveTransform?: boolean;
    afterSave?(): unknown;
    beforRestore?(): unknown;
}
export interface ISpriteRenderOptions extends ITransformOptions, IShaderRenderOptions {
    color?: Color;
    texture?: Texture;
    offset?: Vec2;
    flipX?: boolean;
    flipY?: boolean;
}
export interface ITextTextureOptions {
    /**
     * The text string to be rendered.
     */
    text?: string;
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
}
export interface ILineRenderOptions {
    width?: number;
    closed?: boolean;
    points: Vec2[];
    roundCap?: boolean;
    color?: Color;
}
export interface IRenderLineOptions extends ILineRenderOptions, ITransformOptions {
}
export interface IGraphicRenderOptions extends ITransformOptions, IShaderRenderOptions {
    points: Vec2[];
    color?: Color | Color[];
    drawType?: number;
    uv?: Vec2[];
    texture?: Texture;
}
export interface ICircleRenderOptions extends IGraphicRenderOptions {
    radius: number;
    segments?: number;
}
export interface IRectRenderOptions extends IGraphicRenderOptions {
    width: number;
    height: number;
}
export declare enum MaskType {
    Include = "normal",
    Exclude = "inverse"
}
export type UniformType = Record<string, number | Array<any> | boolean | Texture>;
export type Images = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas;
export interface IRegisterTileOptions extends ISpriteRenderOptions {
    texture: Texture;
    offsetX?: number;
    offsetY?: number;
    ySortOffset?: number;
}
export interface YSortCallback {
    ySort: number;
    render?: () => void;
    renderSprite?: ISpriteRenderOptions;
}
export interface ILayerRenderOptions extends ITransformOptions {
    error?: number | Vec2;
    errorX?: number;
    errorY?: number;
    ySortCallback?: Array<YSortCallback>;
    shape?: TilemapShape;
    tileSet: TileSet;
    eachTile?: (tileId: string | number, mapX: number, mapY: number) => ISpriteRenderOptions | undefined | void;
}
export interface IShaderRenderOptions {
    shader?: GLShader;
    uniforms?: Uniform;
}
export declare enum TilemapShape {
    SQUARE = "square",
    ISOMETRIC = "isometric"
}
export declare enum ShaderType {
    SPRITE = "sprite",
    GRAPHIC = "graphic"
}
export interface IParticleEmitterOptions extends ITransformOptions, IShaderRenderOptions {
    texture: Texture | Texture[] | [Texture, number][];
}
