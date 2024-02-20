import { IRapiadOptions, WebGLContext } from "./interface"
import { Color, MatrixStack } from "./math"
import GraphicRegion from "./regions/graphic_region"
import RenderRegion from "./regions/region"
import SpriteRegion from "./regions/sprite_region"
import { Texture, TextureCache } from "./texture"
import GLShader from "./webgl/glshader"
import { getContext } from "./webgl/utils"

class Rapid {
    gl: WebGLContext
    canvas: HTMLCanvasElement
    projection: Float32Array

    matrixStack = new MatrixStack()
    texture = new TextureCache(this)
    private currentRegion?: RenderRegion
    private currentRegionName?: string
    private regions: Map<string, RenderRegion> = new Map

    readonly MAX_TEXTURE_UNITS: number
    private readonly defaultColor = new Color(255, 255, 255, 255)
    constructor(options: IRapiadOptions) {
        const gl = getContext(options.canvas)
        this.gl = gl
        this.canvas = options.canvas
        this.MAX_TEXTURE_UNITS = gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.projection = this.createOrthMatrix(0, this.canvas.width, this.canvas.height, 0)
        this.registerBuildInRegion()

        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    }
    private registerBuildInRegion() {
        this.registerRegion("sprite", SpriteRegion)
        this.registerRegion("graphic", GraphicRegion)
    }
    registerRegion(name: string, regionClass: typeof RenderRegion) {
        this.regions.set(name, new regionClass(this))
    }

    setRegion(regionName: string, customShader?: GLShader) {
        if (
            // isRegionChanged
            regionName != this.currentRegionName ||
            // isShaderChanged
            (customShader && customShader !== this.currentRegion!.currentShader)
        ) {
            const region = this.regions.get(regionName)!;
            if (this.currentRegion) {
                this.currentRegion.render();
                this.currentRegion.exitRegion();
            }

            this.currentRegion = region;
            this.currentRegionName = regionName
            region.enterRegion(customShader);
        }
    }

    save() {
        this.matrixStack.pushMat()
    }

    restore() {
        this.matrixStack.popMat()
    }

    startRender(clear: boolean = true) {
        clear && this.matrixStack.clear()
        this.matrixStack.pushIdentity()
        this.currentRegion = undefined
        this.currentRegionName = undefined
    }

    endRender() {
        this.currentRegion?.render()
    }

    renderSprite(texture: Texture, offsetX: number = 0, offsetY: number = 0, color: Color = this.defaultColor, customShader?: GLShader) {
        this.setRegion("sprite", customShader);
        (this.currentRegion as SpriteRegion).renderSprite(
            texture.base.texture,
            texture.width,
            texture.height,
            texture.clipX,
            texture.clipY,
            texture.clipW,
            texture.clipH,
            offsetX,
            offsetY,
            color.uint32
        )
    }
    
    startGraphicDraw(customShader?: GLShader) {
        this.setRegion("graphic", customShader);
        (this.currentRegion as GraphicRegion).startRender()
    }
    addGraphicVertex(x: number, y: number, color: Color) {
        (this.currentRegion as GraphicRegion).addVertex(x, y, color.uint32)
    }
    endGraphicDraw(){
        (this.currentRegion as GraphicRegion).render()
    }

    clear() {
        const gl = this.gl
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    private createOrthMatrix(left: number, right: number, bottom: number, top: number): Float32Array {
        return new Float32Array([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -1, 0,
            -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
        ]);
    }
    transformPoint(x: number, y: number) {
        return this.matrixStack.apply(x, y)
    }
}

export default Rapid