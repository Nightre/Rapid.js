import { IAttribute, UniformType, WebGLContext } from "../interface";
import { WebglBufferArray, ArrayType } from "../math";
import Rapid from "../render";
import GLShader from "../webgl/glshader";
import { Uniform } from "../webgl/uniform";

class RenderRegion {
    currentShader?: GLShader
    protected webglArrayBuffer: WebglBufferArray
    protected rapid: Rapid
    protected gl: WebGLContext
    protected usedTextures: WebGLTexture[] = []
    protected needBind: Set<number> = new Set
    protected shaders: Map<string, GLShader> = new Map()
    protected isCostumShader: boolean = false
    protected readonly MAX_TEXTURE_UNIT_ARRAY: number[]
    private costumUnifrom?: Uniform

    constructor(rapid: Rapid) {
        this.rapid = rapid
        this.gl = rapid.gl
        this.webglArrayBuffer = new WebglBufferArray(rapid.gl, ArrayType.Float32, rapid.gl.ARRAY_BUFFER)
        this.MAX_TEXTURE_UNIT_ARRAY = Array.from({ length: rapid.maxTextureUnits },
            (_, index) => index);
    }
    setTextureUnits(usedTexture: number) {
        return this.MAX_TEXTURE_UNIT_ARRAY.slice(usedTexture, -1)
    }
    protected addVertex(x: number, y: number, ..._: unknown[]) {
        const [tx, ty] = this.rapid.matrixStack.apply(x, y) as number[]
        this.webglArrayBuffer.pushFloat32(tx)
        this.webglArrayBuffer.pushFloat32(ty)
    }
    protected useTexture(texture: WebGLTexture) {
        let textureUnit = this.usedTextures.indexOf(texture)
        if (textureUnit === -1) {
            // 新纹理 
            if (this.usedTextures.length >= this.rapid.maxTextureUnits) {
                this.render()
            }
            this.usedTextures.push(texture)
            textureUnit = this.usedTextures.length - 1
            this.needBind.add(textureUnit)
        }
        return textureUnit
    }
    enterRegion(customShader?: GLShader) {
        this.currentShader = customShader ?? this.getShader("default")!
        this.currentShader.use()
        this.initializeForNextRender()
        this.webglArrayBuffer.bindBuffer()
        // this.currentShader.setAttributes(this.attribute)
        this.currentShader.updateAttributes()

        this.gl.uniformMatrix4fv(
            this.currentShader.uniformLoc["uProjectionMatrix"],
            false, this.rapid.projection
        )
        this.isCostumShader = Boolean(customShader)
    }

    setCostumUnifrom(newCurrentUniform: Uniform) {
        let isChanged = false
        if (this.costumUnifrom != newCurrentUniform) {
            isChanged = true
            this.costumUnifrom = newCurrentUniform
        } else if (newCurrentUniform?.isDirty) {
            isChanged = true
        }

        newCurrentUniform?.clearDirty()
        return isChanged
    }
    exitRegion() { }
    protected initDefaultShader(vs: string, fs: string, attributes?: IAttribute[]) {
        // this.webglArrayBuffer.bindBuffer()
        // this.defaultShader = new GLShader(this.rapid, vs, fs, attributes)
        this.setShader("default", vs, fs, attributes)
    }
    setShader(name: string, vs: string, fs: string, attributes?: IAttribute[]) {
        this.webglArrayBuffer.bindBuffer()
        this.shaders.set(name, new GLShader(this.rapid, vs, fs, attributes))
    }
    getShader(name: string) {
        return this.shaders.get(name)
    }
    render() {
        this.executeRender()
        this.initializeForNextRender()
    }
    protected executeRender() {
        this.webglArrayBuffer.bufferData()
        const gl = this.gl

        for (const unit of this.needBind) {
            gl.activeTexture(gl.TEXTURE0 + unit + this.currentShader!.usedTexture);
            gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        }
        this.needBind.clear()
    }
    protected initializeForNextRender() {
        this.webglArrayBuffer.clear()
        this.usedTextures = []
        this.isCostumShader = false
    }

    hasPendingContent(): boolean {
        return false
    }

    isShaderChanged(shader?: GLShader) {
        return (shader || this.getShader('default')) != this.currentShader
    }
}

export default RenderRegion