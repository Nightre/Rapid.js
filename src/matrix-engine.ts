import { DynamicArrayBuffer, ArrayType } from "./buffer.ts";
import { Rapid } from "./render.ts";

const NUM_ELEMENTS = 6;

/**
 * A highly optimized store for a collection of 2D 3x3 matrices (stored as 6 elements: a, b, c, d, tx, ty).
 * Matrices are stored flat in a dynamic Float32Array to improve memory locality and cache performance.
 */
export class MatrixStore {
    /** Total number of matrices currently allocated in the store. */
    public matrixCount: number = 0;
    /** The dynamic buffer used to hold matrix data. */
    public buffer: DynamicArrayBuffer;
    /** The raw floating-point data of all matrices. */
    public data: Float32Array;

    /**
     * Creates a new MatrixStore.
     * @param capacity - The initial capacity of the matrix store (default is 10).
     */
    constructor(capacity: number = 10) {
        this.buffer = new DynamicArrayBuffer(ArrayType.Float32);
        this.buffer.resize(capacity * NUM_ELEMENTS);
        this.data = this.buffer.getArray() as Float32Array;
    }

    /**
     * Allocates a new matrix and initializes it to the identity matrix.
     * @returns The index of the newly allocated matrix.
     */
    alloc(): number {
        const index = this.allocDirty();
        this.identity(index);
        return index;
    }

    /**
     * Allocates a new matrix without initializing its elements.
     * @returns The index of the newly allocated matrix.
     */
    allocDirty(): number {
        if (this.buffer.resize(NUM_ELEMENTS)) {
            this.data = this.buffer.getArray() as Float32Array
        }
        this.buffer.usedElemNum += NUM_ELEMENTS;
        const index = this.matrixCount++;
        return index;
    }

    /**
     * Resets the store, clearing all allocated matrices.
     */
    reset(): void {
        this.matrixCount = 0;
        this.buffer.usedElemNum = 0;
    }

    /**
     * Sets the matrix at the given index to the identity matrix.
     * @param index - The index of the matrix to modify.
     */
    identity(index: number): void {
        const o = index * NUM_ELEMENTS
        const d = this.data;
        d[o] = 1; d[o + 1] = 0;
        d[o + 2] = 0; d[o + 3] = 1;
        d[o + 4] = 0; d[o + 5] = 0;
    }

    /**
     * Translates the matrix at the given index by x and y.
     * @param index - The index of the matrix to modify.
     * @param x - The x translation.
     * @param y - The y translation.
     */
    translate(index: number, x: number, y: number): void {
        const o = index * NUM_ELEMENTS
        const d = this.data;
        d[o + 4] = d[o] * x + d[o + 2] * y + d[o + 4];
        d[o + 5] = d[o + 1] * x + d[o + 3] * y + d[o + 5];
    }

    /**
     * Scales the matrix at the given index by scaleX and scaleY.
     * @param index - The index of the matrix to modify.
     * @param scaleX - The scale factor along the x-axis.
     * @param scaleY - The scale factor along the y-axis.
     */
    scale(index: number, scaleX: number, scaleY: number): void {
        const o = index * NUM_ELEMENTS
        const d = this.data;
        d[o] *= scaleX;
        d[o + 1] *= scaleX;
        d[o + 2] *= scaleY;
        d[o + 3] *= scaleY;
    }

    /**
     * Rotates the matrix at the given index by the specified radians.
     * @param index - The index of the matrix to modify.
     * @param radians - The rotation angle in radians.
     */
    rotate(index: number, radians: number): void {
        const o = index * NUM_ELEMENTS
        const d = this.data;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const a = d[o], b = d[o + 1], c = d[o + 2], dv = d[o + 3];
        d[o] = a * cos + c * sin;
        d[o + 1] = b * cos + dv * sin;
        d[o + 2] = a * -sin + c * cos;
        d[o + 3] = b * -sin + dv * cos;
    }

    /**
     * Rotates the matrix at the given index around a local offset point (pivot).
     *
     * This is equivalent to:
     * 1. Translating by `(offsetX, offsetY)` to move the pivot to the origin.
     * 2. Rotating by `radians`.
     * 3. Translating back by `(-offsetX, -offsetY)`.
     *
     * Useful for rotating a sprite around a point other than its own origin,
     * e.g. a character's limb rotating around its joint.
     *
     * @param index   - The index of the matrix to modify.
     * @param radians - The rotation angle in radians.
     * @param offsetX - The x component of the pivot point in local space.
     * @param offsetY - The y component of the pivot point in local space.
     */
    rotateWithOffset(index: number, radians: number, offsetX: number, offsetY: number): void {
        this.translate(index, offsetX, offsetY);
        this.rotate(index, radians);
        this.translate(index, -offsetX, -offsetY);
    }

