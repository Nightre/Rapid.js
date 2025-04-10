var MaskType;
(function (MaskType) {
    MaskType["Include"] = "normal";
    MaskType["Exclude"] = "inverse";
})(MaskType || (MaskType = {}));
var TilemapShape;
(function (TilemapShape) {
    TilemapShape["SQUARE"] = "square";
    TilemapShape["ISOMETRIC"] = "isometric";
})(TilemapShape || (TilemapShape = {}));
var ShaderType;
(function (ShaderType) {
    ShaderType["SPRITE"] = "sprite";
    ShaderType["GRAPHIC"] = "graphic";
})(ShaderType || (ShaderType = {}));

const MATRIX_SIZE = 6;
/**
 * @ignore
 */
var ArrayType;
(function (ArrayType) {
    ArrayType[ArrayType["Float32"] = 0] = "Float32";
    ArrayType[ArrayType["Uint32"] = 1] = "Uint32";
    ArrayType[ArrayType["Uint16"] = 2] = "Uint16";
})(ArrayType || (ArrayType = {}));
/**
 * @ignore
 */
class DynamicArrayBuffer {
    constructor(arrayType) {
        this.usedElemNum = 0;
        this.maxElemNum = 512;
        this.bytePerElem = this.getArrayType(arrayType).BYTES_PER_ELEMENT;
        this.arrayType = arrayType;
        this.arraybuffer = new ArrayBuffer(this.maxElemNum * this.bytePerElem);
        this.updateTypedArray();
    }
    getArrayType(arrayType) {
        switch (arrayType) {
            case ArrayType.Float32:
                return Float32Array;
            case ArrayType.Uint32:
                return Uint32Array;
            case ArrayType.Uint16:
                return Uint16Array;
        }
    }
    updateTypedArray() {
        this.uint32 = new Uint32Array(this.arraybuffer);
        this.float32 = new Float32Array(this.arraybuffer);
        this.uint16 = new Uint16Array(this.arraybuffer);
        switch (this.arrayType) {
            case ArrayType.Float32:
                this.typedArray = this.float32;
                break;
            case ArrayType.Uint32:
                this.typedArray = this.uint32;
                break;
            case ArrayType.Uint16:
                this.typedArray = this.uint16;
                break;
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
        this.updateTypedArray();
        this.typedArray.set(data);
    }
    pushUint32(value) {
        this.uint32[this.usedElemNum++] = value;
    }
    pushFloat32(value) {
        this.float32[this.usedElemNum++] = value;
    }
    pushUint16(value) {
        this.uint16[this.usedElemNum++] = value;
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
/**
 * @ignore
 */
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
    pushFloat32(value) {
        super.pushFloat32(value);
        this.dirty = true;
    }
    pushUint32(value) {
        super.pushUint32(value);
        this.dirty = true;
    }
    pushUint16(value) {
        super.pushUint16(value);
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
        super(ArrayType.Float32);
    }
    /**
     * push a matrix to the stack
     */
    pushMat() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        this.resize(6);
        this.pushFloat32(arr[offset + 0]);
        this.pushFloat32(arr[offset + 1]);
        this.pushFloat32(arr[offset + 2]);
        this.pushFloat32(arr[offset + 3]);
        this.pushFloat32(arr[offset + 4]);
        this.pushFloat32(arr[offset + 5]);
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
        this.pushFloat32(1);
        this.pushFloat32(0);
        this.pushFloat32(0);
        this.pushFloat32(1);
        this.pushFloat32(0);
        this.pushFloat32(0);
    }
    /**
     * Translates the current matrix by the specified x and y values.
     * @param x - The amount to translate horizontally.
     * @param y - The amount to translate vertically.
     */
    translate(x, y) {
        if (typeof x !== "number") {
            return this.translate(x.x, x.y);
        }
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
    scale(x, y) {
        if (typeof x !== "number") {
            return this.scale(x.x, x.y);
        }
        if (!y)
            y = x;
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 0] = arr[offset + 0] * x;
        arr[offset + 1] = arr[offset + 1] * x;
        arr[offset + 2] = arr[offset + 2] * y;
        arr[offset + 3] = arr[offset + 3] * y;
    }
    /**
     * Transforms a point by applying the current matrix stack.
     * @returns The transformed point as an array `[newX, newY]`.
     */
    apply(x, y) {
        if (typeof x !== "number") {
            return new Vec2(...this.apply(x.x, x.y));
        }
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return [
            arr[offset + 0] * x + arr[offset + 2] * y + arr[offset + 4],
            arr[offset + 1] * x + arr[offset + 3] * y + arr[offset + 5]
        ];
    }
    /**
     * Obtain the inverse matrix of the current matrix
     * @returns inverse matrix
     */
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
    /**
     * Get a copy of the current transformation matrix
     * @returns matrix
     */
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
    /**
     * Set the current transformation matrix
     * @param array
     */
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
    /**
     * Get the global position in world space
     * @returns The current matrix position in world space
     */
    getGlobalPosition() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return new Vec2(arr[offset + 4], arr[offset + 5]);
    }
    /**
     * Set the global position in world space
     * @param x - x coordinate or Vec2 object
     * @param y - y coordinate (ignored if first parameter is Vec2)
     */
    setGlobalPosition(x, y) {
        if (typeof x !== "number") {
            this.setGlobalPosition(x.x, x.y);
            return;
        }
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 4] = x;
        arr[offset + 5] = y;
    }
    /**
     * Get the global rotation angle
     * @returns The current matrix rotation angle in radians
     */
    getGlobalRotation() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return Math.atan2(arr[offset + 1], arr[offset + 0]);
    }
    /**
     * Set the global rotation angle
     * @param angle - rotation angle in radians
     */
    setGlobalRotation(angle) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        const scale = this.getGlobalScale();
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        arr[offset + 0] = cos * scale.x;
        arr[offset + 1] = sin * scale.x;
        arr[offset + 2] = -sin * scale.y;
        arr[offset + 3] = cos * scale.y;
    }
    /**
     * Get the global scale
     * @returns The current matrix scale values
     */
    getGlobalScale() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        const scaleX = Math.sqrt(arr[offset + 0] * arr[offset + 0] + arr[offset + 1] * arr[offset + 1]);
        const scaleY = Math.sqrt(arr[offset + 2] * arr[offset + 2] + arr[offset + 3] * arr[offset + 3]);
        return new Vec2(scaleX, scaleY);
    }
    /**
     * Set the global scale
     * @param x - x scale or Vec2 object
     * @param y - y scale (ignored if first parameter is Vec2)
     */
    setGlobalScale(x, y) {
        if (typeof x !== "number") {
            this.setGlobalScale(x.x, x.y);
            return;
        }
        const rotation = this.getGlobalRotation();
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 0] = cos * x;
        arr[offset + 1] = sin * x;
        arr[offset + 2] = -sin * y;
        arr[offset + 3] = cos * y;
    }
    globalToLocal(global) {
        const inv = this.getInverse();
        return new Vec2(inv[0] * global.x + inv[2] * global.y + inv[4], inv[1] * global.x + inv[3] * global.y + inv[5]);
    }
    localToGlobal(local) {
        return this.apply(local);
    }
    /**
     * Convert the current matrix to a CSS transform string
     * @returns CSS transform string representation of the matrix
     */
    toCSSTransform() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return `matrix(${arr[offset + 0]}, ${arr[offset + 1]}, ${arr[offset + 2]}, ${arr[offset + 3]}, ${arr[offset + 4]}, ${arr[offset + 5]})`;
    }
    /**
     * Reset the current matrix to identity matrix
     */
    identity() {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 0] = 1;
        arr[offset + 1] = 0;
        arr[offset + 2] = 0;
        arr[offset + 3] = 1;
        arr[offset + 4] = 0;
        arr[offset + 5] = 0;
    }
    /**
     * Apply the transform to the current matrix
     * @param transform - The transform to apply
     * @returns offset position
     */
    applyTransform(transform, width = 0, height = 0) {
        var _c;
        if ((_c = transform.saveTransform) !== null && _c !== void 0 ? _c : true) {
            this.pushMat();
        }
        transform.afterSave && transform.afterSave();
        if (transform.x || transform.y) {
            this.translate(transform.x || 0, transform.y || 0);
        }
        transform.position && this.translate(transform.position);
        transform.rotation && this.rotate(transform.rotation);
        transform.scale && this.scale(transform.scale);
        if (transform.flipX) {
            this.scale(-1, 1);
        }
        if (transform.flipY) {
            this.scale(1, -1);
        }
        let offsetX = 0;
        let offsetY = 0;
        if (transform.offsetX || transform.offsetY) {
            offsetX = transform.offsetX || 0;
            offsetY = transform.offsetY || 0;
        }
        if (transform.offset) {
            offsetX += transform.offset.x;
            offsetY += transform.offset.y;
        }
        if (transform.origin) {
            if (typeof transform.origin == "number") {
                offsetX -= transform.origin * width;
                offsetY -= transform.origin * height;
            }
            else {
                offsetX -= transform.origin.x * width;
                offsetY -= transform.origin.y * height;
            }
        }
        return {
            offsetX,
            offsetY
        };
    }
    applyTransformAfter(transform) {
        var _c;
        if (transform.beforRestore) {
            transform.beforRestore();
        }
        if ((_c = transform.restoreTransform) !== null && _c !== void 0 ? _c : true) {
            this.popMat();
        }
    }
}
/**
 * @ignore
 */
