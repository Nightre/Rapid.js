import { WebGLContext } from "./interface";

const MATRIX_SIZE = 6
type ArrayType = typeof Float32Array | typeof Uint16Array

export class DynamicArrayBuffer {
    usedElemNum: number
    protected typedArray: Float32Array | Uint16Array
    private arrayType: ArrayType
    protected maxElemNum: number
    readonly bytePerElem: number
    private arraybuffer: ArrayBuffer
    /** if typedArray is Float32Array*/
    private uint32?: Uint32Array

    constructor(arrayType: ArrayType) {
        this.usedElemNum = 0;
        this.maxElemNum = 512;
        this.bytePerElem = arrayType.BYTES_PER_ELEMENT
        this.arrayType = arrayType
        this.arraybuffer = new ArrayBuffer(this.maxElemNum * this.bytePerElem)
        this.typedArray = new arrayType(this.arraybuffer)
        if (arrayType == Float32Array) {
            this.uint32 = new Uint32Array(this.arraybuffer)
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
    protected setMaxSize(size: number = this.maxElemNum){
        const data = this.typedArray;
        this.maxElemNum = size
        this.arraybuffer = new ArrayBuffer(size * this.bytePerElem)
        this.typedArray = new this.arrayType(this.arraybuffer)
        if (this.uint32) {
            this.uint32 = new Uint32Array(this.arraybuffer)
        }
        this.typedArray.set(data);
    }
    /**
     * push a new element
     * @param value 
     */
    push(value: number) {
        this.typedArray[this.usedElemNum++] = value
    }
    pushUint(value: number) {
        this.uint32![this.usedElemNum++] = value
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
    override push(value: number): void {
        super.push(value)
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
                gl.bufferData(this.type, this.getArray(), gl.STATIC_DRAW )
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
        super(Float32Array)
    }
    /**
     * push a matrix to the stack
     */
    pushMat() {
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        this.resize(6)
        this.push(arr[offset + 0])
        this.push(arr[offset + 1])
        this.push(arr[offset + 2])
        this.push(arr[offset + 3])
        this.push(arr[offset + 4])
        this.push(arr[offset + 5])
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
        this.push(1)
        this.push(0)
        this.push(0)
        this.push(1)
        this.push(0)
        this.push(0)
    }
    /**
     * Translates the current matrix by the specified x and y values.
     * @param x - The amount to translate horizontally.
     * @param y - The amount to translate vertically.
     */
    translate(x: number, y: number) {
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        arr[offset + 4] = arr[offset + 0] * x + arr[offset + 2] * y + arr[offset + 4];
        arr[offset + 5] = arr[offset + 1] * x + arr[offset + 3] * y + arr[offset + 5];
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
    scale(x: number, y = x) {
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
        arr[offset + 0] = arr[offset + 0] * x;
        arr[offset + 1] = arr[offset + 1] * x;
        arr[offset + 2] = arr[offset + 2] * y;
        arr[offset + 3] = arr[offset + 3] * y;
    }
    apply(x: number, y: number) {
        const offset = this.usedElemNum - MATRIX_SIZE
        const arr = this.typedArray
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
}

export class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl: WebGLContext, elemVertPerObj: number, vertexPerObject: number, maxBatch: number) {
        super(gl, Uint16Array, gl.ELEMENT_ARRAY_BUFFER)
        this.setMaxSize(elemVertPerObj * maxBatch)
        for (let index = 0; index < maxBatch; index++) {
            this.addObject(index * vertexPerObject)
        }
        this.bindBuffer()
        this.bufferData()
    }
    protected addObject(_vertex?: number) {}
}

export class Color {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;
    uint32!: number;

    constructor(r: number, g: number, b: number, a: number) {
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a;
        this.updateUint();
    }

    get r() {
        return this._r;
    }

    set r(value: number) {
        this._r = value;
        this.updateUint();
    }

    get g() {
        return this._g;
    }

    set g(value: number) {
        this._g = value;
        this.updateUint();
    }

    get b() {
        return this._b;
    }

    set b(value: number) {
        this._b = value;
        this.updateUint();
    }

    get a() {
        return this._a;
    }

    set a(value: number) {
        this._a = value;
        this.updateUint();
    }

    private updateUint() {
        this.uint32 = ((this._a << 24) | (this._b << 16) | (this._g << 8) | this._r) >>> 0;
    }
    setRGBA(r: number, g: number, b: number, a: number) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
        this.updateUint()
    }
    copy(color: Color) {
        this.setRGBA(color.r, color.g, color.b, color.a)
    }
    equals(color: Color) {
        return color.r == this.r &&
            color.g == this.g &&
            color.b == this.b &&
            color.a == this.a
    }

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
    add(color: Color) {
        return new Color(
            Math.min(this.r + color.r, 255),
            Math.min(this.g + color.g, 255),
            Math.min(this.b + color.b, 255),
            Math.min(this.a + color.a, 255)
        );
    }

    subtract(color: Color) {
        return new Color(
            Math.max(this.r - color.r, 0),
            Math.max(this.g - color.g, 0),
            Math.max(this.b - color.b, 0),
            Math.max(this.a - color.a, 0)
        );
    }
}