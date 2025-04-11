import { IMathStruct as IMathObject, ITransform, WebGLContext } from "./interface";

const MATRIX_SIZE = 6

/**
 * @ignore
 */
export enum ArrayType {
    Float32,
    Uint32,
    Uint16
}

/**
 * @ignore
 */
export class DynamicArrayBuffer {
    usedElemNum: number
    protected typedArray!: Float32Array | Uint32Array | Uint16Array
    private arrayType: ArrayType
    protected maxElemNum: number
    readonly bytePerElem: number
    private arraybuffer: ArrayBuffer

    private uint32?: Uint32Array
    private float32?: Float32Array
    private uint16?: Uint16Array

    constructor(arrayType: ArrayType) {
        this.usedElemNum = 0;
        this.maxElemNum = 512;
        this.bytePerElem = this.getArrayType(arrayType).BYTES_PER_ELEMENT
        this.arrayType = arrayType
        this.arraybuffer = new ArrayBuffer(this.maxElemNum * this.bytePerElem)

        this.updateTypedArray()
    }
    getArrayType(arrayType: ArrayType) {
        switch (arrayType) {
            case ArrayType.Float32:
                return Float32Array
            case ArrayType.Uint32:
                return Uint32Array
            case ArrayType.Uint16:
                return Uint16Array
        }
    }
    updateTypedArray() {
        this.uint32 = new Uint32Array(this.arraybuffer)
        this.float32 = new Float32Array(this.arraybuffer)
        this.uint16 = new Uint16Array(this.arraybuffer)

        switch (this.arrayType) {
            case ArrayType.Float32:
                this.typedArray = this.float32!
                break
            case ArrayType.Uint32:
                this.typedArray = this.uint32!
                break
            case ArrayType.Uint16:
                this.typedArray = this.uint16!
                break
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
    resize(size: number = 0) {
        size += this.usedElemNum
        if (size > this.maxElemNum) {
            while (size > this.maxElemNum) {
                this.maxElemNum <<= 1;
            }
            this.setMaxSize(this.maxElemNum)
        }
    }
    protected setMaxSize(size: number = this.maxElemNum) {
        const data = this.typedArray;
        this.maxElemNum = size
        this.arraybuffer = new ArrayBuffer(size * this.bytePerElem)

        this.updateTypedArray()
        this.typedArray.set(data);
    }

    pushUint32(value: number) {
        this.uint32![this.usedElemNum++] = value
    }
    pushFloat32(value: number) {
        this.float32![this.usedElemNum++] = value
    }
    pushUint16(value: number) {
        this.uint16![this.usedElemNum++] = value
    }
    /**
     * pop a element
     * @param num 
     */
    pop(num: number) {
        this.usedElemNum -= num
    }
    /**
     * get the array
     * @param begin 
     * @param end 
     * @returns 
     */
    getArray(begin: number = 0, end?: number) {
        if (end == undefined) {
            return this.typedArray
        }
        return this.typedArray.subarray(begin, end);
    }
    /**
     * length of the array
     */
    public get length(): number {
        return this.typedArray.length
    }
}

/**
 * @ignore
 */
export class WebglBufferArray extends DynamicArrayBuffer {
    buffer: WebGLBuffer
    gl: WebGLContext
    protected dirty: boolean = true
    readonly type: number
    /**
     * webglbuffer 中的大小
     */
    private webglBufferSize: number = 0

    constructor(gl: WebGLContext, arrayType: ArrayType, type: number = gl.ARRAY_BUFFER) {
        super(arrayType)
        this.gl = gl
        this.buffer = gl.createBuffer()!;
        this.type = type
    }
    override pushFloat32(value: number): void {
        super.pushFloat32(value)
        this.dirty = true
    }
    override pushUint32(value: number): void {
        super.pushUint32(value)
        this.dirty = true
    }
    override pushUint16(value: number): void {
        super.pushUint16(value)
        this.dirty = true
    }
    /**
     * bind buffer to gpu
     */
    bindBuffer() {
        this.gl.bindBuffer(this.type, this.buffer)
    }
    /**
     * array data to gpu
     */
    bufferData() {
        if (this.dirty) {
            const gl = this.gl
            if (this.maxElemNum > this.webglBufferSize) {
                gl.bufferData(this.type, this.getArray(), gl.STATIC_DRAW)
                this.webglBufferSize = this.maxElemNum
            } else {
                gl.bufferSubData(this.type, 0, this.getArray(0, this.usedElemNum))
            }
            this.dirty = false
        }
    }
}

export class MatrixStack extends DynamicArrayBuffer {
    constructor() {
        super(ArrayType.Float32)
    }
    /**
     * push a matrix to the stack
     */
    pushMat() {
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        this.resize(6)
        this.pushFloat32(arr[offset + 0])
        this.pushFloat32(arr[offset + 1])
        this.pushFloat32(arr[offset + 2])
        this.pushFloat32(arr[offset + 3])
        this.pushFloat32(arr[offset + 4])
        this.pushFloat32(arr[offset + 5])
    }
    /**
     * pop a matrix from the stack
     */
    popMat() {
        this.pop(MATRIX_SIZE)
    }
    /**
     * push a matrix and indentiy it
     */
    pushIdentity() {
        this.resize(6)
        this.pushFloat32(1)
        this.pushFloat32(0)
        this.pushFloat32(0)
        this.pushFloat32(1)
        this.pushFloat32(0)
        this.pushFloat32(0)
    }
    /**
     * Translates the current matrix by the specified x and y values.
     * @param x - The amount to translate horizontally.
     * @param y - The amount to translate vertically.
     */
    translate(x: number | Vec2, y?: number): void {
        if (typeof x !== "number") {
            return this.translate(x.x, x.y)
        }
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        arr[offset + 4] = arr[offset + 0] * x + arr[offset + 2] * y! + arr[offset + 4];
        arr[offset + 5] = arr[offset + 1] * x + arr[offset + 3] * y! + arr[offset + 5];
    }
    /**
     * Rotates the current matrix by the specified angle.
     * @param angle - The angle, in radians, to rotate the matrix by.
     */
    rotate(angle: number) {
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
    scale(x: number | Vec2, y?: number): void {
        if (typeof x !== "number") {
            return this.scale(x.x, x.y)
        }
        if (!y) y = x
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        arr[offset + 0] = arr[offset + 0] * x;
        arr[offset + 1] = arr[offset + 1] * x;
        arr[offset + 2] = arr[offset + 2] * y;
        arr[offset + 3] = arr[offset + 3] * y;
    }
    /**
     * Transforms a point by applying the current matrix stack.
     * @returns The transformed point as an array `[newX, newY]`.
     */
    apply(x: number | Vec2, y?: number): Vec2 | number[] {
        if (typeof x !== "number") {
            return new Vec2(...this.apply(x.x, x.y) as number[])
        }
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        return [
            arr[offset + 0] * x + arr[offset + 2] * y! + arr[offset + 4],
            arr[offset + 1] * x + arr[offset + 3] * y! + arr[offset + 5]
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
    setTransform(array: Float32Array | number[]) {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 0] = array[0]
        arr[offset + 1] = array[1]
        arr[offset + 2] = array[2]
        arr[offset + 3] = array[3]
        arr[offset + 4] = array[4]
        arr[offset + 5] = array[5]
    }

    /**
     * Get the global position in world space
     * @returns The current matrix position in world space
     */
    getGlobalPosition(): Vec2 {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return new Vec2(arr[offset + 4], arr[offset + 5]);
    }

    /**
     * Set the global position in world space
     * @param x - x coordinate or Vec2 object
     * @param y - y coordinate (ignored if first parameter is Vec2)
     */
    setGlobalPosition(x: number | Vec2, y?: number): void {
        if (typeof x !== "number") {
            this.setGlobalPosition(x.x, x.y);
            return;
        }
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        arr[offset + 4] = x;
        arr[offset + 5] = y!;
    }

    /**
     * Get the global rotation angle
     * @returns The current matrix rotation angle in radians
     */
    getGlobalRotation(): number {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return Math.atan2(arr[offset + 1], arr[offset + 0]);
    }

    /**
     * Set the global rotation angle
     * @param angle - rotation angle in radians
     */
    setGlobalRotation(angle: number): void {
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
    getGlobalScale(): Vec2 {
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
    setGlobalScale(x: number | Vec2, y?: number): void {
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
        arr[offset + 2] = -sin * y!;
        arr[offset + 3] = cos * y!;
    }

    globalToLocal(global: Vec2): Vec2 {
        const inv = this.getInverse();
        return new Vec2(
            inv[0] * global.x + inv[2] * global.y + inv[4],
            inv[1] * global.x + inv[3] * global.y + inv[5]
        );
    }

    localToGlobal(local: Vec2): Vec2 {
        return this.apply(local) as Vec2;
    }

    /**
     * Convert the current matrix to a CSS transform string
     * @returns CSS transform string representation of the matrix
     */
    toCSSTransform(): string {
        const offset = this.usedElemNum - MATRIX_SIZE;
        const arr = this.typedArray;
        return `matrix(${arr[offset + 0]}, ${arr[offset + 1]}, ${arr[offset + 2]}, ${arr[offset + 3]}, ${arr[offset + 4]}, ${arr[offset + 5]})`;
    }

    /**
     * Reset the current matrix to identity matrix
     */
    identity(): void {
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
    applyTransform(transform: ITransform, width: number = 0, height: number = 0) {
        if (transform.saveTransform ?? true) {
            this.pushMat()
        }
        transform.afterSave && transform.afterSave()

        const x = transform.x || 0
        const y = transform.y || 0
        if (x || y) {
            this.translate(x, y)
        }

        transform.position && this.translate(transform.position)
        transform.rotation && this.rotate(transform.rotation)
        transform.scale && this.scale(transform.scale)

        let offsetX = transform.offsetX || 0
        let offsetY = transform.offsetY|| 0

        if (transform.offset) {
            offsetX += transform.offset.x
            offsetY += transform.offset.y
        }

        const origin = transform.origin
        if (origin) {
            if (typeof origin == "number") {
                offsetX -= origin * width
                offsetY -= origin * height
            } else {
                offsetX -= origin.x * width
                offsetY -= origin.y * height
            }
        }

        return {
            offsetX,
            offsetY
        }
    }
    applyTransformAfter(transform: ITransform) {
        if (transform.beforRestore) {
            transform.beforRestore()
        }
        if (transform.restoreTransform ?? true) {
            this.popMat()
        }
    }
}

/**
 * @ignore
 */
export class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl: WebGLContext, elemVertPerObj: number, vertexPerObject: number, maxBatch: number) {
        super(gl, ArrayType.Uint16, gl.ELEMENT_ARRAY_BUFFER)
        this.setMaxSize(elemVertPerObj * maxBatch)
        for (let index = 0; index < maxBatch; index++) {
            this.addObject(index * vertexPerObject)
        }
        this.bindBuffer()
        this.bufferData()
    }
    protected addObject(_vertex?: number) { }
}

/**
 * Represents a color with red, green, blue, and alpha (transparency) components.
 */
export class Color implements IMathObject<Color> {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;
    uint32!: number;

    /**
     * Creates an instance of Color.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    constructor(r: number, g: number, b: number, a: number = 255) {
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
    set r(value: number) {
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
    set g(value: number) {
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
    set b(value: number) {
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
    set a(value: number) {
        this._a = value;
        this.updateUint();
    }

    /**
     * Updates the uint32 representation of the color.
     * @private
     */
    private updateUint() {
        this.uint32 = ((this._a << 24) | (this._b << 16) | (this._g << 8) | this._r) >>> 0;
    }

    /**
     * Sets the RGBA values of the color and updates the uint32 representation.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    setRGBA(r: number, g: number, b: number, a: number) {
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
    copy(color: Color) {
        this.setRGBA(color.r, color.g, color.b, color.a);
    }

    /**
     * Clone the current color
     * @returns A new `Color` instance with the same RGBA values.
     */
    clone() {
        return new Color(this._r, this._g, this._b, this._a)
    }

    /**
     * Checks if the current color is equal to another color.
     * @param color - The color to compare with.
     * @returns True if the colors are equal, otherwise false.
     */
    equal(color: Color) {
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
    static fromHex(hexString: string): Color {
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
    add(color: Color) {
        return new Color(
            Math.min(this.r + color.r, 255),
            Math.min(this.g + color.g, 255),
            Math.min(this.b + color.b, 255),
            Math.min(this.a + color.a, 255)
        );
    }

    /**
     * Subtracts the components of another color from this color, clamping the result to 0.
     * @param color - The color to subtract.
     * @returns A new Color instance with the result of the subtraction.
     */
    subtract(color: Color) {
        return new Color(
            Math.max(this.r - color.r, 0),
            Math.max(this.g - color.g, 0),
            Math.max(this.b - color.b, 0),
            Math.max(this.a - color.a, 0)
        );
    }

    static Red = new Color(255, 0, 0, 255)
    static Green = new Color(0, 255, 0, 255)
    static Blue = new Color(0, 0, 255, 255)
    static Yellow = new Color(255, 255, 0, 255)
    static Purple = new Color(128, 0, 128, 255)
    static Orange = new Color(255, 165, 0, 255)
    static Pink = new Color(255, 192, 203, 255)
    static Gray = new Color(128, 128, 128, 255)
    static Brown = new Color(139, 69, 19, 255)
    static Cyan = new Color(0, 255, 255, 255)
    static Magenta = new Color(255, 0, 255, 255)
    static Lime = new Color(192, 255, 0, 255)
    static White = new Color(255, 255, 255, 255)
    static Black = new Color(0, 0, 0, 255)
    static TRANSPARENT = new Color(0, 0, 0, 0)
}

/**
 * Represents a 2D vector with x and y components.
 */
export class Vec2 implements IMathObject<Vec2> {
    x: number;
    y: number;

    static ZERO = new Vec2(0, 0);
    static ONE = new Vec2(1, 1);
    static UP = new Vec2(0, 1);
    static DOWN = new Vec2(0, -1);
    static LEFT = new Vec2(-1, 0);
    static RIGHT = new Vec2(1, 0);

    /**
     * Creates an instance of Vec2.
     * @param x - The x coordinate (default is 0).
     * @param y - The y coordinate (default is 0).
     */
    constructor(x?: number, y?: number) {
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }

    /**
     * Adds another vector to this vector.
     * @param v - The vector to add.
     * @returns A new Vec2 instance with the result of the addition.
     */
    add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    /**
     * Subtracts another vector from this vector.
     * @param v - The vector to subtract.
     * @returns A new Vec2 instance with the result of the subtraction.
     */
    subtract(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    /**
     * Multiplies the vector by a scalar or another vector.
     * @param f - The scalar value or vector to multiply by.
     * @returns A new Vec2 instance with the result of the multiplication.
     */
    multiply(f: number | Vec2): Vec2 {
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
    divide(f: number | Vec2): Vec2 {
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
    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Calculates the cross product of this vector with another vector.
     * @param v - The other vector.
     * @returns The cross product result.
     */
    cross(v: Vec2): number {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Calculates the distance to another point.
     * @param v - The other point.
     * @returns The distance between the two points.
     */
    distanceTo(v: Vec2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Clones the vector.
     * @returns A new Vec2 instance with the same x and y values.
     */
    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }
    /**
     * Copy the vector
     * @param vec - The vector to copy.
     */
    copy(vec: Vec2) {
        this.x = vec.x
        this.y = vec.y
    }
    /**
     * Check if the vector is equal to another vector.
     * @param vec - The vector to compare with.
     * @returns True if the vectors are equal, otherwise false.
     */
    equal(vec: Vec2) {
        return vec.x == this.x && vec.y == this.y
    }
    /**
     * Rotates the vector 90 degrees counterclockwise.
     * @returns The current instance with updated values.
     */
    perpendicular(): this {
        const x = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }

    /**
     * Inverts the direction of the vector.
     * @returns The current instance with updated values.
     */
    invert(): this {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    /**
     * Calculates the length of the vector.
     * @returns The length of the vector.
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalizes the vector to have a length of 1.
     * @returns The current instance with updated values.
     */
    normalize(): this {
        const mod = this.length();
        this.x = this.x / mod || 0;
        this.y = this.y / mod || 0;
        return this;
    }

    /**
     * Calculates the angle of the vector relative to the x-axis.
     * @returns The angle of the vector.
     */
    angle(): number {
        return Math.atan2(this.y, this.x);
    }
    /**
     * Calculates the middle point between the current vector and another vector.
     * @param other - The other vector.
     * @returns A new vector representing the middle point between the current vector and the other vector.
     */
    middle(other: Vec2): Vec2 {
        return new Vec2((this.x + other.x) / 2, (this.y + other.y) / 2);
    }

    /**
     * Returns a new vector with the absolute values of the components.
     * @returns A new vector with absolute values.
     */
    abs(): Vec2 {
        return new Vec2(Math.abs(this.x), Math.abs(this.y));
    }

    /**
     * Returns a new vector with floored components.
     * @returns A new vector with components rounded down to the nearest integer.
     */
    floor(): Vec2 {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Returns a new vector with ceiled components.
     * @returns A new vector with components rounded up to the nearest integer.
     */
    ceil(): Vec2 {
        return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
    }

    /**
     * Snaps the vector components to the nearest increment.
     * @param increment - The increment to snap to.
     * @returns A new vector with components snapped to the nearest increment.
     */
    snap(increment: number): Vec2 {
        return new Vec2(
            Math.round(this.x / increment) * increment,
            Math.round(this.y / increment) * increment
        );
    }

    /**
     * Converts the vector to a string representation.
     * @returns A string containing the vector's x and y coordinates.
     */
    stringify(): string {
        return `Vec2(${this.x}, ${this.y})`;
    }

    /**
     * Converts an array of coordinate pairs into an array of Vec2 instances.
     * @param array - An array of [x, y] coordinate pairs.
     * @returns An array of Vec2 instances.
     */
    static FromArray(array: number[][]): Vec2[] {
        return array.map(pair => new Vec2(pair[0], pair[1]));
    }
}

/**
 * Provides utility methods for mathematical conversions.
 */
export class MathUtils {
    /**
     * Converts degrees to radians.
     * @param degrees - The angle in degrees.
     * @returns The equivalent angle in radians.
     */
    static deg2rad(degrees: number) {
        return degrees * (Math.PI / 180);
    }
    /**
     * Converts radians to degrees.
     * @param rad - The angle in radians.
     * @returns The equivalent angle in degrees.
     */
    static rad2deg(rad: number) {
        return rad / (Math.PI / 180);
    }


    /**
     * Normalizes an angle in degrees to be within the range of 0 to 360 degrees.
     * @param degrees - The angle in degrees to be normalized.
     * @returns The normalized angle in degrees.
     */
    static normalizeDegrees(degrees: number) {
        return ((degrees % 360) + 360) % 360;
    }
}