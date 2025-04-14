import { IMathStruct as IMathObject, ITransformOptions, WebGLContext } from "./interface";
/**
 * @ignore
 */
export declare enum ArrayType {
    Float32 = 0,
    Uint32 = 1,
    Uint16 = 2
}
/**
 * @ignore
 */
export declare class DynamicArrayBuffer {
    usedElemNum: number;
    protected typedArray: Float32Array | Uint32Array | Uint16Array;
    private arrayType;
    protected maxElemNum: number;
    readonly bytePerElem: number;
    private arraybuffer;
    private uint32?;
    private float32?;
    private uint16?;
    constructor(arrayType: ArrayType);
    getArrayType(arrayType: ArrayType): Float32ArrayConstructor | Uint32ArrayConstructor | Uint16ArrayConstructor;
    updateTypedArray(): void;
    clear(): void;
    /**
     * resize the array
     * @param size
     * @returns
     */
    resize(size?: number): void;
    protected setMaxSize(size?: number): void;
    pushUint32(value: number): void;
    pushFloat32(value: number): void;
    pushUint16(value: number): void;
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
    getArray(begin?: number, end?: number): Uint32Array | Float32Array | Uint16Array;
    /**
     * length of the array
     */
    get length(): number;
}
/**
 * @ignore
 */
export declare class WebglBufferArray extends DynamicArrayBuffer {
    buffer: WebGLBuffer;
    gl: WebGLContext;
    protected dirty: boolean;
    readonly type: number;
    /**
     * webglbuffer 中的大小
     */
    private webglBufferSize;
    readonly usage: number;
    constructor(gl: WebGLContext, arrayType: ArrayType, type?: number, usage?: number);
    pushFloat32(value: number): void;
    pushUint32(value: number): void;
    pushUint16(value: number): void;
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
    translate(x: number | Vec2, y?: number): void;
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
    apply(x: number | Vec2, y?: number): Vec2 | number[];
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
    /**
     * Get the global position in world space
     * @returns The current matrix position in world space
     */
    getGlobalPosition(): Vec2;
    /**
     * Set the global position in world space
     * @param x - x coordinate or Vec2 object
     * @param y - y coordinate (ignored if first parameter is Vec2)
     */
    setGlobalPosition(x: number | Vec2, y?: number): void;
    /**
     * Get the global rotation angle
     * @returns The current matrix rotation angle in radians
     */
    getGlobalRotation(): number;
    /**
     * Set the global rotation angle
     * @param angle - rotation angle in radians
     */
    setGlobalRotation(angle: number): void;
    /**
     * Get the global scale
     * @returns The current matrix scale values
     */
    getGlobalScale(): Vec2;
    /**
     * Set the global scale
     * @param x - x scale or Vec2 object
     * @param y - y scale (ignored if first parameter is Vec2)
     */
    setGlobalScale(x: number | Vec2, y?: number): void;
    globalToLocal(global: Vec2): Vec2;
    localToGlobal(local: Vec2): Vec2;
    /**
     * Convert the current matrix to a CSS transform string
     * @returns CSS transform string representation of the matrix
     */
    toCSSTransform(): string;
    /**
     * Reset the current matrix to identity matrix
     */
    identity(): void;
    /**
     * Apply the transform to the current matrix
     * @param transform - The transform to apply
     * @returns offset position
     */
    applyTransform(transform: ITransformOptions, width?: number, height?: number): {
        offsetX: number;
        offsetY: number;
    };
    applyTransformAfter(transform: ITransformOptions): void;
}
/**
 * @ignore
 */
export declare class WebglElementBufferArray extends WebglBufferArray {
    constructor(gl: WebGLContext, elemVertPerObj: number, vertexPerObject: number, maxBatch: number);
    protected addObject(_vertex?: number): void;
}
/**
 * Represents a color with red, green, blue, and alpha (transparency) components.
 */
export declare class Color implements IMathObject<Color> {
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
    constructor(r: number, g: number, b: number, a?: number);
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
     * Clone the current color
     * @returns A new `Color` instance with the same RGBA values.
     */
    clone(): Color;
    /**
     * Checks if the current color is equal to another color.
     * @param color - The color to compare with.
     * @returns True if the colors are equal, otherwise false.
     */
    equal(color: Color): boolean;
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
    static Red: Color;
    static Green: Color;
    static Blue: Color;
    static Yellow: Color;
    static Purple: Color;
    static Orange: Color;
    static Pink: Color;
    static Gray: Color;
    static Brown: Color;
    static Cyan: Color;
    static Magenta: Color;
    static Lime: Color;
    static White: Color;
    static Black: Color;
    static TRANSPARENT: Color;
}
/**
 * Represents a 2D vector with x and y components.
 */
export declare class Vec2 implements IMathObject<Vec2> {
    x: number;
    y: number;
    static ZERO: Vec2;
    static ONE: Vec2;
    static UP: Vec2;
    static DOWN: Vec2;
    static LEFT: Vec2;
    static RIGHT: Vec2;
    /**
     * Creates an instance of Vec2.
     * @param x - The x coordinate (default is 0).
     * @param y - The y coordinate (default is 0).
     */
    constructor(x?: number, y?: number);
    /**
     * Adds another vector to this vector.
     * @param v - The vector to add.
     * @returns A new Vec2 instance with the result of the addition.
     */
    add(v: Vec2): Vec2;
    /**
     * Subtracts another vector from this vector.
     * @param v - The vector to subtract.
     * @returns A new Vec2 instance with the result of the subtraction.
     */
    subtract(v: Vec2): Vec2;
    /**
     * Multiplies the vector by a scalar or another vector.
     * @param f - The scalar value or vector to multiply by.
     * @returns A new Vec2 instance with the result of the multiplication.
     */
    multiply(f: number | Vec2): Vec2;
    /**
     * Divides the vector by a scalar or another vector.
     * @param f - The scalar value or vector to divide by.
     * @returns A new Vec2 instance with the result of the division.
     */
    divide(f: number | Vec2): Vec2;
    /**
     * Calculates the dot product of this vector with another vector.
     * @param v - The other vector.
     * @returns The dot product result.
     */
    dot(v: Vec2): number;
    /**
     * Calculates the cross product of this vector with another vector.
     * @param v - The other vector.
     * @returns The cross product result.
     */
    cross(v: Vec2): number;
    /**
     * Calculates the distance to another point.
     * @param v - The other point.
     * @returns The distance between the two points.
     */
    distanceTo(v: Vec2): number;
    /**
     * Clones the vector.
     * @returns A new Vec2 instance with the same x and y values.
     */
    clone(): Vec2;
    /**
     * Copy the vector
     * @param vec - The vector to copy.
     */
    copy(vec: Vec2): void;
    /**
     * Check if the vector is equal to another vector.
     * @param vec - The vector to compare with.
     * @returns True if the vectors are equal, otherwise false.
     */
    equal(vec: Vec2): boolean;
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
     * Calculates the middle point between the current vector and another vector.
     * @param other - The other vector.
     * @returns A new vector representing the middle point between the current vector and the other vector.
     */
    middle(other: Vec2): Vec2;
    /**
     * Returns a new vector with the absolute values of the components.
     * @returns A new vector with absolute values.
     */
    abs(): Vec2;
    /**
     * Returns a new vector with floored components.
     * @returns A new vector with components rounded down to the nearest integer.
     */
    floor(): Vec2;
    /**
     * Returns a new vector with ceiled components.
     * @returns A new vector with components rounded up to the nearest integer.
     */
    ceil(): Vec2;
    /**
     * Snaps the vector components to the nearest increment.
     * @param increment - The increment to snap to.
     * @returns A new vector with components snapped to the nearest increment.
     */
    snap(increment: number): Vec2;
    /**
     * Converts the vector to a string representation.
     * @returns A string containing the vector's x and y coordinates.
     */
    stringify(): string;
    /**
     * Converts an array of coordinate pairs into an array of Vec2 instances.
     * @param array - An array of [x, y] coordinate pairs.
     * @returns An array of Vec2 instances.
     */
    static FromArray(array: number[][]): Vec2[];
}
/**
 * Provides utility methods for mathematical conversions.
 */
export declare class MathUtils {
    /**
     * Converts degrees to radians.
     * @param degrees - The angle in degrees.
     * @returns The equivalent angle in radians.
     */
    static deg2rad(degrees: number): number;
    /**
     * Converts radians to degrees.
     * @param rad - The angle in radians.
     * @returns The equivalent angle in degrees.
     */
    static rad2deg(rad: number): number;
    /**
     * Normalizes an angle in degrees to be within the range of 0 to 360 degrees.
     * @param degrees - The angle in degrees to be normalized.
     * @returns The normalized angle in degrees.
     */
    static normalizeDegrees(degrees: number): number;
}