class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl, elemVertPerObj, vertexPerObject, maxBatch) {
        super(gl, ArrayType.Uint16, gl.ELEMENT_ARRAY_BUFFER);
        this.setMaxSize(elemVertPerObj * maxBatch);
        for (let index = 0; index < maxBatch; index++) {
            this.addObject(index * vertexPerObject);
        }
        this.bindBuffer();
        this.bufferData();
    }
    addObject(_vertex) { }
}
/**
 * Represents a color with red, green, blue, and alpha (transparency) components.
 */
class Color {
    /**
     * Creates an instance of Color.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    constructor(r, g, b, a = 255) {
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a;
        this.updateUint();
    }
    /**
     * Gets the red component.
     */
    get r() {
        return this._r;
    }
    /**
     * Sets the red component and updates the uint32 representation.
     * @param value - The new red component (0-255).
     */
    set r(value) {
        this._r = value;
        this.updateUint();
    }
    /**
     * Gets the green component.
     */
    get g() {
        return this._g;
    }
    /**
     * Sets the green component and updates the uint32 representation.
     * @param value - The new green component (0-255).
     */
    set g(value) {
        this._g = value;
        this.updateUint();
    }
    /**
     * Gets the blue component.
     */
    get b() {
        return this._b;
    }
    /**
     * Sets the blue component and updates the uint32 representation.
     * @param value - The new blue component (0-255).
     */
    set b(value) {
        this._b = value;
        this.updateUint();
    }
    /**
     * Gets the alpha component.
     */
    get a() {
        return this._a;
    }
    /**
     * Sets the alpha component and updates the uint32 representation.
     * @param value - The new alpha component (0-255).
     */
    set a(value) {
        this._a = value;
        this.updateUint();
    }
    /**
     * Updates the uint32 representation of the color.
     * @private
     */
    updateUint() {
        this.uint32 = ((this._a << 24) | (this._b << 16) | (this._g << 8) | this._r) >>> 0;
    }
    /**
     * Sets the RGBA values of the color and updates the uint32 representation.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    setRGBA(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.updateUint();
    }
    /**
     * Copies the RGBA values from another color.
     * @param color - The color to copy from.
     */
    copy(color) {
        this.setRGBA(color.r, color.g, color.b, color.a);
    }
    /**
     * Clone the current color
     * @returns A new `Color` instance with the same RGBA values.
     */
    clone() {
        return new Color(this._r, this._g, this._b, this._a);
    }
    /**
     * Checks if the current color is equal to another color.
     * @param color - The color to compare with.
     * @returns True if the colors are equal, otherwise false.
     */
    equal(color) {
        return color.r === this.r &&
            color.g === this.g &&
            color.b === this.b &&
            color.a === this.a;
    }
    /**
     * Creates a Color instance from a hexadecimal color string.
     * @param hexString - The hexadecimal color string, e.g., '#RRGGBB' or '#RRGGBBAA'.
     * @returns A new Color instance.
     */
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
    /**
     * Adds the components of another color to this color, clamping the result to 255.
     * @param color - The color to add.
     * @returns A new Color instance with the result of the addition.
     */
    add(color) {
        return new Color(Math.min(this.r + color.r, 255), Math.min(this.g + color.g, 255), Math.min(this.b + color.b, 255), Math.min(this.a + color.a, 255));
    }
    /**
     * Subtracts the components of another color from this color, clamping the result to 0.
     * @param color - The color to subtract.
     * @returns A new Color instance with the result of the subtraction.
     */
    subtract(color) {
        return new Color(Math.max(this.r - color.r, 0), Math.max(this.g - color.g, 0), Math.max(this.b - color.b, 0), Math.max(this.a - color.a, 0));
    }
}
Color.Red = new Color(255, 0, 0, 255);
Color.Green = new Color(0, 255, 0, 255);
Color.Blue = new Color(0, 0, 255, 255);
Color.Yellow = new Color(255, 255, 0, 255);
Color.Purple = new Color(128, 0, 128, 255);
Color.Orange = new Color(255, 165, 0, 255);
Color.Pink = new Color(255, 192, 203, 255);
Color.Gray = new Color(128, 128, 128, 255);
Color.Brown = new Color(139, 69, 19, 255);
Color.Cyan = new Color(0, 255, 255, 255);
Color.Magenta = new Color(255, 0, 255, 255);
Color.Lime = new Color(192, 255, 0, 255);
Color.White = new Color(255, 255, 255, 255);
Color.Black = new Color(0, 0, 0, 255);
/**
 * Represents a 2D vector with x and y components.
 */
