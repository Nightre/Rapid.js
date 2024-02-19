export type WebGLContext = WebGL2RenderingContext | WebGLRenderingContext;

export interface IRapiadOptions {
    canvas: HTMLCanvasElement
    pixelDensity?: number
    width?: number
    height?: number,
}
export interface IAttribute {
    name: string
    size: number
    type: number
    normalized?: boolean
    stride: number
    offset?: number
}

export type Images = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas 