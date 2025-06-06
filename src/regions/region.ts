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
    protected shaders: Map<string, GLShader> = new Map()
    protected isCostumShader: boolean = false
    //protected readonly MAX_TEXTURE_UNIT_ARRAY: number[]
    private costumUnifrom?: Uniform
    private defaultShader?: GLShader
    private maxTextureUnits: number
    protected freeTextureUnitNum: number = 0

    constructor(rapid: Rapid) {
        this.rapid = rapid
        this.gl = rapid.gl
        this.webglArrayBuffer = new WebglBufferArray(rapid.gl, ArrayType.Float32, rapid.gl.ARRAY_BUFFER, rapid.gl.STREAM_DRAW)
        // this.MAX_TEXTURE_UNIT_ARRAY = Array.from({ length: rapid.maxTextureUnits },
        //     (_, index) => index);
        this.maxTextureUnits = rapid.maxTextureUnits
    }
    getTextureUnitList() {
        return Array.from({ length: this.maxTextureUnits },
            (_, index) => index);
    }
    // setTextureUnits(usedTexture: number) {
    //     return this.MAX_TEXTURE_UNIT_ARRAY.slice(usedTexture, -1)
    // }
    protected addVertex(x: number, y: number, ..._: unknown[]) {
        const [tx, ty] = this.rapid.matrixStack.apply(x, y) as number[]
        this.webglArrayBuffer.pushFloat32(tx)
        this.webglArrayBuffer.pushFloat32(ty)
    }
    /**
     * 使用纹理，必须在渲染操作之前
     * @param texture 
     * @returns 
     */
    useTexture(texture: WebGLTexture): [number, boolean] {
        const textureUnit = this.usedTextures.indexOf(texture)
        if (textureUnit == -1) {
            this.usedTextures.push(texture)
            this.freeTextureUnitNum = this.maxTextureUnits - this.usedTextures.length
            return [this.usedTextures.length - 1, true]
        }
        return [textureUnit, false]
    }

    enterRegion(customShader?: GLShader) {
        this.currentShader = customShader ?? this.getShader("default")!
        this.currentShader.use()
        this.initializeForNextRender()
        this.webglArrayBuffer.bindBuffer()
        // this.currentShader.setAttributes(this.attribute)
        this.currentShader.updateAttributes()

        this.updateProjection()
        this.isCostumShader = Boolean(customShader)
    }
    updateProjection() {
        this.gl.uniformMatrix4fv(
            this.currentShader!.uniformLoc["uProjectionMatrix"],
            false, this.rapid.projection
        )
    }

    isUnifromChanged(newCurrentUniform?: Uniform) {
        if (!newCurrentUniform) return false
        //let isChanged = false
        if (this.costumUnifrom != newCurrentUniform) {
            //isChanged = true
            //this.costumUnifrom = newCurrentUniform
            return true
        } else if (newCurrentUniform?.isDirty) {
            //isChanged = true
            return true
        }
        return false
    
        //newCurrentUniform?.clearDirty()
        //return isChanged
    }

    setCurrentUniform(newCurrentUniform: Uniform) {
        newCurrentUniform.clearDirty()
        this.costumUnifrom = newCurrentUniform
    }

    exitRegion() { }

    protected initDefaultShader(vs: string, fs: string, attributes?: IAttribute[]) {
        this.setShader("default", vs, fs, attributes)
    }

    setShader(name: string, vs: string, fs: string, attributes?: IAttribute[]) {
        this.webglArrayBuffer.bindBuffer()
        this.shaders.set(name, new GLShader(this.rapid, vs, fs, attributes))
        if (name === "default") {
            this.defaultShader = this.shaders.get(name)
        }
    }

    getShader(name: string) {
        return this.shaders.get(name)
    }

    render() {
        this.executeRender()
        this.initializeForNextRender()
    }
    protected executeRender() {
        const gl = this.gl
        for (let unit = 0; unit < this.usedTextures.length; unit++) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        }
        this.webglArrayBuffer.bufferData()
    }
    protected initializeForNextRender() {
        this.webglArrayBuffer.clear()
        this.usedTextures.length = 0
        this.isCostumShader = false
        this.freeTextureUnitNum = this.maxTextureUnits
    }

    hasPendingContent(): boolean {
        return false
    }

    isShaderChanged(shader?: GLShader) {
        return (shader || this.defaultShader) != this.currentShader
    }
}

export default RenderRegion