class Vec2 {
    /**
     * Creates an instance of Vec2.
     * @param x - The x coordinate (default is 0).
     * @param y - The y coordinate (default is 0).
     */
    constructor(x, y) {
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }
    /**
     * Adds another vector to this vector.
     * @param v - The vector to add.
     * @returns A new Vec2 instance with the result of the addition.
     */
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    /**
     * Subtracts another vector from this vector.
     * @param v - The vector to subtract.
     * @returns A new Vec2 instance with the result of the subtraction.
     */
    subtract(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    /**
     * Multiplies the vector by a scalar or another vector.
     * @param f - The scalar value or vector to multiply by.
     * @returns A new Vec2 instance with the result of the multiplication.
     */
    multiply(f) {
        if (f instanceof Vec2) {
            return new Vec2(this.x * f.x, this.y * f.y);
        }
        return new Vec2(this.x * f, this.y * f);
    }
    /**
     * Divides the vector by a scalar or another vector.
     * @param f - The scalar value or vector to divide by.
     * @returns A new Vec2 instance with the result of the division.
     */
    divide(f) {
        if (f instanceof Vec2) {
            return new Vec2(this.x / f.x, this.y / f.y);
        }
        return new Vec2(this.x / f, this.y / f);
    }
    /**
     * Calculates the dot product of this vector with another vector.
     * @param v - The other vector.
     * @returns The dot product result.
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    /**
     * Calculates the cross product of this vector with another vector.
     * @param v - The other vector.
     * @returns The cross product result.
     */
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    /**
     * Calculates the distance to another point.
     * @param v - The other point.
     * @returns The distance between the two points.
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Clones the vector.
     * @returns A new Vec2 instance with the same x and y values.
     */
    clone() {
        return new Vec2(this.x, this.y);
    }
    /**
     * Copy the vector
     * @param vec - The vector to copy.
     */
    copy(vec) {
        this.x = vec.x;
        this.y = vec.y;
    }
    /**
     * Check if the vector is equal to another vector.
     * @param vec - The vector to compare with.
     * @returns True if the vectors are equal, otherwise false.
     */
    equal(vec) {
        return vec.x == this.x && vec.y == this.y;
    }
    /**
     * Rotates the vector 90 degrees counterclockwise.
     * @returns The current instance with updated values.
     */
    perpendicular() {
        const x = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }
    /**
     * Inverts the direction of the vector.
     * @returns The current instance with updated values.
     */
    invert() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    /**
     * Calculates the length of the vector.
     * @returns The length of the vector.
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * Normalizes the vector to have a length of 1.
     * @returns The current instance with updated values.
     */
    normalize() {
        const mod = this.length();
        this.x = this.x / mod || 0;
        this.y = this.y / mod || 0;
        return this;
    }
    /**
     * Calculates the angle of the vector relative to the x-axis.
     * @returns The angle of the vector.
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }
    /**
     * Calculates the middle point between the current vector and another vector.
     * @param other - The other vector.
     * @returns A new vector representing the middle point between the current vector and the other vector.
     */
    middle(other) {
        return new Vec2((this.x + other.x) / 2, (this.y + other.y) / 2);
    }
    /**
     * Returns a new vector with the absolute values of the components.
     * @returns A new vector with absolute values.
     */
    abs() {
        return new Vec2(Math.abs(this.x), Math.abs(this.y));
    }
    /**
     * Returns a new vector with floored components.
     * @returns A new vector with components rounded down to the nearest integer.
     */
    floor() {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }
    /**
     * Returns a new vector with ceiled components.
     * @returns A new vector with components rounded up to the nearest integer.
     */
    ceil() {
        return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
    }
    /**
     * Snaps the vector components to the nearest increment.
     * @param increment - The increment to snap to.
     * @returns A new vector with components snapped to the nearest increment.
     */
    snap(increment) {
        return new Vec2(Math.round(this.x / increment) * increment, Math.round(this.y / increment) * increment);
    }
    /**
     * Converts the vector to a string representation.
     * @returns A string containing the vector's x and y coordinates.
     */
    stringify() {
        return `Vec2(${this.x}, ${this.y})`;
    }
    /**
     * Converts an array of coordinate pairs into an array of Vec2 instances.
     * @param array - An array of [x, y] coordinate pairs.
     * @returns An array of Vec2 instances.
     */
    static FromArray(array) {
        return array.map(pair => new Vec2(pair[0], pair[1]));
    }
}
Vec2.ZERO = new Vec2(0, 0);
Vec2.ONE = new Vec2(1, 1);
Vec2.UP = new Vec2(0, 1);
Vec2.DOWN = new Vec2(0, -1);
Vec2.LEFT = new Vec2(-1, 0);
Vec2.RIGHT = new Vec2(1, 0);
/**
 * Provides utility methods for mathematical conversions.
 */
class MathUtils {
    /**
     * Converts degrees to radians.
     * @param degrees - The angle in degrees.
     * @returns The equivalent angle in radians.
     */
    static deg2rad(degrees) {
        return degrees * (Math.PI / 180);
    }
    /**
     * Converts radians to degrees.
     * @param rad - The angle in radians.
     * @returns The equivalent angle in degrees.
     */
    static rad2deg(rad) {
        return rad / (Math.PI / 180);
    }
    /**
     * Normalizes an angle in degrees to be within the range of 0 to 360 degrees.
     * @param degrees - The angle in degrees to be normalized.
     * @returns The normalized angle in degrees.
     */
    static normalizeDegrees(degrees) {
        return ((degrees % 360) + 360) % 360;
    }
}

const LINE_ROUND_SEGMENTS = 10;
const addSemicircle = (center, normal, width, isStart) => {
    const result = [];
    const startAngle = isStart ? Math.atan2(normal.y, normal.x) : Math.atan2(-normal.y, -normal.x);
    const totalAngle = Math.PI;
    for (let i = 0; i < LINE_ROUND_SEGMENTS; i++) {
        const t1 = i / LINE_ROUND_SEGMENTS;
        const t2 = (i + 1) / LINE_ROUND_SEGMENTS;
        const angle1 = startAngle + t1 * totalAngle;
        const angle2 = startAngle + t2 * totalAngle;
        const x1 = Math.cos(angle1) * width;
        const y1 = Math.sin(angle1) * width;
        const x2 = Math.cos(angle2) * width;
        const y2 = Math.sin(angle2) * width;
        result.push(center);
        result.push(center.add(new Vec2(x1, y1)));
        result.push(center.add(new Vec2(x2, y2)));
    }
    return result;
};
/**
 * @ignore
 */
const getLineNormal = (points, closed = false) => {
    const normals = [];
    if (points.length < 2 || (closed && points.length < 3))
        return normals;
    const maxMiterLength = 4; // 最大斜接长度限制
    const epsilon = 0.001; // 直线检测阈值
    const n = points.length;
    // 计算法线和斜接长度的通用函数
    const calculateNormal = (prev, point, next) => {
        const dirA = point.subtract(prev).normalize();
        const dirB = point.subtract(next).normalize();
        const dot = dirB.dot(dirA);
        if (dot < -1 + epsilon) { // 近似直线
            return { normal: dirA.perpendicular(), miters: 1 };
        }
        else {
            let miter = dirB.add(dirA).normalize();
            if (dirA.cross(dirB) < 0)
                miter = miter.multiply(-1);
            let miterLength = 1 / Math.sqrt((1 - dot) / 2);
            return { normal: miter, miters: Math.min(miterLength, maxMiterLength) };
        }
    };
    if (closed) {
        // 处理闭合路径
        for (let i = 0; i < n - 1; i++) {
            const prev = i === 0 ? points[n - 2] : points[i - 1];
            const point = points[i];
            const next = points[i + 1];
            normals.push(calculateNormal(prev, point, next));
        }
        normals.push(normals[0]); // 复制首点法线到尾点
    }
    else {
        // 处理非闭合路径
        for (let i = 0; i < n; i++) {
            if (i === 0) {
                // 首点
                const direction = points[1].subtract(points[0]).normalize();
                normals.push({ normal: direction.perpendicular(), miters: 1 });
            }
            else if (i === n - 1) {
                // 尾点
                const direction = points[i].subtract(points[i - 1]).normalize();
                normals.push({ normal: direction.perpendicular(), miters: 1 });
            }
            else {
                // 中间点
                normals.push(calculateNormal(points[i - 1], points[i], points[i + 1]));
            }
        }
    }
    return normals;
};
const getLineGeometry = (options) => {
    const points = options.points;
    if (points.length < 2)
        return [];
    const normals = getLineNormal(points, options.closed);
    const lineWidth = (options.width || 1.0) / 2; // 半宽
    const vertices = [];
    const roundCap = options.roundCap || false;
    for (let i = 0; i < points.length - 1; i++) {
        const point = points[i];
        const normal = normals[i].normal;
        const miters = normals[i].miters;
        const top = point.add(normal.multiply(miters * lineWidth));
        const bottom = point.subtract(normal.multiply(miters * lineWidth));
        const nextPoint = points[i + 1];
        const nextNormal = normals[i + 1].normal;
        const nextMiter = normals[i + 1].miters;
        const nextTop = nextPoint.add(nextNormal.multiply(nextMiter * lineWidth));
        const nextBottom = nextPoint.subtract(nextNormal.multiply(nextMiter * lineWidth));
        // 确保逆时针缠绕（假设正面为逆时针）
        vertices.push(top);
        vertices.push(bottom);
        vertices.push(nextTop);
        vertices.push(nextTop);
        vertices.push(nextBottom);
        vertices.push(bottom);
    }
    if (roundCap && !options.closed) {
        const startPoint = points[0];
        const startNormal = normals[0].normal;
        vertices.push(...addSemicircle(startPoint, startNormal, lineWidth, true));
        const endPoint = points[points.length - 1];
        const endNormal = normals[points.length - 1].normal;
        vertices.push(...addSemicircle(endPoint, endNormal, lineWidth, false));
    }
    return vertices;
};

var fragString$1 = "precision mediump float;\r\nvarying vec2 vRegion;\r\nvarying vec4 vColor;\r\n\r\nuniform sampler2D uTexture;\r\nuniform int uUseTexture;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    if(uUseTexture > 0){\r\n        color = texture2D(uTexture, vRegion) * vColor;\r\n    }else{\r\n        color = vColor;\r\n    }\r\n    gl_FragColor = color;\r\n}\r\n";

var vertString$1 = "precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec4 aColor;\r\nattribute vec2 aRegion;\r\n\r\nvarying vec4 vColor;\r\nuniform mat4 uProjectionMatrix;\r\nuniform vec4 uColor;\r\nvarying vec2 vRegion;\r\n\r\nvoid main(void) {\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n    \r\n    vColor = aColor;\r\n    vRegion = aRegion;\r\n}\r\n";

/**
 * get webgl rendering context
 * @param canvas
 * @returns webgl1 or webgl2
 */
const getContext = (canvas) => {
    const options = { stencil: true };
    const gl = canvas.getContext("webgl2", options) || canvas.getContext("webgl", options);
    if (!gl) {
        throw new Error("Unable to initialize WebGL. Your browser may not support it.");
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
    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linkStatus) {
        const errorLog = gl.getProgramInfoLog(program);
        throw new Error("Unable to link shader program: " + errorLog);
    }
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
function generateFragShader(fs, max) {
    if (fs.includes("%TEXTURE_NUM%"))
        fs = fs.replace("%TEXTURE_NUM%", max.toString());
    if (fs.includes("%GET_COLOR%")) {
        let code = "";
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
    }
    return fs;
}
const FLOAT = 5126;
const UNSIGNED_BYTE = 5121;

var fragString = "precision mediump float;\r\nuniform sampler2D uTextures[%TEXTURE_NUM%];\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    %GET_COLOR%\r\n\r\n    gl_FragColor = color * vColor;\r\n}";

var vertString = "precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec2 aRegion;\r\nattribute float aTextureId;\r\nattribute vec4 aColor;\r\n\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vRegion = aRegion;\r\n    vTextureId = aTextureId;\r\n    vColor = aColor;\r\n\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n}";

//                       aPosition  aRegion   aTextureId  aColor
const SPRITE_BYTES_PER_VERTEX = (4 * 2) + (4 * 2) + (4) + (4);
const stride = SPRITE_BYTES_PER_VERTEX;
const spriteAttributes = [
    { name: "aPosition", size: 2, type: FLOAT, stride },
    { name: "aRegion", size: 2, type: FLOAT, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT },
    { name: "aTextureId", size: 1, type: FLOAT, stride, offset: 4 * Float32Array.BYTES_PER_ELEMENT },
    { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride, offset: 5 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
];
const GRAPHIC_BYTES_PER_VERTEX = 2 * 4 + 4 + 2 * 4;
const graphicAttributes = [
    { name: "aPosition", size: 2, type: FLOAT, stride: GRAPHIC_BYTES_PER_VERTEX },
    { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride: GRAPHIC_BYTES_PER_VERTEX, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
    { name: "aRegion", size: 2, type: FLOAT, stride: GRAPHIC_BYTES_PER_VERTEX, offset: 3 * Float32Array.BYTES_PER_ELEMENT }
];

class GLShader {
    constructor(rapid, vs, fs, attributes, usedTexture = 0) {
        this.attributeLoc = {};
        this.uniformLoc = {};
        this.attributes = [];
        const processedFragmentShaderSource = generateFragShader(fs, rapid.maxTextureUnits - usedTexture);
        this.program = createShaderProgram(rapid.gl, vs, processedFragmentShaderSource);
        this.gl = rapid.gl;
        this.usedTexture = usedTexture;
        this.parseShader(vs);
        this.parseShader(processedFragmentShaderSource);
        if (attributes) {
            this.setAttributes(attributes);
        }
    }
    /**
     * Set the uniform of this shader
     * @param uniforms
     * @param usedTextureUnit How many texture units have been used
     */
    setUniforms(uniform, usedTextureUnit) {
        const gl = this.gl;
        for (const uniformName of uniform.getUnifromNames()) {
            const loc = this.getUniform(uniformName);
            usedTextureUnit = uniform.bind(gl, uniformName, loc, usedTextureUnit);
        }
        return usedTextureUnit;
    }
    getUniform(name) {
        return this.uniformLoc[name];
    }
    /**
     * use this shader
     */
    use() {
        this.gl.useProgram(this.program);
    }
    parseShader(shader) {
        const gl = this.gl;
        const attributeMatches = shader.match(/attribute\s+\w+\s+(\w+)/g);
        if (attributeMatches) {
            for (const match of attributeMatches) {
                const name = match.split(' ')[2];
                const loc = gl.getAttribLocation(this.program, name);
                if (loc != -1)
                    this.attributeLoc[name] = loc;
            }
        }
        const uniformMatches = shader.match(/uniform\s+\w+\s+(\w+)/g);
        if (uniformMatches) {
            for (const match of uniformMatches) {
                const name = match.split(' ')[2];
                this.uniformLoc[name] = gl.getUniformLocation(this.program, name);
            }
        }
    }
    /**
     * Set vertex attribute in glsl shader
     * @param element
     */
    setAttribute(element) {
        const loc = this.attributeLoc[element.name];
        if (typeof loc != "undefined") {
            const gl = this.gl;
            gl.vertexAttribPointer(loc, element.size, element.type, element.normalized || false, element.stride, element.offset || 0);
            gl.enableVertexAttribArray(loc);
        }
    }
    /**
     * Set vertex attributes in glsl shader
     * @param elements
     */
    setAttributes(elements) {
        this.attributes = elements;
        for (const element of elements) {
            this.setAttribute(element);
        }
    }
    updateAttributes() {
        this.setAttributes(this.attributes);
    }
    static createCostumShader(rapid, vs, fs, type, usedTexture = 0) {
        let baseFs = {
            [ShaderType.SPRITE]: fragString,
            [ShaderType.GRAPHIC]: fragString$1,
        }[type];
        let baseVs = {
            [ShaderType.SPRITE]: vertString,
            [ShaderType.GRAPHIC]: vertString$1,
        }[type];
        const attribute = {
            [ShaderType.SPRITE]: spriteAttributes,
            [ShaderType.GRAPHIC]: graphicAttributes,
        }[type];
        baseFs = baseFs.replace('void main(void) {', fs + '\nvoid main(void) {');
        baseVs = baseVs.replace('void main(void) {', vs + '\nvoid main(void) {');
        baseFs = baseFs.replace('gl_FragColor = ', 'fragment(color);\ngl_FragColor = ');
        baseVs = baseVs.replace('gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);', `vec2 position = aPosition;
vertex(position, vRegion);
gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);`);
        return new GLShader(rapid, baseVs, baseFs, attribute, usedTexture);
    }
}

class RenderRegion {
    constructor(rapid) {
        this.usedTextures = [];
        this.needBind = new Set;
        this.shaders = new Map();
        this.isCostumShader = false;
        this.rapid = rapid;
        this.gl = rapid.gl;
        this.webglArrayBuffer = new WebglBufferArray(rapid.gl, ArrayType.Float32, rapid.gl.ARRAY_BUFFER);
        this.MAX_TEXTURE_UNIT_ARRAY = Array.from({ length: rapid.maxTextureUnits }, (_, index) => index);
    }
    setTextureUnits(usedTexture) {
        return this.MAX_TEXTURE_UNIT_ARRAY.slice(usedTexture, -1);
    }
    addVertex(x, y, ..._) {
        const [tx, ty] = this.rapid.matrixStack.apply(x, y);
        this.webglArrayBuffer.pushFloat32(tx);
        this.webglArrayBuffer.pushFloat32(ty);
    }
    useTexture(texture) {
        let textureUnit = this.usedTextures.indexOf(texture);
        if (textureUnit === -1) {
            // 新纹理 
            if (this.usedTextures.length >= this.rapid.maxTextureUnits) {
                this.render();
            }
            this.usedTextures.push(texture);
            textureUnit = this.usedTextures.length - 1;
            this.needBind.add(textureUnit);
        }
        return textureUnit;
    }
    enterRegion(customShader) {
        this.currentShader = customShader !== null && customShader !== void 0 ? customShader : this.getShader("default");
        this.currentShader.use();
        this.initializeForNextRender();
        this.webglArrayBuffer.bindBuffer();
        // this.currentShader.setAttributes(this.attribute)
        this.currentShader.updateAttributes();
        this.gl.uniformMatrix4fv(this.currentShader.uniformLoc["uProjectionMatrix"], false, this.rapid.projection);
        this.isCostumShader = Boolean(customShader);
    }
    setCostumUnifrom(newCurrentUniform) {
        let isChanged = false;
        if (this.costumUnifrom != newCurrentUniform) {
            isChanged = true;
            this.costumUnifrom = newCurrentUniform;
        }
        else if (newCurrentUniform === null || newCurrentUniform === void 0 ? void 0 : newCurrentUniform.isDirty) {
            isChanged = true;
        }
        newCurrentUniform === null || newCurrentUniform === void 0 ? void 0 : newCurrentUniform.clearDirty();
        return isChanged;
    }
    exitRegion() { }
    initDefaultShader(vs, fs, attributes) {
        // this.webglArrayBuffer.bindBuffer()
        // this.defaultShader = new GLShader(this.rapid, vs, fs, attributes)
        this.setShader("default", vs, fs, attributes);
    }
    setShader(name, vs, fs, attributes) {
        this.webglArrayBuffer.bindBuffer();
        this.shaders.set(name, new GLShader(this.rapid, vs, fs, attributes));
    }
    getShader(name) {
        return this.shaders.get(name);
    }
    render() {
        this.executeRender();
        this.initializeForNextRender();
    }
    executeRender() {
        this.webglArrayBuffer.bufferData();
        const gl = this.gl;
        for (const unit of this.needBind) {
            gl.activeTexture(gl.TEXTURE0 + unit + this.currentShader.usedTexture);
            gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
        }
        this.needBind.clear();
    }
    initializeForNextRender() {
        this.webglArrayBuffer.clear();
        this.usedTextures = [];
        this.isCostumShader = false;
    }
    hasPendingContent() {
        return false;
    }
    isShaderChanged(shader) {
        return (shader || this.getShader('default')) != this.currentShader;
    }
}

//                       aPosition  aColor
const FLOAT32_PER_VERTEX = 3;
class GraphicRegion extends RenderRegion {
    constructor(rapid) {
        super(rapid);
        this.vertex = 0;
        this.offset = Vec2.ZERO;
        this.drawType = rapid.gl.TRIANGLE_FAN;
        this.setShader('default', vertString$1, fragString$1, graphicAttributes);
    }
    startRender(offsetX, offsetY, texture, uniforms) {
        var _a;
        uniforms && ((_a = this.currentShader) === null || _a === void 0 ? void 0 : _a.setUniforms(uniforms, 1));
        this.offset = new Vec2(offsetX, offsetY);
        this.vertex = 0;
        this.webglArrayBuffer.clear();
        if (texture && texture.base) {
            this.texture = this.useTexture(texture.base.texture);
        }
    }
    addVertex(x, y, u, v, color) {
        this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX);
        super.addVertex(x + this.offset.x, y + this.offset.y);
        this.webglArrayBuffer.pushUint32(color);
        this.webglArrayBuffer.pushFloat32(u);
        this.webglArrayBuffer.pushFloat32(v);
        this.vertex += 1;
    }
    executeRender() {
        super.executeRender();
        const gl = this.gl;
        gl.uniform1i(this.currentShader.uniformLoc["uUseTexture"], typeof this.texture == "undefined" ? 0 : 1);
        if (this.texture) {
            gl.uniform1i(this.currentShader.uniformLoc["uTexture"], this.texture);
        }
        gl.drawArrays(this.drawType, 0, this.vertex);
        this.drawType = this.rapid.gl.TRIANGLE_FAN;
        this.vertex = 0;
        this.texture = undefined;
    }
}

const INDEX_PER_SPRITE = 6;
const VERTEX_PER_SPRITE = 4;
const SPRITE_ELMENT_PER_VERTEX = 5;
const FLOAT32_PER_SPRITE = VERTEX_PER_SPRITE * SPRITE_ELMENT_PER_VERTEX;
// 2 ** 16 = Unit16 MAX_VALUE / VERTEX_PER_SPRITE = MAX_BATCH
const MAX_BATCH = Math.floor(2 ** 16 / VERTEX_PER_SPRITE);
class SpriteElementArray extends WebglElementBufferArray {
    constructor(gl, max) {
        super(gl, INDEX_PER_SPRITE, VERTEX_PER_SPRITE, max);
    }
    addObject(vertex) {
        super.addObject();
        this.pushUint16(vertex);
        this.pushUint16(vertex + 3);
        this.pushUint16(vertex + 2);
        this.pushUint16(vertex);
        this.pushUint16(vertex + 1);
        this.pushUint16(vertex + 2);
    }
}
class SpriteRegion extends RenderRegion {
    constructor(rapid) {
        const gl = rapid.gl;
        super(rapid);
        this.batchSprite = 0;
        this.setShader("default", vertString, fragString, spriteAttributes);
        this.indexBuffer = new SpriteElementArray(gl, MAX_BATCH);
    }
    addVertex(x, y, u, v, textureUnit, color) {
        super.addVertex(x, y);
        this.webglArrayBuffer.pushFloat32(u);
        this.webglArrayBuffer.pushFloat32(v);
        this.webglArrayBuffer.pushFloat32(textureUnit);
        this.webglArrayBuffer.pushUint32(color);
    }
    renderSprite(texture, width, height, u0, v0, u1, v1, offsetX, offsetY, color, uniforms) {
        if (this.batchSprite >= MAX_BATCH) {
            this.render();
        }
        if (uniforms && this.setCostumUnifrom(uniforms)) {
            this.render();
            this.currentShader.setUniforms(uniforms, 0);
        }
        this.batchSprite++;
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
        this.addVertex(offsetX, offsetY, u0, v0, textureUnit, color); // 0
        this.addVertex(posX, offsetY, u1, v0, textureUnit, color); // 1
        this.addVertex(posX, posY, u1, v1, textureUnit, color); // 2
        this.addVertex(offsetX, posY, u0, v1, textureUnit, color); // 3
    }
    executeRender() {
        super.executeRender();
        const gl = this.gl;
        gl.drawElements(gl.TRIANGLES, this.batchSprite * INDEX_PER_SPRITE, gl.UNSIGNED_SHORT, 0);
    }
    enterRegion(customShader) {
        super.enterRegion(customShader);
        this.indexBuffer.bindBuffer();
        this.gl.uniform1iv(this.currentShader.uniformLoc["uTextures"], this.setTextureUnits(this.currentShader.usedTexture));
    }
    initializeForNextRender() {
        super.initializeForNextRender();
        this.batchSprite = 0;
    }
    hasPendingContent() {
        return this.batchSprite > 0;
    }
}

/**
 * texture manager
 * @ignore
 */
class TextureCache {
    constructor(render, antialias) {
        this.cache = new Map;
        this.render = render;
        this.antialias = antialias;
    }
    /**
     * create texture from url
     * Equivalent to {@link Texture.fromUrl} method
     * @param url
     * @param antialias
     * @returns
     */
    async textureFromUrl(url, antialias = this.antialias) {
        let base = this.cache.get(url);
        if (!base) {
            const image = await this.loadImage(url);
            base = BaseTexture.fromImageSource(this.render, image, antialias);
            this.cache.set(url, base);
        }
        return new Texture(base);
    }
    async textureFromSource(source, antialias = this.antialias) {
        let base = this.cache.get(source);
        if (!base) {
            base = BaseTexture.fromImageSource(this.render, source, antialias);
            this.cache.set(source, base);
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
    /**
     * Create a new `Text` instance.
     * @param options - The options for rendering the text, such as font, size, color, etc.
     * @returns A new `Text` instance.
     */
    createText(options) {
        return new Text(this.render, options);
    }
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
        /**
         * Image scaling factor
         */
        this.scale = 1;
        this.setBaseTextur(base);
    }
    /**
     * Set or change BaseTexture
     * @param base
     * @param scale
     */
    setBaseTextur(base) {
        if (base) {
            this.base = base;
            this.setClipRegion(0, 0, base.width, base.height);
        }
    }
    /**
     * Sets the region of the texture to be used for rendering.
     * @param x - The x-coordinate of the top-left corner of the region.
     * @param y - The y-coordinate of the top-left corner of the region.
     * @param w - The width of the region.
     * @param h - The height of the region.
     */
    setClipRegion(x, y, w, h) {
        if (!this.base)
            return;
        this.clipX = x / this.base.width;
        this.clipY = y / this.base.height;
        this.clipW = this.clipX + (w / this.base.width);
        this.clipH = this.clipY + (h / this.base.height);
        this.width = w * this.scale;
        this.height = h * this.scale;
        return this;
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
        return rapid.textures.textureFromUrl(url);
    }
    /**
     * Converts the current texture into a spritesheet.
     * @param rapid - The Rapid instance to use.
     * @param spriteWidth - The width of each sprite in the spritesheet.
     * @param spriteHeight - The height of each sprite in the spritesheet.
     * @returns An array of `Texture` instances representing the sprites in the spritesheet.
     */
    createSpritesHeet(spriteWidth, spriteHeight) {
        if (!this.base)
            return [];
        const sprites = [];
        const columns = Math.floor(this.base.width / spriteWidth);
        const rows = Math.floor(this.base.height / spriteHeight);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const sprite = this.clone();
                sprite.setClipRegion(x * spriteWidth, y * spriteHeight, spriteWidth, spriteHeight);
                sprites.push(sprite);
            }
        }
        return sprites;
    }
    /**
     * Clone the current texture
     * @returns A new `Texture` instance with the same base texture reference.
     */
    clone() {
        return new Texture(this.base);
    }
}
/**
 * @ignore
 */
const SCALEFACTOR = 2;
class Text extends Texture {
    /**
     * Creates a new `Text` instance.
     * @param options - The options for rendering the text, such as font, size, color, etc.
     */
    constructor(rapid, options) {
        super();
        this.scale = 1 / SCALEFACTOR;
        this.rapid = rapid;
        this.options = options;
        this.text = options.text || ' ';
        this.updateTextImage();
    }
    updateTextImage() {
        const canvas = this.createTextCanvas();
        this.setBaseTextur(BaseTexture.fromImageSource(this.rapid, canvas, true));
    }
    /**
     * Creates a canvas element for rendering text.
     * @returns HTMLCanvasElement - The created canvas element.
     */
    createTextCanvas() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get canvas context');
        }
        context.font = `${this.options.fontSize || 16}px ${this.options.fontFamily || 'Arial'}`;
        context.fillStyle = this.options.color || '#000';
        context.textAlign = this.options.textAlign || 'left';
        context.textBaseline = this.options.textBaseline || 'top';
        // Measure text to adjust canvas size
        const lines = this.text.split('\n');
        let maxWidth = 0;
        let totalHeight = 0;
        for (const line of lines) {
            const metrics = context.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
            totalHeight += (this.options.fontSize || 16);
        }
        canvas.width = maxWidth * SCALEFACTOR;
        canvas.height = totalHeight * SCALEFACTOR;
        context.scale(SCALEFACTOR, SCALEFACTOR);
        // Redraw the text on the correctly sized canvas
        context.font = `${this.options.fontSize || 16}px ${this.options.fontFamily || 'Arial'}`;
        context.fillStyle = this.options.color || '#000';
        context.textAlign = this.options.textAlign || 'left';
        context.textBaseline = this.options.textBaseline || 'top';
        let yOffset = 0;
        for (const line of lines) {
            context.fillText(line, 0, yOffset);
            yOffset += (this.options.fontSize || 16);
        }
        return canvas;
    }
    /**
     * Update the displayed text
     * @param text
     */
    setText(text) {
        if (this.text == text)
            return;
        this.text = text;
        this.updateTextImage();
    }
}

