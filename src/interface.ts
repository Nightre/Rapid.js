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
    clone(obj: T): T,
    copy(obj: T): void,
    equal(obj: T): boolean
}

export interface IRapidOptions {
    canvas: HTMLCanvasElement
    width?: number
    height?: number,
    backgroundColor?: Color,
    antialias?: boolean,
}
export interface IAttribute {
    name: string
    size: number
    type: number
    normalized?: boolean
    stride: number
    offset?: number
}

export interface ITransformOptions {
    position?: Vec2,
    scale?: Vec2 | number,
    rotation?: number,

    offset?: Vec2,

    x?: number,
    y?: number,

    offsetX?: number,
    offsetY?: number,
    origin?: Vec2 | number,

    restoreTransform?: boolean,
    saveTransform?: boolean,

    afterSave?(): unknown,
    beforRestore?(): unknown,
}

export interface ISpriteRenderOptions extends ITransformOptions, IShaderRenderOptions {
    color?: Color;
    texture?: Texture,
    offset?: Vec2,

    flipX?: boolean,
    flipY?: boolean,
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

export interface ILineRenderOptions extends IGraphicRenderOptions {
    width?: number;
    closed?: boolean;
    roundCap?: boolean,
    textureMode?: LineTextureMode,
}
export enum LineTextureMode {
    STRETCH = 'stretch',
    REPEAT = 'repeat',
}
export enum TextureWrapMode {
    REPEAT = 'repeat',
    CLAMP = 'clamp',
    MIRROR = 'mirror',
}
export interface IRenderLineOptions extends ILineRenderOptions, ITransformOptions { }
export interface IGraphicRenderOptions extends ITransformOptions, IShaderRenderOptions {
    points: Vec2[],
    color?: Color | Color[],
    drawType?: number,
    uv?: Vec2[],
    texture?: Texture,
}

export interface ICircleRenderOptions extends IGraphicRenderOptions {
    radius: number,
    segments?: number,
}

export interface IRectRenderOptions extends IGraphicRenderOptions {
    width: number,
    height: number,
}

export enum MaskType {
    Include = 'normal',
    Exclude = 'inverse'
}
export type UniformType = Record<string, number | Array<any> | boolean | Texture>
export type Images = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas
export interface IRegisterTileOptions extends ISpriteRenderOptions {
    texture: Texture,
    offsetX?: number,
    offsetY?: number,
    ySortOffset?: number
}

export interface YSortCallback {
    ySort: number,
    render?: () => void,
    renderSprite?: ISpriteRenderOptions
}
export interface ILayerRenderOptions extends ITransformOptions {
    error?: number | Vec2,
    errorX?: number,
    errorY?: number,

    ySortCallback?: Array<YSortCallback>,
    shape?: TilemapShape,
    tileSet: TileSet,

    eachTile?: (tileId: string | number, mapX: number, mapY: number) => ISpriteRenderOptions | undefined | void,
}
export interface IShaderRenderOptions {
    shader?: GLShader;
    uniforms?: Uniform,
}
export enum TilemapShape {
    SQUARE = "square",
    ISOMETRIC = "isometric",
}

export enum ShaderType {
    SPRITE = 'sprite',
    GRAPHIC = 'graphic',
}

export enum BlendMode {
    Additive = 'additive',
    Subtractive = 'subtractive',
    Mix = 'mix',
}

/**
 * Interface for light rendering options
 */
export interface ILightRenderOptions {
    /** Position of the light source */
    lightSource: Vec2,
    /** Array of vertex arrays for occlusion objects, each occlusion object is defined by a set of vertices */
    occlusion: Vec2[][],
    /** Base projection length that controls shadow length */
    baseProjectionLength?: number,
    /** Type of mask to apply */
    type?: MaskType
}


export interface ICameraOptions extends ITransformOptions { }

/**
 * Defines particle emitter shape types
 */
export enum ParticleShape {
    /**
     * Point emitter, emits particles from a single point
     */
    POINT = 'point',
    /**
     * Circle emitter, emits particles randomly from a circular area
     */
    CIRCLE = 'circle',
    /**
     * Rectangle emitter, emits particles randomly from a rectangular area
     */
    RECT = 'rect',
}

/**
 * Defines particle attribute animation
 * @template T Attribute type, can be number, vector or color
 */
export interface ParticleAttribute<T extends number | Vec2 | Color> {
    /**
     * Damping coefficient, controls attribute decay rate over time
     */
    damping?: number;
    /**
     * Initial attribute value
     */
    start: T,
    /**
     * Final attribute value, uses initial value if not specified
     */
    end?: T,
    /**
     * Attribute change rate, automatically calculated from start and end if not specified
     */
    delta?: T,
}

/**
 * Particle system configuration options
 */
export interface IParticleOptions extends ITransformOptions, IShaderRenderOptions {
    /**
     * Particle texture, can be a single texture, array of textures, or weighted texture array
     */
    texture: Texture | Texture[] | [Texture, number][];

    /**
     * Particle emission rate (particles per second)
     */
    emitRate?: number;

    /**
     * Emission time interval in seconds
     */
    emitTime?: number;

    /**
     * Maximum number of particles limit
     */
    maxParticles?: number;

    /**
     * Particle lifetime in seconds, can be fixed value or range
     */
    life?: number | [number, number];

    /**
     * Particle animation properties collection
     */
    animation: {
        /**
         * Velocity vector, controls particle movement direction and speed
         */
        velocity?: ParticleAttribute<Vec2>;
        /**
         * Acceleration vector, controls particle velocity changes
         */
        acceleration?: ParticleAttribute<Vec2>;
        /**
         * Speed scalar, used in combination with rotation direction
         */
        speed?: ParticleAttribute<number>;
        /**
         * Scale factor, controls particle size
         */
        scale?: ParticleAttribute<number>;
        /**
         * Rotation angle (in radians)
         */
        rotation?: ParticleAttribute<number>;
        /**
         * Color and transparency
         */
        color?: ParticleAttribute<Color>;
    }

    /**
     * Emitter shape
     */
    emitShape?: ParticleShape;
    /**
     * Circular emitter radius
     */
    emitRadius?: number;
    /**
     * Rectangular emitter dimensions
     */
    emitRect?: { width: number, height: number };

    /**
     * Whether to use local coordinate system, true means particles are relative to emitter position,
     * false means using global coordinates
     */
    localSpace?: boolean;
}

/**
 * Particle attribute data types
 */
export type ParticleAttributeTypes = number | Vec2 | Color

/**
 * Particle attribute runtime data
 * @template T Attribute type
 */
export type ParticleAttributeData<T extends ParticleAttributeTypes> = {
    /**
     * Attribute change rate per second
     */
    delta?: T,
    /**
     * Current attribute value
     */
    value: T,
    /**
     * Damping coefficient
     */
    damping?: number,
}
