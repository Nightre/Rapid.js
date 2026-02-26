import { Region } from "../region/region";
import { createShaderProgram, generateFragShader, FLOAT, vertexAttribDivisor } from "./utils";

export type WebGLContext = WebGL2RenderingContext;

export interface IAttribute {
    name: string;
    size: number;
    type?: number;
    normalized?: boolean;
    stride: number;
    offset?: number;
    /** 0 = per-vertex (default), 1 = per-instance */
    divisor?: number;
}

let shadeId = 0
// ── Uniform value types ──────────────────────────────────────────────────────

/** All value types accepted by setUniform / setUniforms */
export type UniformValue =
    | number                          // float / int / bool / sampler2D
    | [number, number]                // vec2 / ivec2
    | [number, number, number]        // vec3 / ivec3
    | [number, number, number, number]// vec4 / ivec4
    | Float32Array | number[]         // mat2(4) mat3(9) mat4(16), or float arrays
    | Int32Array;                     // int arrays / sampler arrays

/** GLSL types we can parse and dispatch automatically */
type GlslType =
    | "float" | "int" | "bool" | "sampler2D" | "samplerCube"
    | "vec2" | "vec3" | "vec4"
    | "ivec2" | "ivec3" | "ivec4"
    | "bvec2" | "bvec3" | "bvec4"
    | "mat2" | "mat3" | "mat4";

/**
 * Wraps a WebGL shader program.
 * Parses attribute/uniform locations and types from GLSL source automatically.
 */
class GLShader {
    program: WebGLProgram;
    attributeLoc: Record<string, number> = {};
    uniformLoc: Record<string, WebGLUniformLocation> = {};

    isCustom = false;

    /** GLSL type for each uniform, parsed from source */
    private uniformType: Record<string, GlslType> = {};
    /** Whether the uniform is an array (e.g. sampler2D uTextures[8]) */
    private uniformIsArray: Record<string, boolean> = {};
    private gl: WebGLContext;

    shaderId: number = shadeId++ // for debug
    readonly vao: WebGLVertexArrayObject;

    constructor(gl: WebGLContext, vs: string, fs: string, attributes?: IAttribute[]) {
        this.gl = gl;
        this.program = createShaderProgram(gl, vs, fs);
        this.parseShader(vs);
        this.parseShader(fs);
        this.vao = gl.createVertexArray()!;

        if (attributes) {
            this.setAttributes(attributes);
        }
    }

    /** Switch GPU to use this shader program */
    use() {
        this.gl.useProgram(this.program);
    }

    /** Bind this shader's VAO (start recording or replaying attribute state) */
    bindVAO() {
        this.gl.bindVertexArray(this.vao);
    }

    /** Unbind VAO (finish recording) */
    unbindVAO() {
        this.gl.bindVertexArray(null);
    }

    // ── Uniforms ─────────────────────────────────────────────────────────────

    /**
     * Set a single uniform by name. Type is inferred from the parsed GLSL source.
     * @example
     *   shader.setUniform("uTime", 1.5);
     *   shader.setUniform("uColor", [1, 0, 0, 1]);
     *   shader.setUniform("uMVP", mat4array);
     */
    setUniform(name: string, value: UniformValue) {
        const loc = this.uniformLoc[name];
        if (loc === undefined) return;
        const type = this.uniformType[name];
        const isArray = this.uniformIsArray[name];

        applyUniform(this.gl, loc, type, value, isArray);
    }

    /**
     * Batch-set uniforms via a plain value map.
     * @example
     *   shader.setUniforms({
     *     uTime:       1.5,
     *     uResolution: [800, 600],
     *     uMVP:        mat4,
     *   });
     */
    setUniforms(uniforms: Record<string, UniformValue>) {
        for (const name in uniforms) {
            this.setUniform(name, uniforms[name]);
        }
    }

    // ── Attributes ────────────────────────────────────────────────────────────

    /**
     * Bind a single vertex attribute pointer.
     * The VBO must already be bound before calling this.
     */
    setAttribute(attr: IAttribute) {
        const loc = this.attributeLoc[attr.name];
        if (loc === undefined) return;
        const gl = this.gl;
        gl.vertexAttribPointer(
            loc,
            attr.size,
            attr.type ?? FLOAT,
            attr.normalized ?? false,
            attr.stride,
            attr.offset ?? 0
        );
        gl.enableVertexAttribArray(loc);
        vertexAttribDivisor(gl, loc, attr.divisor ?? 0);
    }