const warned = new Set();
const warn = (text) => {
    if (warned.has(text))
        return;
    warned.add(text);
    console.warn(text);
};

/**
 * Represents a tileset that manages tile textures and their properties.
 */
class TileSet {
    /**
     * Creates a new TileSet instance.
     * @param width - The width of each tile in pixels
     * @param height - The height of each tile in pixels
     */
    constructor(width, height) {
        /** Map storing tile textures and their associated options */
        this.textures = new Map;
        this.width = width;
        this.height = height;
    }
    /**
     * Registers a new tile with the given ID and options.
     * @param id - The unique identifier for the tile
     * @param options - The tile options or texture to register
     */
    setTile(id, options) {
        if (options instanceof Texture) {
            options = {
                texture: options,
            };
        }
        this.textures.set(id, options);
    }
    /**
     * Retrieves the registered tile options for the given ID.
     * @param id - The unique identifier of the tile to retrieve
     * @returns The registered tile options, or undefined if not found
     */
    getTile(id) {
        return this.textures.get(id);
    }
}
/**
 * Represents a tilemap renderer that handles rendering of tile-based maps.
 */
class TileMapRender {
    /**
     * Creates a new TileMapRender instance.
     * @param rapid - The Rapid rendering instance to use.
     */
    constructor(rapid) {
        this.rapid = rapid;
    }
    /**
     * Gets the y-sorted rows for rendering entities at specific y positions.
     * @param ySortRow - Array of y-sort callbacks to process.
     * @param height - Height of each tile.
     * @param renderRow - Number of rows to render.
     * @returns Array of y-sort callbacks grouped by row.
     * @private
     */
    getYSortRow(ySortRow, height, renderRow) {
        if (!ySortRow) {
            return [];
        }
        const rows = [];
        for (const ySort of ySortRow) {
            const y = Math.floor(ySort.ySort / height);
            if (!rows[y])
                rows[y] = [];
            rows[y].push(ySort);
        }
        return rows;
    }
    /**
     * Calculates the error offset values for tile rendering.
     * @param options - Layer rendering options containing error values.
     * @returns Object containing x and y error offsets.
     * @private
     */
    getOffset(options) {
        var _a, _b, _c;
        let errorX = ((_a = options.errorX) !== null && _a !== void 0 ? _a : 2) + 1;
        let errorY = ((_b = options.errorY) !== null && _b !== void 0 ? _b : 2) + 1;
        if (typeof options.error === 'number') {
            const error = ((_c = options.error) !== null && _c !== void 0 ? _c : 2) + 1;
            errorX = error;
            errorY = error;
        }
        else if (options.error) {
            errorX = options.error.x + 1;
            errorY = options.error.y + 1;
        }
        return { errorX, errorY };
    }
    /**
     * Calculates tile rendering data based on the viewport and tileset.
     * @param tileSet - The tileset to use for rendering.
     * @param options - Layer rendering options.
     * @returns Object containing calculated tile rendering data.
     * @private
     */
    getTileData(tileSet, options) {
        var _a;
        const shape = (_a = options.shape) !== null && _a !== void 0 ? _a : TilemapShape.SQUARE;
        const width = tileSet.width;
        const height = shape === TilemapShape.ISOMETRIC ? tileSet.height / 2 : tileSet.height;
        const matrix = this.rapid.matrixStack;
        const view = matrix.globalToLocal(Vec2.ZERO);
        const globalScale = matrix.getGlobalScale();
        const { errorX, errorY } = this.getOffset(options);
        const viewportWidth = Math.ceil(this.rapid.width / width / globalScale.x) + errorX * 2;
        const viewportHeight = Math.ceil(this.rapid.height / height / globalScale.y) + errorY * 2;
        // Calculate starting tile position
        const startTile = new Vec2(view.x < 0 ? Math.ceil(view.x / width) : Math.floor(view.x / width), view.y < 0 ? Math.ceil(view.y / height) : Math.floor(view.y / height));
        startTile.x -= errorX;
        startTile.y -= errorY;
        // Calculate precise pixel offset
        let offset = new Vec2(0 - (view.x % width) - errorX * width, 0 - (view.y % height) - errorY * height);
        offset = offset.add(view);
        return {
            startTile,
            offset,
            viewportWidth,
            viewportHeight,
            height,
            width,
            shape,
        };
    }
    /**
     * Renders a row of y-sorted entities.
     * @param rapid - The Rapid rendering instance.
     * @param ySortRow - Array of y-sort callbacks to render.
     * @private
     */
    renderYSortRow(rapid, ySortRow) {
        for (const ySort of ySortRow) {
            if (ySort.render) {
                ySort.render();
            }
            else if (ySort.renderSprite) {
                rapid.renderSprite(ySort.renderSprite);
            }
        }
    }
    /**
     * Renders the tilemap layer based on the provided data and options.
     *
     * @param data - A 2D array representing the tilemap data.
     * @param options - The rendering options for the tilemap layer.
     * @returns
     */
    renderLayer(data, options) {
        var _a, _b;
        this.rapid.matrixStack.applyTransform(options);
        const tileSet = options.tileSet;
        const { startTile, offset, viewportWidth, viewportHeight, shape, width, height } = this.getTileData(tileSet, options);
        const ySortRow = this.getYSortRow(options.ySortCallback, height, viewportHeight);
        const enableYSort = options.ySortCallback && options.ySortCallback.length > 0;
        if (this.rapid.matrixStack.getGlobalRotation() !== 0) {
            warn("TileMapRender: tilemap is not supported rotation");
            this.rapid.matrixStack.setGlobalRotation(0);
        }
        for (let y = 0; y < viewportHeight; y++) {
            const mapY = y + startTile.y;
            const currentRow = (_a = ySortRow[mapY]) !== null && _a !== void 0 ? _a : [];
            if (mapY < 0 || mapY >= data.length) {
                this.renderYSortRow(this.rapid, currentRow);
                continue;
            }
            for (let x = 0; x < viewportWidth; x++) {
                const mapX = x + startTile.x;
                if (mapX < 0 || mapX >= data[mapY].length)
                    continue;
                const tileId = data[mapY][mapX];
                const tile = tileSet.getTile(tileId);
                if (!tile)
                    continue;
                let screenX = x * width + offset.x;
                let screenY = y * height + offset.y;
                let ySort = y * height + offset.y + ((_b = tile.ySortOffset) !== null && _b !== void 0 ? _b : 0);
                if (mapY % 2 !== 0 && shape === TilemapShape.ISOMETRIC) {
                    screenX += width / 2;
                }
                const edata = options.eachTile ? (options.eachTile(tileId, mapX, mapY) || {}) : {};
                currentRow.push({
                    ySort,
                    renderSprite: {
                        ...tile,
                        // 保证 SprtieOption 被覆盖后仍然有效果
                        x: screenX + (tile.x || 0),
                        y: screenY + (tile.y || 0),
                        ...edata,
                    }
                });
            }
            if (enableYSort) {
                currentRow.sort((a, b) => a.ySort - b.ySort);
            }
            this.renderYSortRow(this.rapid, currentRow);
        }
        this.rapid.matrixStack.applyTransform(options);
    }
    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates.
     * @param options - The rendering options.
     * @returns The map coordinates.
     */
    localToMap(local, options) {
        const tileSet = options.tileSet;
        if (options.shape === TilemapShape.ISOMETRIC) {
            let outputX = 0, outputY = 0;
            // Half the height and width of a tile
            const H = tileSet.height / 2;
            const W = tileSet.width / 2;
            // Calculate mapY and check if it's even
            let mapY = Math.floor(local.y / H);
            const isYEven = mapY % 2 === 0;
            // Calculate mapX and check if it's even
            let mapX = Math.floor(local.x / W);
            const isXEven = mapX % 2 === 0;
            // Calculate the ratio of local x and y within the tile
            const xRatio = (local.x % W) / W;
            const yRatio = (local.y % H) / H;
            // Determine the position within the diamond shape
            const up2down = yRatio < xRatio;
            const down2up = yRatio < (1 - xRatio);
            if (!isYEven)
                mapY -= 1; // If not an offset row, decrease y by 1 if in the lower half of the tile
            if (up2down && (!isXEven && isYEven)) { // 3 Offset row
                mapY -= 1;
            }
            else if (!up2down && (isXEven && !isYEven)) { // 2 Offset row
                mapY += 1;
                mapX -= 2;
            }
            else if (down2up && (isXEven && isYEven)) { // 4 Offset row
                mapX -= 2;
                mapY -= 1;
            }
            else if (!down2up && (!isXEven && !isYEven)) { // 1 Offset row
                mapY += 1;
            }
            //        /\       
            //       /  \      
            //  1   /    \    2   
            //     /      \    
            //    /        \   
            //   /          \
            //   \          / 
            //    \        /   
            //     \      /    
            //   3  \    /    4 
            //       \  /      
            //        \/      
            outputX = mapX;
            outputY = mapY;
            outputX = Math.floor(mapX / 2);
            return new Vec2(outputX, outputY);
        }
        else {
            return new Vec2(Math.floor(local.x / tileSet.width), Math.floor(local.y / tileSet.height));
        }
    }
    /**
     * Converts map coordinates to local coordinates.
     * @param map - The map coordinates.
     * @param options - The rendering options.
     * @returns The local coordinates.
     */
    mapToLocal(map, options) {
        const tileSet = options.tileSet;
        if (options.shape === TilemapShape.ISOMETRIC) {
            let pos = new Vec2(map.x * tileSet.width, map.y * tileSet.height / 2);
            if (map.y % 2 !== 0) {
                pos.x += tileSet.width / 2;
            }
            return pos;
        }
        else {
            return new Vec2(map.x * tileSet.width, map.y * tileSet.height);
        }
    }
}

