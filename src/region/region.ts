import type { Rapid } from "../render";
import { MatrixStore } from "../matrix-engine";
import GLShader, { CustomGlShader } from "../webgl/glshader";
import { generateShader, type WebGLContext } from "../webgl/utils";

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
    protected extraTextureUnit = 0

    constructor(public rapid: Rapid) {
        this.gl = rapid.gl;
        this.maxTextureUnits = rapid.maxTextureUnits;
        this.matrixStore = rapid.matrix;
    }

    protected createBuffer() {

    }

    protected createDefaultShader() {

    }

    get freeTextureUnitNum(): number {
        return this.maxTextureUnits - this.usedTextures.length - this.customShaderUsedTextureNum
    }

    getTextureUnitList() {
        return Array.from({ length: this.maxTextureUnits },
            (_, index) => index);
    }

    protected findTextureUnit(texture: WebGLTexture, paddingX: number = 0, paddingY: number = 0) {
        for (let i = 0; i < this.usedTextures.length; i++) {
            const p = i * 2;
            if (
                this.usedTextures[i] === texture &&
                this.usedTexturePadding[p] === paddingX &&
                this.usedTexturePadding[p + 1] === paddingY
            ) {
                return i;
            }
        }

        return -1;
    }

    useTexture(texture: WebGLTexture, paddingX: number = 0, paddingY: number = 0) {
        const textureUnit = this.findTextureUnit(texture, paddingX, paddingY)
        if (textureUnit == -1) {
            if (this.freeTextureUnitNum === 0) {
                this.flush();
            }
            this.usedTextures.push(texture)

            this.usedTexturePadding.push(paddingX)
            this.usedTexturePadding.push(paddingY)

            return this.usedTextures.length - 1
        }
        return textureUnit
    }

    getMaxTexutreUnit(customShader?: CustomGlShader) {
        return this.rapid.maxTextureUnits - this.extraTextureUnit - (customShader?.usedTextureUnitNum ?? 0)
    }

    createShader(vs: string, fs: string) {
        const maxTextureUnits = this.getMaxTexutreUnit()
        fs = generateShader(fs, maxTextureUnits);
        vs = generateShader(vs, maxTextureUnits);
        return new GLShader(this.gl, vs, fs);
    }

    createCustomShader(customShader: CustomGlShader) {
        const maxTextureUnits = this.getMaxTexutreUnit(customShader)

        const fs = generateShader(this.fs, maxTextureUnits);
        const vs = generateShader(this.vs, maxTextureUnits);

        return customShader.getGLShader(this, this.KEY, vs, fs)
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
        this.prepareRender()
    }

    protected prepareRender(): void {
        const shader = this.currentShader
        shader.use()

        if (this.customShader) {
            const customShader = this.customShader;
            const textureUniforms: Record<string, number | number[]> = {};
            for (const [loc, texture] of Object.entries(customShader.uniformTextures)) {
                textureUniforms[loc] = this.useTexture(texture);
            }
            for (const [loc, textures] of Object.entries(customShader.uniformArrayTexture)) {
                textureUniforms[loc] = textures.map(u => this.useTexture(u))
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
        const gl = this.gl
        for (let unit = 0; unit < this.usedTextures.length; unit++) {
            gl.activeTexture(gl.TEXTURE0 + unit)
            gl.bindTexture(gl.TEXTURE_2D, null)
        }

        this.usedTextures.length = 0;
        this.usedTexturePadding.length = 0;
    }

    hasPendingContent(): boolean {
        return false
    }
}