    /**
     * Copies the elements from the source matrix to the destination matrix.
     * @param dst - The index of the destination matrix.
     * @param src - The index of the source matrix.
     */
    copy(dst: number, src: number): void {
        const od = dst * NUM_ELEMENTS
        const os = src * NUM_ELEMENTS
        const d = this.data;
        d[od] = d[os]; d[od + 1] = d[os + 1];
        d[od + 2] = d[os + 2]; d[od + 3] = d[os + 3];
        d[od + 4] = d[os + 4]; d[od + 5] = d[os + 5];
    }

    /**
     * Multiplies the destination matrix by the source matrix and stores the result in the destination.
     * @param dst - The index of the destination matrix.
     * @param src - The index of the source matrix.
     */
    multiply(dst: number, src: number): void {
        this.multiplyOut(dst, dst, src);
    }

    /**
     * Multiplies matrix A by matrix B and stores the result in the output matrix.
     * @param out - The index of the output matrix.
     * @param aIdx - The index of matrix A.
     * @param bIdx - The index of matrix B.
     */
    multiplyOut(out: number, aIdx: number, bIdx: number): void {
        const o = out * NUM_ELEMENTS;
        const oa = aIdx * NUM_ELEMENTS;
        const ob = bIdx * NUM_ELEMENTS;
        const d = this.data;

        // Extract A
        const a00 = d[oa], a01 = d[oa + 1], a10 = d[oa + 2], a11 = d[oa + 3], a20 = d[oa + 4], a21 = d[oa + 5];
        // Extract B
        const b00 = d[ob], b01 = d[ob + 1], b10 = d[ob + 2], b11 = d[ob + 3], b20 = d[ob + 4], b21 = d[ob + 5];

        d[o] = a00 * b00 + a10 * b01;
        d[o + 1] = a01 * b00 + a11 * b01;
        d[o + 2] = a00 * b10 + a10 * b11;
        d[o + 3] = a01 * b10 + a11 * b11;
        d[o + 4] = a00 * b20 + a10 * b21 + a20;
        d[o + 5] = a01 * b20 + a11 * b21 + a21;
    }

    /**
     * Inverts the matrix at the given index. If the matrix is not invertible, it defaults to the identity matrix.
     * @param index - The index of the matrix to invert.
     */
    invert(index: number): void {
        const o = index * NUM_ELEMENTS;
        const d = this.data;
        const a = d[o], b = d[o + 1], c = d[o + 2], dv = d[o + 3], tx = d[o + 4], ty = d[o + 5];
        let det = a * dv - b * c;
        if (!det) { this.identity(index); return; }
        det = 1.0 / det;
        d[o] = dv * det;
        d[o + 1] = -b * det;
        d[o + 2] = -c * det;
        d[o + 3] = a * det;
        d[o + 4] = (c * ty - dv * tx) * det;
        d[o + 5] = (b * tx - a * ty) * det;
    }

    /**
     * Transforms a point by the matrix at the given index.
     * @param index - The index of the transformation matrix.
     * @param x - The x coordinate of the point.
     * @param y - The y coordinate of the point.
     * @returns The transformed point {x, y}.
     */
    transformPoint(index: number, x: number, y: number): { x: number, y: number } {
        const o = index * NUM_ELEMENTS;
        const d = this.data;
        return {
            x: x * d[o] + y * d[o + 2] + d[o + 4],
            y: x * d[o + 1] + y * d[o + 3] + d[o + 5],
        };
    }

    /**
     * Transforms a point from world coordinates to local coordinates using the matrix at the specified index.
     * Useful for hit testing against objects placed in world space.
     * @param index - The index of the world transformation matrix.
     * @param x - World x coordinate.
     * @param y - World y coordinate.
     * @returns The transformed point in local coordinates.
     */
    worldToLocal(index: number, x: number, y: number): { x: number, y: number } {
        // Allocate a temporary matrix to compute the inverse
        const tempIdx = this.allocDirty();
        this.copy(tempIdx, index);
        this.invert(tempIdx);

        const localPoint = this.transformPoint(tempIdx, x, y);

        // Discard the temporary matrix
        this.matrixCount--;
        this.buffer.usedElemNum -= NUM_ELEMENTS;

        return localPoint;
    }

    /**
     * Transforms a point from local coordinates to world coordinates.
     * @param index - The index of the local transformation matrix.
     * @param x - Local x coordinate.
     * @param y - Local y coordinate.
     * @returns The transformed point in world coordinates.
     */
    localToWorld(index: number, x: number, y: number): { x: number, y: number } {
        return this.transformPoint(index, x, y);
    }

