import { WebGLContext } from "./interface";
type ArrayType = typeof Float32Array | typeof Uint16Array;
export declare class DynamicArrayBuffer {
    usedElemNum: number;
    protected typedArray: Float32Array | Uint16Array;
    private arrayType;
    protected maxElemNum: number;
    readonly bytePerElem: number;
    private arraybuffer;
    /** if typedArray is Float32Array*/
    private uint32?;
    constructor(arrayType: ArrayType);
    clear(): void;
    /**
     * resize the array
     * @param size
     * @returns
     */
    resize(size?: number): void;
    protected setMaxSize(size?: number): void;
    /**
     * push a new element
     * @param value
     */
    push(value: number): void;
    pushUint(value: number): void;
    /**
     * pop a element
     * @param num
     */
    pop(num: number): void;
    /**
     * get the array
     * @param begin
     * @param end
     * @returns
     */
    getArray(begin?: number, end?: number): Float32Array | Uint16Array;
    /**
     * length of the array
     */
    get length(): number;
}
export declare class WebglBufferArray extends DynamicArrayBuffer {
    buffer: WebGLBuffer;
    gl: WebGLContext;
    protected dirty: boolean;
    readonly type: number;
    /**
     * webglbuffer 中的大小
     */
    private webglBufferSize;
    constructor(gl: WebGLContext, arrayType: ArrayType, type?: number);
    push(value: number): void;
    /**
     * bind buffer to gpu
     */
    bindBuffer(): void;
    /**
     * array data to gpu
     */
    bufferData(): void;
}
export declare class MatrixStack extends DynamicArrayBuffer {
    constructor();
    /**
     * push a matrix to the stack
     */
    pushMat(): void;
    /**
     * pop a matrix from the stack
     */
    popMat(): void;
    /**
     * push a matrix and indentiy it
     */
    pushIdentity(): void;
    /**
     * Translates the current matrix by the specified x and y values.
     * @param x - The amount to translate horizontally.
     * @param y - The amount to translate vertically.
     */
    translate(x: number, y: number): void;
    /**
     * Rotates the current matrix by the specified angle.
     * @param angle - The angle, in radians, to rotate the matrix by.
     */
    rotate(angle: number): void;
    /**
     * Multiplies the current matrix on the top of the stack by a scaling transformation.
     * @param x - The amount to scale the matrix horizontally.
     * @param y - The amount to scale the matrix vertically. If not specified, x is used for both horizontal and vertical scaling.
     */
    scale(x: number, y?: number): void;
    apply(x: number, y: number): number[];
    getInverse(): Float32Array;
    getTransform(): Float32Array;
    setTransform(array: Float32Array | number[]): void;
}
export declare class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl: WebGLContext, elemVertPerObj: number, vertexPerObject: number, maxBatch: number);
    protected addObject(_vertex?: number): void;
}
export declare class Color {
    private _r;
    private _g;
    private _b;
    private _a;
    uint32: number;
    constructor(r: number, g: number, b: number, a: number);
    get r(): number;
    set r(value: number);
    get g(): number;
    set g(value: number);
    get b(): number;
    set b(value: number);
    get a(): number;
    set a(value: number);
    private updateUint;
    setRGBA(r: number, g: number, b: number, a: number): void;
    copy(color: Color): void;
    equals(color: Color): boolean;
    static fromHex(hexString: string): Color;
    add(color: Color): Color;
    subtract(color: Color): Color;
}
export {};
