import RenderRegion from "./region";
import fragString from "../shader/sprite.frag";
import vertString from "../shader/sprite.vert";
import { WebglElementBufferArray } from "../math";
const SPRITE_ELMENT_PER_VERTEX = 6;
const INDEX_PER_SPRITE = 6;
const VERTEX_PER_SPRITE = 4;
const FLOAT32_PER_SPRITE = VERTEX_PER_SPRITE * SPRITE_ELMENT_PER_VERTEX;
//                       aPosition  aRegion   aTextureId  aColor
const BYTES_PER_VERTEX = (4 * 2) + (4 * 2) + (4) + (4);
class SpriteElementArray extends WebglElementBufferArray {
    constructor(gl, max) {
        super(gl, INDEX_PER_SPRITE, VERTEX_PER_SPRITE, max);
    }
    addObject(vertex) {
        super.addObject();
        this.push(vertex);
        this.push(vertex + 3);
        this.push(vertex + 2);
        this.push(vertex);
        this.push(vertex + 1);
        this.push(vertex + 2);
    }
}
class SpriteRegion extends RenderRegion {
    constructor(rapid) {
        const gl = rapid.gl;
        const stride = BYTES_PER_VERTEX;
        super(rapid, [
            { name: "aPosition", size: 2, type: gl.FLOAT, stride },
            { name: "aRegion", size: 2, type: gl.FLOAT, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT },
            { name: "aTextureId", size: 1, type: gl.FLOAT, stride, offset: 4 * Float32Array.BYTES_PER_ELEMENT },
            { name: "aColor", size: 4, type: gl.UNSIGNED_BYTE, stride, offset: 5 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
        ]);
        Object.defineProperty(this, "batchSprite", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "indexBuffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "MAX_BATCH", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.initDefaultShader(vertString, this.generateFragShader(fragString, rapid.MAX_TEXTURE_UNITS));
        this.MAX_BATCH = Math.floor(2 ** 16 / VERTEX_PER_SPRITE);
        this.indexBuffer = new SpriteElementArray(gl, this.MAX_BATCH);
    }
    addVertex(x, y, u, v, textureUnit, color) {
        super.addVertex(x, y);
        this.webglArrayBuffer.push(u);
        this.webglArrayBuffer.push(v);
        this.webglArrayBuffer.push(textureUnit);
        this.webglArrayBuffer.pushUint(color);
    }
    renderSprite(texture, width, height, u0, v0, u1, v1, offsetX, offsetY, color) {
        if (this.batchSprite >= this.MAX_BATCH) {
            this.render();
        }
        this.batchSprite++;
        //this.indexBuffer.setObjects(this.batchSprite)
        this.webglArrayBuffer.resize(FLOAT32_PER_SPRITE);
        const textureUnit = this.useTexture(texture);
        /**
         * 0-----1
         * | \   |
         * |   \ |
         * 3-----2
         */
        const posX = offsetX + width;
        const posY = offsetY + height;
        const texU = u0 + u1;
        const texV = v0 + v1;
        this.addVertex(offsetX, offsetY, u0, v0, textureUnit, color); // 0
        this.addVertex(posX, offsetY, texU, v0, textureUnit, color); // 1
        this.addVertex(posX, posY, texU, texV, textureUnit, color); // 2
        this.addVertex(offsetX, posY, u0, texV, textureUnit, color); // 3
    }
    executeRender() {
        super.executeRender();
        const gl = this.gl;
        gl.drawElements(gl.TRIANGLES, this.batchSprite * INDEX_PER_SPRITE, gl.UNSIGNED_SHORT, 0);
    }
    enterRegion(customShader) {
        super.enterRegion(customShader);
        this.indexBuffer.bindBuffer();
        this.gl.uniform1iv(this.currentShader.unifromLoc["uTextures"], this.TEXTURE_UNITS_ARRAY);
    }
    initializeForNextRender() {
        super.initializeForNextRender();
        this.batchSprite = 0;
    }
    generateFragShader(fs, max) {
        let code = "";
        fs = fs.replace("%TEXTURE_NUM%", max.toString());
        for (let index = 0; index < max; index++) {
            if (index == 0) {
                code += `if(vTextureId == ${index}.0)`;
            }
            else if (index == max - 1) {
                code += `else`;
            }
            else {
                code += `else if(vTextureId == ${index}.0)`;
            }
            code += `{color = texture2D(uTextures[${index}], vRegion);}`;
        }
        fs = fs.replace("%GET_COLOR%", code);
        return fs;
    }
}
export default SpriteRegion;
