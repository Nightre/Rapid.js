import { WebGLContext } from "../interface";
/**
 * get webgl rendering context
 * @param canvas
 * @returns webgl1 or webgl2
 */
export declare const getContext: (canvas: HTMLCanvasElement) => WebGLContext;
/**
 * compile string to webgl shader
 * @param gl
 * @param source
 * @param type
 * @returns
 */
export declare const compileShader: (gl: WebGLContext, source: string, type: number) => WebGLShader;
/**
 * create webgl program by shader string
 * @param gl
 * @param vsSource
 * @param fsSource
 * @returns
 */
export declare const createShaderProgram: (gl: WebGLContext, vsSource: string, fsSource: string) => WebGLProgram;
/**
 * Creates a WebGL texture either from an image source or as a blank texture
 * @param gl - The WebGL rendering context
 * @param source - The image source or dimensions for a blank texture
 * @param antialias - Whether to enable antialiasing
 * @returns A WebGL texture
 */
export declare function createTexture(gl: WebGLContext, source: TexImageSource | {
    width: number;
    height: number;
}, antialias: boolean, withSize?: boolean, flipY?: boolean): WebGLTexture;
export declare function generateFragShader(fs: string, max: number): string;
export declare const FLOAT = 5126;
export declare const UNSIGNED_BYTE = 5121;