    /** Bind all vertex attribute pointers at once */
    setAttributes(attrs: IAttribute[]) {
        for (const attr of attrs) {
            this.setAttribute(attr);
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /** Free GPU resources */
    destroy() {
        this.gl.deleteProgram(this.program);
    }

    // ── Factory helpers ───────────────────────────────────────────────────────

    /**
     * Create a shader that supports dynamic multi-texture sampling.
     * Replaces %TEXTURE_NUM% and %GET_COLOR% placeholders in the fragment source.
     */
    static createMultiTexture(
        gl: WebGLContext,
        vs: string,
        fs: string,
        attributes: IAttribute[],
        maxTextureUnits: number,
        reservedUnits: number = 0
    ): GLShader {
        const processedFs = generateFragShader(fs, maxTextureUnits - reservedUnits);
        return new GLShader(gl, vs, processedFs, attributes);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    /** Parse attribute/uniform names and GLSL types from raw shader source */
    private parseShader(source: string) {
        const gl = this.gl;

        // attributes: "in <type> <name>" (GLSL ES 3.0) or "attribute <type> <name>" (GLSL ES 1.0)
        const attrMatches = source.match(/(?:in|attribute)\s+\w+\s+\w+/g);
        if (attrMatches) {
            for (const match of attrMatches) {
                const parts = match.split(/\s+/);
                const name = parts[2];
                const loc = gl.getAttribLocation(this.program, name);
                if (loc !== -1) this.attributeLoc[name] = loc;
            }
        }

        // uniforms: "uniform <type> <name>" or "uniform <type> <name>[N]"
        const uniformMatches = source.match(/uniform\s+\w+\s+\w+(?:\[\d+\])?/g);
        if (uniformMatches) {
            for (const match of uniformMatches) {
                const parts = match.split(/\s+/);
                const glslType = parts[1] as GlslType;
                // strip array suffix: uTextures[4] → uTextures
                const name = parts[2].replace(/\[\d+\]$/, "");
                const loc = gl.getUniformLocation(this.program, name);
                if (loc !== null) {
                    this.uniformLoc[name] = loc;
                    this.uniformType[name] = glslType;
                    this.uniformIsArray[name] = /\[\d+\]$/.test(parts[2]);
                }
            }
        }
    }
}

// ── Uniform dispatch ──────────────────────────────────────────────────────────

/**
 * Call the correct gl.uniform* method based on the parsed GLSL type.
 * Falls back to a best-effort guess when the type is unknown.
 */
function applyUniform(
    gl: WebGLContext,
    loc: WebGLUniformLocation,
    type: GlslType | undefined,
    value: UniformValue,
    isArray: boolean = false
) {
    switch (type) {
        // scalars
        case "float":
            return gl.uniform1f(loc, value as number);
        case "int":
        case "bool":
        case "sampler2D":
        case "samplerCube":
            // array of samplers (e.g. uTextures[8]) → uniform1iv
            if (isArray) return gl.uniform1iv(loc, value as Int32Array);
            return gl.uniform1i(loc, value as number);

        // float vectors
        case "vec2":
            return gl.uniform2fv(loc, value as number[]);
        case "vec3":
            return gl.uniform3fv(loc, value as number[]);
        case "vec4":
            return gl.uniform4fv(loc, value as number[]);

        // int / bool vectors
        case "ivec2":
        case "bvec2":
            return gl.uniform2iv(loc, value as number[]);
        case "ivec3":
        case "bvec3":
            return gl.uniform3iv(loc, value as number[]);
        case "ivec4":
        case "bvec4":
            return gl.uniform4iv(loc, value as number[]);

        // matrices (column-major, transpose = false)
        case "mat2":
            return gl.uniformMatrix2fv(loc, false, value as Float32Array);
        case "mat3":
            return gl.uniformMatrix3fv(loc, false, value as Float32Array);
        case "mat4":
            return gl.uniformMatrix4fv(loc, false, value as Float32Array);

        // fallback: guess by value shape
        default:
            return applyUniformFallback(gl, loc, value);
    }
}

/** Best-effort dispatch when GLSL type is not available */
function applyUniformFallback(
    gl: WebGLContext,
    loc: WebGLUniformLocation,
    value: UniformValue
) {
    if (typeof value === "number") {
        return gl.uniform1f(loc, value);
    }
    const arr = value as number[] | Float32Array | Int32Array;
    switch (arr.length) {
        case 2: return gl.uniform2fv(loc, arr);
        case 3: return gl.uniform3fv(loc, arr);
        case 4: return gl.uniform4fv(loc, arr);
        case 9: return gl.uniformMatrix3fv(loc, false, arr);
        case 16: return gl.uniformMatrix4fv(loc, false, arr);
        default: return gl.uniform1fv(loc, arr);
    }
}

export default GLShader;

/**
 * A wrapper for creating and managing custom shaders across multiple rendering regions.
 */
export class CustomGlShader {
    /** Custom vertex shader code */
    vs: string;
    /** Custom fragment shader code */
    fs: string;
    /** Map of compiled GLShader instances per region key */
    glshader: Map<string, GLShader> = new Map();

    /** Currently stored uniform values */
    uniforms: Record<string, UniformValue> = {};
    /** Set of region keys that need uniform updates */
    uniformDirty: Set<string> = new Set();
    /** Map of textures to be bound to this shader */
    uniformTextures: Record<string, WebGLTexture> = {};
    /** Number of texture units reserved by this custom shader */
    usedTextureUnitNum: number = 0;

    constructor(vs: string, fs: string, usedTextureUnitNum = 0, uniforms?: Record<string, UniformValue>) {
        this.vs = vs;
        this.fs = fs;
        this.uniforms = uniforms ?? {};
        this.usedTextureUnitNum = usedTextureUnitNum;
    }

    /**
     * Updates uniform values or textures for the custom shader.
     * @param uniforms Map of uniform values or WebGL textures to apply.
     */
    setUniforms(uniforms: Record<string, UniformValue | WebGLTexture>) {
        const normalUniforms: Record<string, UniformValue> = {};
        const textureUniforms: Record<string, WebGLTexture> = {};

        for (const [key, value] of Object.entries(uniforms)) {
            if (value instanceof WebGLTexture) {
                textureUniforms[key] = value;
            } else {
                normalUniforms[key] = value as UniformValue;
            }
        }

        Object.assign(this.uniforms, normalUniforms);
        Object.assign(this.uniformTextures, textureUniforms);

        for (const key of this.glshader.keys()) {
            this.uniformDirty.add(key);
        }
    }

    /**
     * Applies current uniforms and texture unit mappings to the region-specific shader.
     * @param key The region key.
     * @param textureUniforms Map of texture uniform names to assigned texture unit indices.
     */
    applyUniform(key: string, textureUniforms: Record<string, number>) {
        const shader = this.glshader.get(key);
        if (!shader) return;

        if (Object.keys(textureUniforms).length > 0) {
            shader.setUniforms(textureUniforms);
        }

        if (this.uniformDirty.has(key)) {
            shader.setUniforms(this.uniforms);
            this.uniformDirty.delete(key);
        }
    }

    /**
     * Retrieves or compiles a customized GLShader for a specific region.
     * @param region The Region requesting the shader.
     * @param key The region key.
     * @param baseVS The base vertex shader template.
     * @param baseFS The base fragment shader template.
     * @returns The combined and compiled GLShader.
     */
    getGLShader(region: Region, key: string, baseVS?: string, baseFS?: string) {
        if (this.glshader.has(key)) {
            return this.glshader.get(key)!;
        }
        if (baseFS == undefined || baseVS == undefined) {
            console.warn("CustomGlShader: missing base shader for " + key);
            return null;
        }

        baseVS = baseVS.replace("// CUSTOM_CODE_CALL", "vertex(position, vRegion);");
        baseFS = baseFS.replace("// CUSTOM_CODE_CALL", "fragment(fragColor);");

        baseVS = baseVS.replace("// CUSTOM_CODE", this.vs);
        baseFS = baseFS.replace("// CUSTOM_CODE", this.fs);

        const shader = region.createShader(baseVS, baseFS);
        shader.isCustom = true;
        this.glshader.set(key, shader);
        this.uniformDirty.add(key);

        return shader;
    }
}