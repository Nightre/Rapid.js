import { Color, MatrixStack } from "./math";
import GraphicRegion from "./regions/graphic_region";
import SpriteRegion from "./regions/sprite_region";
import { TextureCache } from "./texture";
import { getContext } from "./webgl/utils";
class Rapid {
    constructor(options) {
        Object.defineProperty(this, "gl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "canvas", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "projection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "projectionDirty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "matrixStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new MatrixStack()
        });
        Object.defineProperty(this, "texture", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new TextureCache(this)
        });
        Object.defineProperty(this, "width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "height", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "currentRegion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "currentRegionName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "regions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map
        });
        Object.defineProperty(this, "MAX_TEXTURE_UNITS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "defaultColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Color(255, 255, 255, 255)
        });
        Object.defineProperty(this, "backgroundColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const gl = getContext(options.canvas);
        this.gl = gl;
        this.canvas = options.canvas;
        this.MAX_TEXTURE_UNITS = gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.projection = this.createOrthMatrix(0, this.canvas.width, this.canvas.height, 0);
        this.registerBuildInRegion();
        this.backgroundColor = options.backgroundColor || new Color(255, 255, 255, 255);
        this.width = options.width || this.canvas.width;
        this.height = options.width || this.canvas.height;
        this.resize(this.width, this.height);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    registerBuildInRegion() {
        this.registerRegion("sprite", SpriteRegion);
        this.registerRegion("graphic", GraphicRegion);
    }
    registerRegion(name, regionClass) {
        this.regions.set(name, new regionClass(this));
    }
    setRegion(regionName, customShader) {
        if (
        // isRegionChanged
        regionName != this.currentRegionName ||
            // isShaderChanged
            (customShader && customShader !== this.currentRegion.currentShader)) {
            const region = this.regions.get(regionName);
            if (this.currentRegion) {
                this.currentRegion.render();
                this.currentRegion.exitRegion();
            }
            this.currentRegion = region;
            this.currentRegionName = regionName;
            region.enterRegion(customShader);
        }
    }
    save() {
        this.matrixStack.pushMat();
    }
    restore() {
        this.matrixStack.popMat();
    }
    startRender(clear = true) {
        clear && this.matrixStack.clear();
        this.matrixStack.pushIdentity();
        this.currentRegion = undefined;
        this.currentRegionName = undefined;
    }
    endRender() {
        this.currentRegion?.render();
        this.projectionDirty = false;
    }
    renderSprite(texture, offsetX = 0, offsetY = 0, color = this.defaultColor, customShader) {
        this.setRegion("sprite", customShader);
        this.currentRegion.renderSprite(texture.base.texture, texture.width, texture.height, texture.clipX, texture.clipY, texture.clipW, texture.clipH, offsetX, offsetY, color.uint32);
    }
    startGraphicDraw(customShader) {
        this.setRegion("graphic", customShader);
        this.currentRegion.startRender();
    }
    addGraphicVertex(x, y, color) {
        this.currentRegion.addVertex(x, y, color.uint32);
    }
    endGraphicDraw() {
        this.currentRegion.render();
    }
    resize(width, height) {
        const gl = this.gl;
        this.width = width;
        this.height = height;
        this.projection = this.createOrthMatrix(0, this.width, this.height, 0);
        gl.viewport(0, 0, this.width, this.height);
        this.projectionDirty = true;
    }
    clear() {
        const gl = this.gl;
        const c = this.backgroundColor;
        gl.clearColor(c.r, c.g, c.b, c.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    createOrthMatrix(left, right, bottom, top) {
        return new Float32Array([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -1, 0,
            -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
        ]);
    }
    transformPoint(x, y) {
        return this.matrixStack.apply(x, y);
    }
}
export default Rapid;
