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
    getArray(begin?: number, end?: number): Uint16Array | Float32Array;
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
    translate(x: number | Vec2, y: number): void;
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
    scale(x: number | Vec2, y?: number): void;
    /**
     * Transforms a point by applying the current matrix stack.
     * @returns The transformed point as an array `[newX, newY]`.
     */
    apply(x: number | Vec2, y: number): Vec2 | number[];
    /**
     * Obtain the inverse matrix of the current matrix
     * @returns inverse matrix
     */
    getInverse(): Float32Array;
    /**
     * Get a copy of the current transformation matrix
     * @returns matrix
     */
    getTransform(): Float32Array;
    /**
     * Set the current transformation matrix
     * @param array
     */
    setTransform(array: Float32Array | number[]): void;
}
export declare class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl: WebGLContext, elemVertPerObj: number, vertexPerObject: number, maxBatch: number);
    protected addObject(_vertex?: number): void;
}
/**
 * Represents a color with red, green, blue, and alpha (transparency) components.
 */
export declare class Color {
    private _r;
    private _g;
    private _b;
    private _a;
    uint32: number;
    /**
     * Creates an instance of Color.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    constructor(r: number, g: number, b: number, a: number);
    /**
     * Gets the red component.
     */
    get r(): number;
    /**
     * Sets the red component and updates the uint32 representation.
     * @param value - The new red component (0-255).
     */
    set r(value: number);
    /**
     * Gets the green component.
     */
    get g(): number;
    /**
     * Sets the green component and updates the uint32 representation.
     * @param value - The new green component (0-255).
     */
    set g(value: number);
    /**
     * Gets the blue component.
     */
    get b(): number;
    /**
     * Sets the blue component and updates the uint32 representation.
     * @param value - The new blue component (0-255).
     */
    set b(value: number);
    /**
     * Gets the alpha component.
     */
    get a(): number;
    /**
     * Sets the alpha component and updates the uint32 representation.
     * @param value - The new alpha component (0-255).
     */
    set a(value: number);
    /**
     * Updates the uint32 representation of the color.
     * @private
     */
    private updateUint;
    /**
     * Sets the RGBA values of the color and updates the uint32 representation.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    setRGBA(r: number, g: number, b: number, a: number): void;
    /**
     * Copies the RGBA values from another color.
     * @param color - The color to copy from.
     */
    copy(color: Color): void;
    /**
     * Checks if the current color is equal to another color.
     * @param color - The color to compare with.
     * @returns True if the colors are equal, otherwise false.
     */
    equals(color: Color): boolean;
    /**
     * Creates a Color instance from a hexadecimal color string.
     * @param hexString - The hexadecimal color string, e.g., '#RRGGBB' or '#RRGGBBAA'.
     * @returns A new Color instance.
     */
    static fromHex(hexString: string): Color;
    /**
     * Adds the components of another color to this color, clamping the result to 255.
     * @param color - The color to add.
     * @returns A new Color instance with the result of the addition.
     */
    add(color: Color): Color;
    /**
     * Subtracts the components of another color from this color, clamping the result to 0.
     * @param color - The color to subtract.
     * @returns A new Color instance with the result of the subtraction.
     */
    subtract(color: Color): Color;
}
/**
 * Represents a 2D vector with x and y components.
 */
export declare class Vec2 {
    x: number;
    y: number;
    /**
     * Creates an instance of Vec2.
     * @param x - The x coordinate (default is 0).
     * @param y - The y coordinate (default is 0).
     */
    constructor(x?: number, y?: number);
    /**
     * Multiplies the vector by a scalar.
     * @param f - The scalar value to multiply by.
     * @returns The current instance with updated values.
     */
    scalarMult(f: number): this;
    /**
     * Rotates the vector 90 degrees counterclockwise.
     * @returns The current instance with updated values.
     */
    perpendicular(): this;
    /**
     * Inverts the direction of the vector.
     * @returns The current instance with updated values.
     */
    invert(): this;
    /**
     * Calculates the length of the vector.
     * @returns The length of the vector.
     */
    length(): number;
    /**
     * Normalizes the vector to have a length of 1.
     * @returns The current instance with updated values.
     */
    normalize(): this;
    /**
     * Calculates the angle of the vector relative to the x-axis.
     * @returns The angle of the vector.
     */
    angle(): number;
    /**
     * Computes the angle between two vectors.
     * @param p0 - The starting vector.
     * @param p1 - The ending vector.
     * @returns The angle between the two vectors in radians.
     */
    static Angle(p0: Vec2, p1: Vec2): number;
    /**
     * Adds two vectors together.
     * @param p0 - The first vector.
     * @param p1 - The second vector.
     * @returns A new vector representing the sum of p0 and p1.
     */
    static Add(p0: Vec2, p1: Vec2): Vec2;
    /**
     * Subtracts one vector from another.
     * @param p1 - The vector to subtract from.
     * @param p0 - The vector to subtract.
     * @returns A new vector representing the difference between p1 and p0.
     */
    static Sub(p1: Vec2, p0: Vec2): Vec2;
    /**
     * Finds the midpoint between two vectors.
     * @param p0 - The first vector.
     * @param p1 - The second vector.
     * @returns A new vector representing the midpoint between p0 and p1.
     */
    static Middle(p0: Vec2, p1: Vec2): Vec2;
    /**
     * Converts an array of coordinate pairs into an array of Vec2 instances.
     * @param array - An array of [x, y] coordinate pairs.
     * @returns An array of Vec2 instances.
     */
    static FormArray(array: number[][]): Vec2[];
}
export {};
