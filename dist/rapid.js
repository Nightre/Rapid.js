const MATRIX_SIZE = 6;
class DynamicArrayBuffer {
    constructor(arrayType) {
        this.usedElemNum = 0;
        this.maxElemNum = 512;
        this.bytePerElem = arrayType.BYTES_PER_ELEMENT;
        this.arrayType = arrayType;
        this.arraybuffer = new ArrayBuffer(this.maxElemNum * this.bytePerElem);
        this.typedArray = new arrayType(this.arraybuffer);
        if (arrayType == Float32Array) {
            this.uint32 = new Uint32Array(this.arraybuffer);
        }
    }
    clear() {
        this.usedElemNum = 0;
    }
    /**
     * resize the array
     * @param size
     * @returns
     */
    resize(size = 0) {
        size += this.usedElemNum;
        if (size > this.maxElemNum) {
            while (size > this.maxElemNum) {
                this.maxElemNum <<= 1;
            }
            this.setMaxSize(this.maxElemNum);
        }
    }
    setMaxSize(size = this.maxElemNum) {
        const data = this.typedArray;
        this.maxElemNum = size;
        this.arraybuffer = new ArrayBuffer(size * this.bytePerElem);
        this.typedArray = new this.arrayType(this.arraybuffer);
        if (this.uint32) {
            this.uint32 = new Uint32Array(this.arraybuffer);
        }
        this.typedArray.set(data);
    }
    /**
     * push a new element
     * @param value
     */
    push(value) {
        this.typedArray[this.usedElemNum++] = value;
    }
    pushUint(value) {
        this.uint32[this.usedElemNum++] = value;
    }
    /**
     * pop a element
     * @param num
     */
    pop(num) {
        this.usedElemNum -= num;
    }
    /**
     * get the array
     * @param begin
     * @param end
     * @returns
     */
    getArray(begin = 0, end) {
        if (end == undefined) {
            return this.typedArray;
        }
        return this.typedArray.subarray(begin, end);
    }
    /**
     * length of the array
     */
    get length() {
        return this.typedArray.length;
    }
}
class WebglBufferArray extends DynamicArrayBuffer {
    constructor(gl, arrayType, type = gl.ARRAY_BUFFER) {
        super(arrayType);
        this.dirty = true;
        /**
         * webglbuffer 中的大小
         */
        this.webglBufferSize = 0;
        this.gl = gl;
        this.buffer = gl.createBuffer();
        this.type = type;
    }
    push(value) {
        super.push(value);
        this.dirty = true;
    }
    /**
     * bind buffer to gpu
     */
    bindBuffer() {
        this.gl.bindBuffer(this.type, this.buffer);
    }
    /**
     * array data to gpu
     */
    bufferData() {
        if (this.dirty) {
            const gl = this.gl;
            if (this.maxElemNum > this.webglBufferSize) {
                gl.bufferData(this.type, this.getArray(), gl.STATIC_DRAW);
                this.webglBufferSize = this.maxElemNum;
            }
            else {
                gl.bufferSubData(this.type, 0, this.getArray(0, this.usedElemNum));
            }
            this.dirty = false;
        }
    }
}
class MatrixStack extends DynamicArrayBuffer {
    constructor() {
        super(Float32Array);
    }
    /**
     * push a matrix to the stack
     */
    pushMat() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        this.resize(6);
        this.push(arr[offset + 0]);
        this.push(arr[offset + 1]);
        this.push(arr[offset + 2]);
        this.push(arr[offset + 3]);
        this.push(arr[offset + 4]);
        this.push(arr[offset + 5]);
    }
    /**
     * pop a matrix from the stack
     */
    popMat() {
        this.pop(MATRIX_SIZE);
    }
    /**
     * push a matrix and indentiy it
     */
    pushIdentity() {
        this.resize(6);
        this.push(1);
        this.push(0);
        this.push(0);
        this.push(1);
        this.push(0);
        this.push(0);
    }
    /**
     * Translates the current matrix by the specified x and y values.
     * @param x - The amount to translate horizontally.
     * @param y - The amount to translate vertically.
     */
    translate(x, y) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 4] = arr[offset + 0] * x + arr[offset + 2] * y + arr[offset + 4];
        arr[offset + 5] = arr[offset + 1] * x + arr[offset + 3] * y + arr[offset + 5];
    }
    /**
     * Rotates the current matrix by the specified angle.
     * @param angle - The angle, in radians, to rotate the matrix by.
     */
    rotate(angle) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a = arr[offset + 0];
        const b = arr[offset + 1];
        const c = arr[offset + 2];
        const d = arr[offset + 3];
        arr[offset + 0] = a * cos - b * sin;
        arr[offset + 1] = a * sin + b * cos;
        arr[offset + 2] = c * cos - d * sin;
        arr[offset + 3] = c * sin + d * cos;
    }
    /**
     * Multiplies the current matrix on the top of the stack by a scaling transformation.
     * @param x - The amount to scale the matrix horizontally.
     * @param y - The amount to scale the matrix vertically. If not specified, x is used for both horizontal and vertical scaling.
     */
    scale(x, y = x) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 0] = arr[offset + 0] * x;
        arr[offset + 1] = arr[offset + 1] * x;
        arr[offset + 2] = arr[offset + 2] * y;
        arr[offset + 3] = arr[offset + 3] * y;
    }
    apply(x, y) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return [
            arr[offset + 0] * x + arr[offset + 2] * y + arr[offset + 4],
            arr[offset + 1] * x + arr[offset + 3] * y + arr[offset + 5]
        ];
    }
    getInverse() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        const a = arr[offset + 0];
        const b = arr[offset + 1];
        const c = arr[offset + 2];
        const d = arr[offset + 3];
        const e = arr[offset + 4];
        const f = arr[offset + 5];
        const det = a * d - b * c;
        return new Float32Array([
            d / det,
            -b / det,
            -c / det,
            a / det,
            (c * f - d * e) / det,
            (b * e - a * f) / det
        ]);
    }
    getTransform() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return new Float32Array([
            arr[offset + 0],
            arr[offset + 1],
            arr[offset + 2],
            arr[offset + 3],
            arr[offset + 4],
            arr[offset + 5]
        ]);
    }
    setTransform(array) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 0] = array[0];
        arr[offset + 1] = array[1];
        arr[offset + 2] = array[2];
        arr[offset + 3] = array[3];
        arr[offset + 4] = array[4];
        arr[offset + 5] = array[5];
    }
}
class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl, elemVertPerObj, vertexPerObject, maxBatch) {
        super(gl, Uint16Array, gl.ELEMENT_ARRAY_BUFFER);
        this.setMaxSize(elemVertPerObj * maxBatch);
        for (let index = 0; index < maxBatch; index++) {
            this.addObject(index * vertexPerObject);
        }
        this.bindBuffer();
        this.bufferData();
    }
    addObject(_vertex) { }
}
class Color {
    constructor(r, g, b, a) {
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a;
        this.updateUint();
    }
    get r() {
        return this._r;
    }
    set r(value) {
        this._r = value;
        this.updateUint();
    }
    get g() {
        return this._g;
    }
    set g(value) {
        this._g = value;
        this.updateUint();
    }
    get b() {
        return this._b;
    }
    set b(value) {
        this._b = value;
        this.updateUint();
    }
    get a() {
        return this._a;
    }
    set a(value) {
        this._a = value;
        this.updateUint();
    }
    updateUint() {
        this.uint32 = ((this._a << 24) | (this._b << 16) | (this._g << 8) | this._r) >>> 0;
    }
    setRGBA(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.updateUint();
    }
    copy(color) {
        this.setRGBA(color.r, color.g, color.b, color.a);
    }
    equals(color) {
        return color.r == this.r &&
            color.g == this.g &&
            color.b == this.b &&
            color.a == this.a;
    }
    static fromHex(hexString) {
        if (hexString.startsWith('#')) {
            hexString = hexString.slice(1);
        }
        const r = parseInt(hexString.slice(0, 2), 16);
        const g = parseInt(hexString.slice(2, 4), 16);
        const b = parseInt(hexString.slice(4, 6), 16);
        let a = 255;
        if (hexString.length >= 8) {
            a = parseInt(hexString.slice(6, 8), 16);
        }
        return new Color(r, g, b, a);
    }
    add(color) {
        return new Color(Math.min(this.r + color.r, 255), Math.min(this.g + color.g, 255), Math.min(this.b + color.b, 255), Math.min(this.a + color.a, 255));
    }
    subtract(color) {
        return new Color(Math.max(this.r - color.r, 0), Math.max(this.g - color.g, 0), Math.max(this.b - color.b, 0), Math.max(this.a - color.a, 0));
    }
}