    /**
     * Extracts the global position (translation) from the matrix at the given index.
     * @param index - The index of the matrix.
     * @returns An object containing `x` and `y` global coordinates.
     */
    getPosition(index: number): { x: number, y: number } {
        const o = index * NUM_ELEMENTS;
        const d = this.data;
        return { x: d[o + 4], y: d[o + 5] };
    }

    /**
     * Extracts the global scale from the matrix at the given index.
     * @param index - The index of the matrix.
     * @returns An object containing `x` and `y` global scale factors.
     */
    getScale(index: number): { x: number, y: number } {
        const o = index * NUM_ELEMENTS;
        const d = this.data;
        const scaleX = Math.sqrt(d[o] * d[o] + d[o + 1] * d[o + 1]);
        const scaleY = Math.sqrt(d[o + 2] * d[o + 2] + d[o + 3] * d[o + 3]);
        return { x: scaleX, y: scaleY };
    }

    /**
     * Extracts the global rotation (in radians) from the matrix at the given index.
     * @param index - The index of the matrix.
     * @returns The global rotation in radians.
     */
    getRotation(index: number): number {
        const o = index * NUM_ELEMENTS;
        const d = this.data;
        return Math.atan2(d[o + 1], d[o]);
    }

    /**
     * Converts the matrix at the given index to a CSS matrix string.
     * @param index - The index of the matrix.
     * @returns A CSS matrix string.
     */
    toCSSMatrix(index: number): string {
        const o = index * NUM_ELEMENTS;
        const d = this.data;
        return `matrix(${d[o]}, ${d[o + 1]}, ${d[o + 2]}, ${d[o + 3]}, ${d[o + 4]}, ${d[o + 5]})`;
    }
}

/**
 * A highly performant MatrixStack useful for hierarchal scene graphs.
 * Handles both local and world transformations automatically.
 */
export class MatrixStack {
    /** The underlying store for matrices. */
    matrix = new MatrixStore()

    /** The current step or depth in the transformation hierarchy. */
    step: number = 0

    /** Internal stack maintaining structural information. */
    stack = new DynamicArrayBuffer(ArrayType.Uint32)

    /** Records the world matrices generated at each step. */
    stepWorldM = new DynamicArrayBuffer(ArrayType.Uint32)
    /** Records actions (push/pop) taken during the traversal. */
    stepAction = new DynamicArrayBuffer(ArrayType.Uint32)
    /** Records the parent world matrix for each step (used by updateMatrix). */
    stepParentM = new DynamicArrayBuffer(ArrayType.Uint32)

    /** Buffer used during hierarchy traversal updates. */
    parentStack = new DynamicArrayBuffer(ArrayType.Uint32)

    /** The index of the current local matrix in the matrix store. */
    curLocalM = -1
    /** The index of the current world matrix in the matrix store. */
    curWorldM = -1

    rapid: Rapid

    /**
     * Creates a new MatrixStack and initializes its state.
     */
    constructor(rapid: Rapid) {
        this.reset()
        this.rapid = rapid
    }

    /**
     * Saves the current matrix state and pushes it onto the stack.
     * Equivalent to context.save().
     * @returns The current step counter before saving.
     */
    save() {
        this.stack.push(this.curWorldM)
        const parentWorldM = this.curWorldM;

        this.step++;

        this.curLocalM = this.matrix.alloc(); // localM
        this.curWorldM = this.matrix.allocDirty(); // worldM
        this.stepWorldM.push(this.curWorldM)
        this.stepParentM.push(parentWorldM)

        this.matrix.copy(this.curWorldM, parentWorldM);
        this.stepAction.push(1)

        return { world: this.curWorldM, local: this.curLocalM, step: this.step }
    }

    /**
     * Restores the matrix state from the top of the stack.
     * Equivalent to context.restore().
     */
    restore() {
        if (this.stack.length == 0) {
            return;
        } else {
            this.curWorldM = this.stack.pop()
            this.curLocalM = this.curWorldM - 1

            this.stepAction.push(0)
        }
    }

