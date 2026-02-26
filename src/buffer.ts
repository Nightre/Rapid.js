import { WebGLContext } from "./webgl/utils"

/**
 * Defines the type of the underlying array buffer elements.
 */
export enum ArrayType {
    Float32,
    Uint32,
    Uint16
}

type TypedArrayConstructor = Float32ArrayConstructor | Uint32ArrayConstructor | Uint16ArrayConstructor;

/**
 * A dynamic array buffer that can grow in size automatically when elements are added.
 * It allocates an ArrayBuffer and provides typed array views to manipulate the data.
 */
export class DynamicArrayBuffer {
    /** The number of elements currently used in the buffer. */
    usedElemNum: number
    /** The main typed array view corresponding to the specified ArrayType. */
    typedArray!: Float32Array | Uint32Array | Uint16Array
    private arrayType: ArrayType
    /** The maximum number of elements the buffer can currently hold without resizing. */
    protected maxElemNum: number
    /** The number of bytes per element based on the `ArrayType`. */
    readonly bytePerElem: number
    private arraybuffer: ArrayBuffer

    /** `Uint32Array` view of the underlying memory buffer. */
    uint32?: Uint32Array
    /** `Float32Array` view of the underlying memory buffer. */
    float32?: Float32Array
    /** `Uint16Array` view of the underlying memory buffer. */
    uint16?: Uint16Array

    /**
     * Initializes a new dynamic array buffer.
     * @param arrayType - The type of elements this buffer will store primarily.
     */
    constructor(arrayType: ArrayType) {
        this.usedElemNum = 0;
        this.maxElemNum = 512;
        this.bytePerElem = this.getArrayType(arrayType).BYTES_PER_ELEMENT
        this.arrayType = arrayType
        this.arraybuffer = new ArrayBuffer(this.maxElemNum * this.bytePerElem)

        this.updateTypedArray()
    }

    /**
     * Returns the typed array constructor for the corresponding `ArrayType`.
     * @param arrayType - The type of the array.
     * @returns The typed array constructor.
     * @throws Dispatches an error if the specified type is unsupported.
     */
    getArrayType(arrayType: ArrayType): TypedArrayConstructor {
        switch (arrayType) {
            case ArrayType.Float32:
                return Float32Array
            case ArrayType.Uint32:
                return Uint32Array
            case ArrayType.Uint16:
                return Uint16Array
            default:
                throw new Error("Unsupported ArrayType");
        }
    }

