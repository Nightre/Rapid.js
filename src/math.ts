import { MATRIX_SIZE } from "./const";
import { WebGLContext } from "./interface";


type ArrayType = typeof Float32Array | typeof Uint16Array

export class DynamicArrayBuffer {
    protected usedElemNum: number
    protected typedArray: Float32Array | Uint16Array
    private arrayType: ArrayType
    protected maxElemNum: number
    readonly bytePerElem: number

    constructor(arrayType: ArrayType) {
        this.usedElemNum = 0;
        this.maxElemNum = 64;
        this.bytePerElem = arrayType.BYTES_PER_ELEMENT
        this.arrayType = arrayType
        this.typedArray = new arrayType(this.maxElemNum)
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

            const data = this.typedArray;
            this.typedArray = new this.arrayType(this.maxElemNum)
            this.typedArray.set(data);
            return this;
        }
    }
    /**
     * push a new element
     * @param value 
     */
    push(value: number) {
        this.typedArray[this.usedElemNum] = value
        this.usedElemNum += 1
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
    push(value: number): void {
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
                gl.bufferData(this.type, this.getArray(), gl.STATIC_DRAW)
                this.webglBufferSize = this.maxElemNum
            } else {
                // TODO: 考察是否需要裁剪typedarray
                gl.bufferSubData(this.type, 0, this.getArray(0, this.usedElemNum))
            }
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
}

export class WebglElementBufferArray extends WebglBufferArray {
    private objects: number = 0
    readonly indexVertPerObj: number
    readonly vertexPerObject: number

    constructor(gl: WebGLContext, elemVertPerObj: number, vertexPerObject: number) {
        super(gl, Uint16Array, gl.ELEMENT_ARRAY_BUFFER)
        this.indexVertPerObj = elemVertPerObj // quad = 6
        this.vertexPerObject = vertexPerObject // quad = 4
    }
    protected addObject(_vertex?: number) {
        this.objects++
    }
    /**
     * set number of objects
     * @param obj 
     */
    setObjects(obj: number) {
        if (obj > this.objects) {
            obj *= 2
            this.resize((obj - this.objects) * this.indexVertPerObj)
            while (obj > this.objects) {
                this.addObject(this.objects * this.vertexPerObject)
            }
        }
    }

    clear(): void {
        super.clear()
        this.objects = 0
    }
}