/**
 * The `Rapid` class provides a WebGL-based rendering engine.
 */
class Rapid {
    /**
     * Constructs a new `Rapid` instance with the given options.
     * @param options - Options for initializing the `Rapid` instance.
     */
    constructor(options) {
        var _a;
        this.projectionDirty = true;
        this.matrixStack = new MatrixStack();
        this.tileMap = new TileMapRender(this);
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.defaultColor = new Color(255, 255, 255, 255);
        this.regions = new Map;
        this.currentMaskType = MaskType.Include;
        const gl = getContext(options.canvas);
        this.gl = gl;
        this.canvas = options.canvas;
        this.textures = new TextureCache(this, (_a = options.antialias) !== null && _a !== void 0 ? _a : false);
        this.maxTextureUnits = gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.width = options.width || this.canvas.width;
        this.height = options.width || this.canvas.height;
        this.backgroundColor = options.backgroundColor || new Color(255, 255, 255, 255);
        this.registerBuildInRegion();
        this.initWebgl(gl, options);
    }
    /**
     * Render a tile map layer.
     * @param data - The map data to render.
     * @param options - The options for rendering the tile map layer.
     */
    renderTileMapLayer(data, options) {
        this.tileMap.renderLayer(data, options instanceof TileSet ? { tileSet: options } : options);
    }
    /**
     * Initializes WebGL context settings.
     * @param gl - The WebGL context.
     */
    initWebgl(gl, options) {
        this.resize(this.width, this.height);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.STENCIL_TEST);
        gl.enable(gl.SCISSOR_TEST);
    }
    /**
     * Registers built-in regions such as sprite and graphic regions.
     */
    registerBuildInRegion() {
        this.registerRegion("sprite", SpriteRegion);
        this.registerRegion("graphic", GraphicRegion);
    }
    /**
     * Registers a custom render region with a specified name.
     * @param name - The name of the region.
     * @param regionClass - The class of the region to register.
     */
    registerRegion(name, regionClass) {
        this.regions.set(name, new regionClass(this));
    }
    quitCurrentRegion() {
        if (this.currentRegion && this.currentRegion.hasPendingContent()) {
            this.currentRegion.render();
            this.currentRegion.exitRegion();
        }
    }
    /**
     * Sets the current render region by name and optionally a custom shader.
     * @param regionName - The name of the region to set as current.
     * @param customShader - An optional custom shader to use with the region.
     * @param hasUnifrom - have costum unifrom
     */
    setRegion(regionName, customShader) {
        if (
        // isRegionChanged
        regionName != this.currentRegionName ||
            // isShaderChanged
            (this.currentRegion && this.currentRegion.isShaderChanged(customShader))) {
            const region = this.regions.get(regionName);
            this.quitCurrentRegion();
            this.currentRegion = region;
            this.currentRegionName = regionName;
            region.enterRegion(customShader);
        }
    }
    /**
     * Saves the current matrix state to the stack.
     */
    save() {
        this.matrixStack.pushMat();
    }
    /**
     * Restores the matrix state from the stack.
     */
    restore() {
        this.matrixStack.popMat();
    }
    /**
     * Executes a callback function within a saved and restored matrix state scope.
     * @param cb - The callback function to execute within the saved and restored matrix state scope.
     */
    withTransform(cb) {
        this.save();
        cb();
        this.restore();
    }
    /**
     * Starts the rendering process, resetting the matrix stack and clearing the current region.
     * @param clear - Whether to clear the matrix stack. Defaults to true.
     */
    startRender(clear = true) {
        this.clear();
        clear && this.matrixStack.clear();
        this.matrixStack.pushIdentity();
        this.currentRegion = undefined;
        this.currentRegionName = undefined;
    }
    /**
     * Ends the rendering process by rendering the current region.
     */
    endRender() {
        var _a;
        (_a = this.currentRegion) === null || _a === void 0 ? void 0 : _a.render();
        this.projectionDirty = false;
    }
    /**
     * Render
     * @param cb - The function to render.
     */
    render(cb) {
        this.startRender();
        cb();
        this.endRender();
    }
    /**
     * Renders a sprite with the specified options.
     *
     * @param options - The rendering options for the sprite, including texture, position, color, and shader.
     */
    renderSprite(options) {
        const texture = options.texture;
        if (!texture || !texture.base)
            return;
        const { offsetX, offsetY } = this.startDraw(options, texture.width, texture.height);
        this.setRegion("sprite", options.shader);
        this.currentRegion.renderSprite(texture.base.texture, texture.width, texture.height, texture.clipX, texture.clipY, texture.clipW, texture.clipH, offsetX, offsetY, (options.color || this.defaultColor).uint32, options.uniforms);
        this.afterDraw();
    }
    /**
     * Renders a texture directly without additional options.
     * This is a convenience method that calls renderSprite with just the texture.
     *
     * @param texture - The texture to render at the current transformation position.
     */
    renderTexture(texture) {
        if (!texture.base)
            return;
        this.renderSprite({ texture });
    }
    /**
     * Renders a line with the specified options.
     *
     * @param options - The options for rendering the line, including points, color, width, and join/cap types.
     */
    renderLine(options) {
        const linePoints = options.closed ? [...options.points, options.points[0]] : options.points;
        const points = getLineGeometry({ ...options, points: linePoints });
        this.renderGraphic({ ...options, drawType: this.gl.TRIANGLES, points });
    }
    /**
     * Renders graphics based on the provided options.
     *
     * @param options - The options for rendering the graphic, including points, color, texture, and draw type.
     */
    renderGraphic(options) {
        this.startGraphicDraw(options);
        options.points.forEach((vec, index) => {
            var _a;
            const color = Array.isArray(options.color) ? options.color[index] : options.color;
            const uv = (_a = options.uv) === null || _a === void 0 ? void 0 : _a[index];
            this.addGraphicVertex(vec.x, vec.y, uv, color);
        });
        this.endGraphicDraw();
    }
    /**
     * Starts the graphic drawing process.
     *
     * @param options - The options for the graphic drawing, including shader, texture, and draw type.
     */
    startGraphicDraw(options) {
        const { offsetX, offsetY } = this.startDraw(options);
        this.setRegion("graphic", options.shader);
        const currentRegion = this.currentRegion;
        currentRegion.startRender(offsetX, offsetY, options.texture, options.uniforms);
        if (options.drawType) {
            currentRegion.drawType = options.drawType;
        }
    }
    /**
     * Adds a vertex to the current graphic being drawn.
     *
     * @param offsetX - The X coordinate of the vertex.
     * @param offsetY - The Y coordinate of the vertex.
     * @param uv - The texture UV coordinates for the vertex.
     * @param color - The color of the vertex. Defaults to the renderer's default color.
     */
    addGraphicVertex(offsetX, offsetY, uv, color) {
        const currentRegion = this.currentRegion;
        currentRegion.addVertex(offsetX, offsetY, uv === null || uv === void 0 ? void 0 : uv.x, uv === null || uv === void 0 ? void 0 : uv.y, (color || this.defaultColor).uint32);
    }
    /**
     * Completes the graphic drawing process and renders the result.
     */
    endGraphicDraw() {
        const currentRegion = this.currentRegion;
        currentRegion.render();
        this.afterDraw();
    }
    startDraw(options, width = 0, height = 0) {
        this.currentTransformOptions = options;
        return this.matrixStack.applyTransform(options, width, height);
    }
    afterDraw() {
        if (this.currentTransformOptions) {
            this.matrixStack.applyTransformAfter(this.currentTransformOptions);
        }
    }
    /**
     * Renders a rectangle with the specified options.
     *
     * @param options - The options for rendering the rectangle, including width, height, position, and color.
     */
    renderRect(options) {
        const { width, height } = options;
        const points = [
            new Vec2(0, 0),
            new Vec2(width, 0),
            new Vec2(width, height),
            new Vec2(0, height)
        ];
        this.renderGraphic({ ...options, points, drawType: this.gl.TRIANGLE_FAN });
    }
    /**
     * Renders a circle with the specified options.
     *
     * @param options - The options for rendering the circle, including radius, position, color, and segment count.
     */
    renderCircle(options) {
        const segments = options.segments || 32;
        const radius = options.radius;
        const color = options.color || this.defaultColor;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new Vec2(x, y));
        }
        this.renderGraphic({ ...options, points, color, drawType: this.gl.TRIANGLE_FAN });
    }
    /**
     * Resizes the canvas and updates the viewport and projection matrix.
     * @param width - The new width of the canvas.
     * @param height - The new height of the canvas.
     */
    resize(logicalWidth, logicalHeight) {
        this.width = logicalWidth;
        this.height = logicalHeight;
        const physicalWidth = logicalWidth * this.devicePixelRatio;
        const physicalHeight = logicalHeight * this.devicePixelRatio;
        this.canvas.width = physicalWidth;
        this.canvas.height = physicalHeight;
        this.canvas.style.width = logicalWidth + 'px';
        this.canvas.style.height = logicalHeight + 'px';
        this.gl.viewport(0, 0, physicalWidth, physicalHeight);
        this.projection = this.createOrthMatrix(0, logicalWidth, logicalHeight, 0);
        this.projectionDirty = true;
        this.gl.scissor(0, 0, physicalWidth, physicalHeight);
    }
    /**
     * Clears the canvas with the background color.
     */
    clear() {
        const gl = this.gl;
        const c = this.backgroundColor;
        gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.clearMask();
    }
    /**
     * Creates an orthogonal projection matrix.
     * @param left - The left bound of the projection.
     * @param right - The right bound of the projection.
     * @param bottom - The bottom bound of the projection.
     * @param top - The top bound of the projection.
     * @returns The orthogonal projection matrix as a `Float32Array`.
     */
    createOrthMatrix(left, right, bottom, top) {
        return new Float32Array([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -1, 0,
            -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
        ]);
    }
    /**
     * Draw a mask. Automatically calls startDrawMask.
     * @param type - The type of mask to draw.
     * @param cb - The callback function to execute.
     */
    drawMask(type = MaskType.Include, cb) {
        this.startDrawMask(type);
        cb();
        this.endDrawMask();
    }
    /**
     * Start drawing a mask using the stencil buffer.
     * This method configures the WebGL context to begin defining a mask area.
     */
    startDrawMask(type = MaskType.Include) {
        const gl = this.gl;
        this.currentMaskType = type;
        this.setMaskType(type, true);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.colorMask(false, false, false, false);
    }
    /**
     * End the mask drawing process.
     * This method configures the WebGL context to use the defined mask for subsequent rendering.
     */
    endDrawMask() {
        const gl = this.gl;
        this.quitCurrentRegion();
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        gl.colorMask(true, true, true, true);
        this.setMaskType(this.currentMaskType, false);
    }
    /**
     * Set the mask type for rendering
     * @param type - The mask type to apply
     * @param start - Whether this is the start of mask drawing
     */
    setMaskType(type, start = false) {
        const gl = this.gl;
        this.quitCurrentRegion();
        if (start) {
            this.clearMask();
            gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        }
        else {
            switch (type) {
                case MaskType.Include:
                    gl.stencilFunc(gl.EQUAL, 1, 0xFF);
                    break;
                case MaskType.Exclude:
                    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
                    break;
            }
        }
    }
    /**
     * Clear the current mask by clearing the stencil buffer.
     * This effectively removes any previously defined mask.
     */
    clearMask() {
        const gl = this.gl;
        this.quitCurrentRegion();
        gl.clearStencil(0);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    }
    /**
     * Creates a custom shader.
     * @param vs - Vertex shader code.
     * @param fs - Fragment shader code.
     * @param type - Shader type.
     * @param textureUnit - The number of textures used by the shader
     * @returns The created shader object.
     */
    createCostumShader(vs, fs, type, textureUnit = 0) {
        return GLShader.createCostumShader(this, vs, fs, type, textureUnit);
    }
}

