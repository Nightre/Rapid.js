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
export declare function createTexture(gl: WebGLRenderingContext, image: TexImageSource, antialias: boolean): WebGLTexture;
