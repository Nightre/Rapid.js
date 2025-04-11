import { WebGLContext } from "../interface";

/**
 * get webgl rendering context
 * @param canvas 
 * @returns webgl1 or webgl2
 */
export const getContext = (canvas: HTMLCanvasElement): WebGLContext => {
    const options = { stencil: true }
    const gl = canvas.getContext("webgl2", options) || canvas.getContext("webgl", options)
    if (!gl) {
        throw new Error("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl as WebGLContext;
}

/**
 * compile string to webgl shader
 * @param gl 
 * @param source 
 * @param type 
 * @returns 
 */
export const compileShader = (gl: WebGLContext, source: string, type: number) => {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Unable to create webgl shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // 检查编译状态
    const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compileStatus) {
        const errorLog = gl.getShaderInfoLog(shader);
        console.error("Shader compilation failed:", errorLog);
        throw new Error("Unable to compile shader: " + errorLog + source);
    }

    return shader;
}

/**
 * create webgl program by shader string
 * @param gl 
 * @param vsSource 
 * @param fsSource 
 * @returns 
 */
export const createShaderProgram = (gl: WebGLContext, vsSource: string, fsSource: string) => {
    var program = gl.createProgram(),
        vShader = compileShader(gl, vsSource, 35633),
        fShader = compileShader(gl, fsSource, 35632);
    if (!program) {
        throw new Error("Unable to create program shader");
    }
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linkStatus) {
        const errorLog = gl.getProgramInfoLog(program);
        throw new Error("Unable to link shader program: " + errorLog);
    }
    return program;
}

/**
 * Creates a WebGL texture either from an image source or as a blank texture
 * @param gl - The WebGL rendering context
 * @param source - The image source or dimensions for a blank texture
 * @param antialias - Whether to enable antialiasing
 * @returns A WebGL texture
 */
export function createTexture(
    gl: WebGLContext,
    source: TexImageSource | { width: number; height: number },
    antialias: boolean,
    withSize: boolean = false,
    flipY: boolean = false
): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error("unable to create texture");
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, antialias ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, antialias ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

    if (withSize) {
        source = source as { width: number; height: number };
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.width, source.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
    }

    return texture;
}

export function generateFragShader(fs: string, max: number) {
    if (fs.includes("%TEXTURE_NUM%")) fs = fs.replace("%TEXTURE_NUM%", max.toString())
    if (fs.includes("%GET_COLOR%")) {
        let code = ""
        for (let index = 0; index < max; index++) {
            if (index == 0) {
                code += `if(vTextureId == ${index}.0)`
            } else if (index == max - 1) {
                code += `else`
            } else {
                code += `else if(vTextureId == ${index}.0)`
            }
            code += `{color = texture2D(uTextures[${index}], vRegion);}`
        }
        fs = fs.replace("%GET_COLOR%", code)
    }

    return fs
}
export const FLOAT = 5126;
export const UNSIGNED_BYTE = 5121;