class Uniform {
    constructor(data) {
        this.isDirty = false;
        this.data = data;
    }
    setUniform(key, data) {
        if (this.data[key] != data) {
            this.isDirty = true;
        }
        this.data[key] = data;
    }
    /**
     * @ignore
     */
    clearDirty() {
        this.isDirty = false;
    }
    getUnifromNames() {
        return Object.keys(this.data);
    }
    bind(gl, uniformName, loc, usedTextureUnit) {
        var _a;
        const value = this.data[uniformName];
        if (typeof value === 'number') {
            gl.uniform1f(loc, value);
        }
        else if (Array.isArray(value)) {
            switch (value.length) {
                case 1:
                    if (Number.isInteger(value[0])) {
                        gl.uniform1i(loc, value[0]);
                    }
                    else {
                        gl.uniform1f(loc, value[0]);
                    }
                    break;
                case 2:
                    if (Number.isInteger(value[0])) {
                        gl.uniform2iv(loc, value);
                    }
                    else {
                        gl.uniform2fv(loc, value);
                    }
                    break;
                case 3:
                    if (Number.isInteger(value[0])) {
                        gl.uniform3iv(loc, value);
                    }
                    else {
                        gl.uniform3fv(loc, value);
                    }
                    break;
                case 4:
                    if (Number.isInteger(value[0])) {
                        gl.uniform4iv(loc, value);
                    }
                    else {
                        gl.uniform4fv(loc, value);
                    }
                    break;
                case 9:
                    gl.uniformMatrix3fv(loc, false, value);
                    break;
                case 16:
                    gl.uniformMatrix4fv(loc, false, value);
                    break;
                default:
                    console.error(`Unsupported uniform array length for ${uniformName}:`, value.length);
                    break;
            }
        }
        else if (typeof value === 'boolean') {
            gl.uniform1i(loc, value ? 1 : 0);
        }
        else if ((_a = value.base) === null || _a === void 0 ? void 0 : _a.texture) {
            gl.activeTexture(gl.TEXTURE0 + usedTextureUnit);
            gl.bindTexture(gl.TEXTURE_2D, value.base.texture);
            gl.uniform1i(loc, usedTextureUnit);
            usedTextureUnit += 1;
        }
        else {
            console.error(`Unsupported uniform type for ${uniformName}:`, typeof value);
        }
        return usedTextureUnit;
    }
}

export { ArrayType, BaseTexture, Color, DynamicArrayBuffer, GLShader, MaskType, MathUtils, MatrixStack, Rapid, SCALEFACTOR, ShaderType, Text, Texture, TextureCache, TileMapRender, TileSet, TilemapShape, Uniform, Vec2, WebglBufferArray, WebglElementBufferArray, graphicAttributes, spriteAttributes };