var fragString$1 = "precision mediump float;\r\n\r\nvarying vec4 vColor;\r\nvoid main(void) {\r\n    gl_FragColor = vColor;//vColor;\r\n}\r\n";

var vertString$1 = "precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec4 aColor;\r\nvarying vec4 vColor;\r\nuniform mat4 uProjectionMatrix;\r\nuniform vec4 uColor;\r\n\r\nvoid main(void) {\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n    vColor = aColor;\r\n}\r\n";

/**
 * get webgl rendering context
 * @param canvas
 * @returns webgl1 or webgl2
 */
const getContext = (canvas) => {
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
const compileShader = (gl, source, type) => {
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
const createShaderProgram = (gl, vsSource, fsSource) => {
    var program = gl.createProgram(), vShader = compileShader(gl, vsSource, 35633), fShader = compileShader(gl, fsSource, 35632);
    if (!program) {
        throw new Error("Unable to create program shader");
    }
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    return program;
};
function createTexture(gl, image, antialias) {
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

class GLShader {
    constructor(rapid, vs, fs) {
        this.attributeLoc = {};
        this.unifromLoc = {};
        this.program = createShaderProgram(rapid.gl, vs, fs);
        this.gl = rapid.gl;
        this.parseShader(vs);
        this.parseShader(fs);
    }
    use() {
        this.gl.useProgram(this.program);
    }
    parseShader(shader) {
        const gl = this.gl;
        const attributeMatches = shader.match(/attribute\s+\w+\s+(\w+)/g);
        if (attributeMatches) {
            for (const match of attributeMatches) {
                const name = match.split(' ')[2];
                this.attributeLoc[name] = gl.getAttribLocation(this.program, name);
            }
        }
        const uniformMatches = shader.match(/uniform\s+\w+\s+(\w+)/g);
        if (uniformMatches) {
            for (const match of uniformMatches) {
                const name = match.split(' ')[2];
                this.unifromLoc[name] = gl.getUniformLocation(this.program, name);
            }
        }
    }
    setAttribute(element) {
        const gl = this.gl;
        gl.vertexAttribPointer(this.attributeLoc[element.name], element.size, element.type, element.normalized || false, element.stride, element.offset || 0);
        gl.enableVertexAttribArray(this.attributeLoc[element.name]);
    }
}

class RenderRegion {
    constructor(rapid, attributes) {
        this.usedTextures = [];
        this.toAddTextures = new Set;
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
        this.currentShader = customShader !== null && customShader !== void 0 ? customShader : this.defaultShader;
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

//                       aPosition  aColor
const BYTES_PER_VERTEX$1 = 2 * 4 + 4;
const FLOAT32_PER_VERTEX = 3;
class GraphicRegion extends RenderRegion {
    constructor(rapid) {
        const gl = rapid.gl;
        const stride = BYTES_PER_VERTEX$1;
        super(rapid, [
            { name: "aPosition", size: 2, type: gl.FLOAT, stride },
            { name: "aColor", size: 4, type: gl.UNSIGNED_BYTE, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
        ]);
        this.vertex = 0;
        this.initDefaultShader(vertString$1, fragString$1);
    }
    startRender() {
        this.vertex = 0;
        this.webglArrayBuffer.clear();
    }
    addVertex(x, y, color) {
        this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX);
        super.addVertex(x, y);
        this.webglArrayBuffer.pushUint(color);
        this.vertex += 1;
    }
    executeRender() {
        super.executeRender();
        const gl = this.gl;
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertex);
        this.vertex = 0;
    }
}

var fragString = "precision mediump float;\r\nuniform sampler2D uTextures[%TEXTURE_NUM%];\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    %GET_COLOR%\r\n\r\n    gl_FragColor = color*vColor;\r\n}";

var vertString = "precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec2 aRegion;\r\nattribute float aTextureId;\r\nattribute vec4 aColor;\r\n\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vRegion = aRegion;\r\n    vTextureId = aTextureId;\r\n    vColor = aColor;\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n}";

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
        this.batchSprite = 0;
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

/**
 * texture manager
 */
class TextureCache {
    constructor(render) {
        this.cache = new Map;
        this.render = render;
    }
    /**
     * create texture from url
     * Equivalent to {@link Texture.fromUrl} method
     * @param url
     * @param antialias
     * @returns
     */
    async textureFromUrl(url, antialias = false) {
        let base = this.cache.get(url);
        if (!base) {
            const image = await this.loadImage(url);
            base = BaseTexture.fromImageSource(this.render, image, antialias);
            this.cache.set(url, base);
        }
        return new Texture(base);
    }
    async loadImage(url) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.src = url;
        });
    }
    ;
}
/**
 * Each {@link Texture} references a baseTexture, and different textures may have the same baseTexture
 */
class BaseTexture {
    constructor(texture, width, height) {
        this.texture = texture;
        this.width = width;
        this.height = height;
    }
    static fromImageSource(r, image, antialias = false) {
        return new BaseTexture(createTexture(r.gl, image, antialias), image.width, image.height);
    }
}
class Texture {
    /**
     * Creates a new `Texture` instance with the specified base texture reference.
     * @param base - The {@link BaseTexture} to be used by the texture.
     */
    constructor(base) {
        this.base = base;
        this.setClipRegion(0, 0, base.width, base.height);
    }
    /**
     * Sets the region of the texture to be used for rendering.
     * @param x - The x-coordinate of the top-left corner of the region.
     * @param y - The y-coordinate of the top-left corner of the region.
     * @param w - The width of the region.
     * @param h - The height of the region.
     */
    setClipRegion(x, y, w, h) {
        this.clipX = x / this.base.width;
        this.clipY = y / this.base.width;
        this.clipW = this.clipX + (w / this.base.width);
        this.clipH = this.clipY + (h / this.base.width);
        this.width = w;
        this.height = h;
    }
    /**
     * Creates a new `Texture` instance from the specified image source.
     * @param rapid - The Rapid instance to use.
     * @param image - The image source to create the texture from.
     * @param antialias - Whether to enable antialiasing for the texture. Default is `false`.
     * @returns A new `Texture` instance created from the image source.
     */
    static fromImageSource(rapid, image, antialias = false) {
        return new Texture(BaseTexture.fromImageSource(rapid, image, antialias));
    }
    /**
     * Creates a new `Texture` instance from the specified URL.
     * @param rapid - The Rapid instance to use.
     * @param url - The URL of the image to create the texture from.
     * @returns A new `Texture` instance created from the specified URL.
     */
    static fromUrl(rapid, url) {
        return rapid.texture.textureFromUrl(url);
    }
}

class Rapid {
    constructor(options) {
        this.projectionDirty = true;
        this.matrixStack = new MatrixStack();
        this.texture = new TextureCache(this);
        this.regions = new Map;
        this.defaultColor = new Color(255, 255, 255, 255);
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
        var _a;
        (_a = this.currentRegion) === null || _a === void 0 ? void 0 : _a.render();
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

export { BaseTexture, Color, DynamicArrayBuffer, MatrixStack, Rapid, Texture, TextureCache, WebglBufferArray, WebglElementBufferArray };
