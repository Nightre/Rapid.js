/**
 * get webgl rendering context
 * @param canvas
 * @returns webgl1 or webgl2
 */
export const getContext = (canvas) => {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
        //TODO
        throw new Error("TODO");
    }
    return gl;
};
/**
 * compile string to webgl shader
 * @param gl
 * @param source
 * @param type
 * @returns
 */
export const compileShader = (gl, source, type) => {
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
};
/**
 * create webgl program by shader string
 * @param gl
 * @param vsSource
 * @param fsSource
 * @returns
 */
export const createShaderProgram = (gl, vsSource, fsSource) => {
    var program = gl.createProgram(), vShader = compileShader(gl, vsSource, 35633), fShader = compileShader(gl, fsSource, 35632);
    if (!program) {
        throw new Error("Unable to create program shader");
    }
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    return program;
};
export function createTexture(gl, image, antialias) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, antialias ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, antialias ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (!texture) {
        throw new Error("unable to create texture");
    }
    return texture;
}