    /**
     * Updates the typed array views when the internal array buffer gets reallocated.
     */
    updateTypedArray(): void {
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

    /**
     * Resets the element usage count to zero. The underlying memory capacity is preserved.
     */
    clear(): void {
        this.usedElemNum = 0;
    }

    /**
     * Checks if the buffer has enough space for additional elements and resizes the buffer if necessary.
     * @param size - The number of new elements that need to be accommodated.
     * @returns `true` if the buffer was resized, `false` otherwise.
     */
    resize(size: number = 0): boolean {
        size += this.usedElemNum

        if (size > this.maxElemNum) {
            while (size > this.maxElemNum) {
                this.maxElemNum *= 2;
            }
            this.setMaxSize(this.maxElemNum)
            return true
        }
        return false
    }

    /**
     * Reallocates the underlying array buffer to a new size and copies existing data.
     * @param size - The new maximum number of elements.
     */
    protected setMaxSize(size: number = this.maxElemNum): void {
        const data = this.typedArray;
        this.maxElemNum = size
        this.arraybuffer = new ArrayBuffer(size * this.bytePerElem)

        this.updateTypedArray()
        this.typedArray.set(data);
    }

    /**
     * Appends a new 32-bit unsigned integer element to the buffer.
     * @param value - The item to add.
     */
    pushUint32(value: number): void {
        this.resize(1)
        this.uint32![this.usedElemNum++] = value
    }

    /**
     * Appends a new 32-bit floating point element to the buffer.
     * @param value - The item to add.
     */
    pushFloat32(value: number): void {
        this.resize(1)
        this.float32![this.usedElemNum++] = value
    }

    /**
     * Appends an element to the buffer, using the primary typed array view.
     * @param value - The item to add.
     */
    push(value: number): void {
        this.resize(1)
        this.typedArray[this.usedElemNum++] = value
    }

    /**
     * Removes and returns the last element in the buffer.
     * @returns The removed element or undefined if the buffer is empty.
     */
    pop(): number {
        return this.typedArray[--this.usedElemNum]
    }

    /**
     * Returns the last element pushed to the buffer without removing it.
     * @returns The last element.
     */
    top(): number {
        return this.typedArray[this.usedElemNum - 1]
    }

    /**
     * Gets the value of the element at the specified index.
     * @param index - The index of the element to retrieve.
     * @returns The requested element.
     */
    get(index: number): number {
        return this.typedArray[index]
    }

    /**
     * Returns a constrained view of the primary typed array up to the specified range.
     * If `end` is omitted, returns the whole reallocated buffer slice.
     * @param begin - The starting index (inclusive). Defaults to 0.
     * @param end - The ending index (exclusive). Optional.
     * @returns A subarray corresponding to the specified range.
     */
    getArray(begin: number = 0, end?: number): Float32Array | Uint32Array | Uint16Array {
        if (end === undefined) {
            return this.typedArray;
        }
        return this.typedArray.subarray(begin, end);
    }

    /**
     * The number of elements currently stored in the buffer.
     */
    public get length(): number {
        return this.usedElemNum
    }

    /**
     * Resets the buffer's used element count, effectively emptying it.
     * Same behavior as `clear`.
     */
    reset(): void {
        this.usedElemNum = 0;
    }
}

/**
 * A specialized dynamic buffer intended for WebGL operations.
 */
export class WebglBufferArray extends DynamicArrayBuffer {
    /** The actual WebGLBuffer object maintained by this instance. */
    buffer: WebGLBuffer
    /** The related WebGL rendering context. */
    gl: WebGLContext
    /** Signifies whether the buffer has been updated and requires resyncing to the GPU. */
    protected dirty: boolean = true
    /** The WebGL buffer type, e.g., gl.ARRAY_BUFFER. */
    readonly type: number
    /** Size of the allocated buffer block on the GPU side, bounded in elements count. */
    private webglBufferSize: number = 0
    /** Usage hint for WebGL, e.g., gl.DYNAMIC_DRAW. */
    readonly usage: number

    /**
     * Initializes a new WebGL dynamic buffer.
     * @param gl - The active WebGL rendering context state.
     * @param arrayType - Type of the underlying data elements to bind.
     * @param type - Determines the type of WebGLBuffer (defaults to gl.ARRAY_BUFFER).
     * @param usage - Determines the data usage pattern (defaults to gl.DYNAMIC_DRAW).
     */
    constructor(gl: WebGLContext, arrayType: ArrayType, type: number = gl.ARRAY_BUFFER, usage: number = gl.DYNAMIC_DRAW) {
        super(arrayType)
        this.gl = gl
        this.buffer = gl.createBuffer()!;
        this.type = type
        this.usage = usage
    }

    /**
     * Flags the buffer as dirty, marking it for future data synchronization.
     */
    makeDirty(): void {
        this.dirty = true
    }

    /**
     * Clears CPU side data usage and marks buffer as synced to stop needless updates.
     */
    clear(): void {
        super.clear()
        this.dirty = false
    }

    /**
     * Binds this buffer object tracking it as the current bound buffer to the GPU.
     */
    bindBuffer(): void {
        this.gl.bindBuffer(this.type, this.buffer)
    }

    /**
     * Uploads the local buffer data to the GPU memory synchronously.
     */
    bufferData(): void {
        if (this.dirty) {
            const gl = this.gl
            if (this.maxElemNum > this.webglBufferSize) {
                gl.bufferData(this.type, this.getArray(), this.usage)
                this.webglBufferSize = this.maxElemNum
            } else {
                gl.bufferSubData(this.type, 0, this.getArray(0, this.usedElemNum))
            }
            this.dirty = false
        }
    }
}