    /**
     * Evaluates and updates matrices from the given step. Used primarily for deferred transformation.
     * @param step - The initial step to update matrices from.
     */
    updateMatrix(step: number | { step: number }) {
        // step is 1-indexed; the node's data is at index (step - 1) in stepWorldM/stepAction
        // Start from the node itself so its own world matrix gets recalculated
        const nodeIndex = (typeof step == "number" ? step : step.step) - 1
        const rootParent = this.stepParentM.get(nodeIndex)

        let depth = 0
        let index = nodeIndex

        const parentStack = this.parentStack
        parentStack.reset()
        parentStack.push(rootParent)
        while (index < this.stepAction.length) {
            const action = this.stepAction.get(index)

            if (action === 1) {
                const worldMatrix = this.stepWorldM.get(index)
                const localMatrix = worldMatrix - 1
                const parent = parentStack.top()

                this.matrix.multiplyOut(worldMatrix, parent, localMatrix)

                parentStack.push(worldMatrix)
                depth++
            } else {
                parentStack.pop()
                depth--
                if (depth === 0) {
                    break
                }
            }

            index++
        }
    }

    /**
     * Translates the current local and world matrices by x and y.
     * @param x - Translation along the x-axis.
     * @param y - Translation along the y-axis.
     */
    translate(x: number, y: number): void {
        this.matrix.translate(this.curLocalM, x, y);
        this.matrix.translate(this.curWorldM, x, y);
    }

    /**
     * Scales the current local and world matrices by scaleX and scaleY.
     * @param scaleX - Scaling factor along the x-axis.
     * @param scaleY - Scaling factor along the y-axis.
     */
    scale(scaleX: number, scaleY: number): void {
        this.matrix.scale(this.curLocalM, scaleX, scaleY);
        this.matrix.scale(this.curWorldM, scaleX, scaleY);
    }

    /**
     * Rotates the current local and world matrices by the given radians.
     * @param radians - The rotation angle in radians.
     */
    rotate(radians: number): void {
        this.matrix.rotate(this.curLocalM, radians);
        this.matrix.rotate(this.curWorldM, radians);
    }

    /**
     * Rotates the current local and world matrices around a pivot point
     * that is offset from the matrix origin by `(offsetX, offsetY)`.
     *
     * This is a convenience wrapper around the common translate → rotate → translate-back
     * pattern, avoiding manual coordinate juggling at the call site.
     *
     * @example
     * ```ts
     * // Rotate a 64×64 sprite around its centre
     * stack.rotateWithOffset(angle, 32, 32);
     * ```
     *
     * @param radians - The rotation angle in radians.
     * @param offsetX - The x component of the pivot point in local space.
     * @param offsetY - The y component of the pivot point in local space.
     */
    rotateWithOffset(radians: number, offsetX: number, offsetY: number): void {
        this.matrix.rotateWithOffset(this.curLocalM, radians, offsetX, offsetY);
        this.matrix.rotateWithOffset(this.curWorldM, radians, offsetX, offsetY);
    }

    /**
     * Sets the current local and world matrices to the identity matrix.
     */
    identity() {
        this.matrix.identity(this.curLocalM)
        this.matrix.identity(this.curWorldM)
    }

    /**
     * Resets the entire stack state context, clearing matrices and step actions.
     */
    reset(): void {
        this.matrix.reset();
        this.stack.reset();
        this.stepAction.reset();
        this.stepWorldM.reset();
        this.stepParentM.reset();
        this.step = 0;

        this.curLocalM = this.matrix.alloc(); // localM
        this.curWorldM = this.matrix.alloc(); // worldM
    }

    /**
     * Transforms a point from local coordinates to world coordinates.
     * Uses the current world matrix to apply the transformation.
     * @param x - Local x coordinate.
     * @param y - Local y coordinate.
     * @returns The transformed point in world coordinates.
     */
    localToWorld(x: number, y: number): { x: number, y: number } {
        return this.matrix.localToWorld(this.curWorldM, x, y);
    }

    /**
     * Transforms a point from world coordinates to local coordinates.
     * Useful for hit testing against objects placed in world space.
     * @param x - World x coordinate.
     * @param y - World y coordinate.
     * @returns The transformed point in local coordinates.
     */
    worldToLocal(x: number, y: number): { x: number, y: number } {
        return this.matrix.worldToLocal(this.curWorldM, x, y);
    }

    /**
     * Extracts the global position (translation) from the current world matrix.
     * @returns An object containing `x` and `y` global coordinates.
     */
    getGlobalPosition(): { x: number, y: number } {
        return this.matrix.getPosition(this.curWorldM);
    }

    /**
     * Extracts the global scale from the current world matrix.
     * @returns An object containing `x` and `y` global scale factors.
     */
    getGlobalScale(): { x: number, y: number } {
        return this.matrix.getScale(this.curWorldM);
    }

    /**
     * Extracts the global rotation (in radians) from the current world matrix.
     * @returns The global rotation in radians.
     */
    getGlobalRotation(): number {
        return this.matrix.getRotation(this.curWorldM);
    }

    toCSSMatrix(): string {
        return this.matrix.toCSSMatrix(this.curWorldM);
    }
}