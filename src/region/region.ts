import { Rapid } from "../render";
import { MatrixStore } from "../matrix-engine";
import GLShader, { CustomGlShader } from "../webgl/glshader";
import { WebGLContext } from "../webgl/utils";

export class Region {
    defaultShader!: GLShader
    currentShader!: GLShader
    customShader: CustomGlShader | null = null
    customShaderUsedTextureNum: number = 0

    gl: WebGLContext
    maxTextureUnits: number
    matrixStore: MatrixStore
    isDefaultShader = true

    KEY = "default"
    vs: string = ""
    fs: string = ""

    protected usedTextures: WebGLTexture[] = []
    protected usedTexturePadding: number[] = []

    constructor(public rapid: Rapid) {
        this.gl = rapid.gl;
        this.maxTextureUnits = rapid.maxTextureUnits;
        this.matrixStore = rapid.matrix;
    }

    protected createDefaultShader(vs: string, fs: string) {
        this.vs = vs;
        this.fs = fs;
        this.defaultShader = this.createShader(vs, fs)
        return this.defaultShader;
    }

    get freeTextureUnitNum(): number {
        return this.maxTextureUnits - this.usedTextures.length - this.customShaderUsedTextureNum
    }

    getTextureUnitList() {
        return Array.from({ length: this.maxTextureUnits },
            (_, index) => index);
    }

    useTexture(texture: WebGLTexture, paddingX: number = 0, paddingY: number = 0) {
        const textureUnit = this.usedTextures.indexOf(texture)
        if (textureUnit == -1) {
            this.usedTextures.push(texture)

            this.usedTexturePadding.push(paddingX)
            this.usedTexturePadding.push(paddingY)

            return this.usedTextures.length - 1
        }
        return textureUnit
    }

    createShader(vs: string, fs: string) {
        return new GLShader(this.gl, vs, fs);
    }

    createCustomShader(customShader: CustomGlShader) {
        return customShader.getGLShader(this, this.KEY, this.vs, this.fs)
    }

    getCustomShader(customShader?: GLShader | CustomGlShader): GLShader {
        if (!customShader) {
            return this.defaultShader
        }
        if (customShader instanceof CustomGlShader) {
            const shader = this.createCustomShader(customShader);
            if (shader == null) {
                return this.defaultShader
            }
            return shader;
        }
        return customShader
    }

    /**
     * Checks if the given shader is the same as the currently bound shader.
     * @param customShader Optional custom shader.
     * @returns True if already bound, otherwise false.
     */
    isSameShader(customShader?: GLShader | CustomGlShader) {
        if (this.isDefaultShader && !customShader) {
            // Performance optimization for the default case
            return true;
        }
        return this.getCustomShader(customShader) == this.currentShader;
    }

    enter(customShader?: GLShader | CustomGlShader): void {
        this.resetRender()
        this.currentShader = this.getCustomShader(customShader);
        if (customShader instanceof CustomGlShader) {
            this.customShader = customShader
            this.customShaderUsedTextureNum = customShader.usedTextureUnitNum
        } else {
            this.customShader = null
            this.customShaderUsedTextureNum = 0
        }
        this.isDefaultShader = this.currentShader == this.defaultShader
        this.currentShader.use();
        this.currentShader.setUniform("u_projection", this.rapid.projection);
    }

    exit(): void {
        if (this.hasPendingContent()) {
            this.flush();
        }
        this.gl.bindVertexArray(null);
    }

    flush(): void {
        this.render()
        this.resetRender()
    }

    render(): void {
        const shader = this.currentShader
        shader.use()

        if (this.customShader) {
            const customShader = this.customShader;
            const textureUniforms: Record<string, number> = {};
            for (const loc in customShader.uniformTextures) {
                textureUniforms[loc] = this.useTexture(customShader.uniformTextures[loc]);
            }
            this.customShader.applyUniform(this.KEY, textureUniforms);
        }

        const gl = this.gl
        for (let unit = 0; unit < this.usedTextures.length; unit++) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        }
        shader.setUniform("uTextures", Int32Array.from(
            { length: this.usedTextures.length }, (_, i) => i
        ));
        shader.setUniform("uPadding", Float32Array.from(
            { length: this.usedTexturePadding.length }, (_, i) => this.usedTexturePadding[i]
        ));
    }

    resetRender() {
        this.usedTextures.length = 0;
        this.usedTexturePadding.length = 0;
    }

    hasPendingContent(): boolean {
        return false
    }
}