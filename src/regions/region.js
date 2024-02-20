import { WebglBufferArray } from "../math";
import GLShader from "../webgl/glshader";
class RenderRegion {
    constructor(rapid, attributes) {
        Object.defineProperty(this, "currentShader", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "defaultShader", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "attribute", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "webglArrayBuffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rapid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "usedTextures", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "toAddTextures", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set
        });
        Object.defineProperty(this, "TEXTURE_UNITS_ARRAY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.attribute = attributes;
        this.rapid = rapid;
        this.gl = rapid.gl;
        this.webglArrayBuffer = new WebglBufferArray(rapid.gl, Float32Array, rapid.gl.ARRAY_BUFFER);
        this.TEXTURE_UNITS_ARRAY = Array.from({ length: rapid.MAX_TEXTURE_UNITS }, (_, index) => index);
    }
    addVertex(x, y, ..._) {
        const [tx, ty] = this.rapid.transformPoint(x, y);
        this.webglArrayBuffer.push(tx);
        this.webglArrayBuffer.push(ty);
    }
    useTexture(texture) {
        let textureUnit = this.usedTextures.indexOf(texture);
        if (textureUnit === -1) {
            // 新纹理 
            if (this.usedTextures.length >= this.rapid.MAX_TEXTURE_UNITS) {
                this.render();
            }
            this.usedTextures.push(texture);
            textureUnit = this.usedTextures.length - 1;
            this.toAddTextures.add(textureUnit);
        }
        return textureUnit;
    }
    enterRegion(customShader) {
        this.currentShader = customShader ?? this.defaultShader;
        this.currentShader.use();
        this.initializeForNextRender();
        this.webglArrayBuffer.bindBuffer();
        for (const element of this.attribute) {
            this.currentShader.setAttribute(element);
        }
        this.gl.uniformMatrix4fv(this.currentShader.unifromLoc["uProjectionMatrix"], false, this.rapid.projection);
    }
    exitRegion() { }
    initDefaultShader(vs, fs) {
        this.webglArrayBuffer.bindBuffer();
        this.defaultShader = new GLShader(this.rapid, vs, fs);
    }
    render() {
        this.executeRender();
        this.initializeForNextRender();
    }
    executeRender() {
        this.webglArrayBuffer.bufferData();
        const gl = this.gl;
        // for (let unit = 0; unit < this.usedTextures.length; unit++) {
        //     gl.activeTexture(gl.TEXTURE0 + unit);
        //     gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        // }
        this.toAddTextures.forEach((unit) => {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        });
        this.toAddTextures.clear();
    }
    initializeForNextRender() {
        this.webglArrayBuffer.clear();
        this.usedTextures = [];
    }
}
export default RenderRegion;
