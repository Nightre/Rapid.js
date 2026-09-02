import assert from "node:assert/strict";
import test from "node:test";

import {
    ArrayType,
    DynamicArrayBuffer,
    WebglBufferArray,
} from "../dist/rapid-render.js";

test("DynamicArrayBuffer automatically grows on push and preserves its data", () => {
    const buffer = new DynamicArrayBuffer(ArrayType.Uint32);

    // The initial capacity is 512. Crossing it must grow the backing store
    // to the next power-of-two capacity without losing existing elements.
    for (let i = 0; i < 600; i++) buffer.push(i);

    assert.equal(buffer.length, 600);
    assert.equal(buffer.getArray().length, 1024);
    assert.equal(buffer.get(0), 0);
    assert.equal(buffer.get(511), 511);
    assert.equal(buffer.get(512), 512);
    assert.equal(buffer.get(599), 599);
});

test("DynamicArrayBuffer.removeAtIndices compacts aligned buffers consistently", () => {
    const ids = new DynamicArrayBuffer(ArrayType.Uint32);
    const weights = new DynamicArrayBuffer(ArrayType.Float32);

    for (let i = 0; i < 6; i++) {
        ids.push(i + 10);
        weights.push(i + 0.5);
    }

    // Duplicates and out-of-range indices must be ignored. Valid indices are
    // sorted internally, while the remaining values retain their order.
    const removed = DynamicArrayBuffer.removeAtIndices(
        [4, 1, 4, -1, 99],
        [ids, weights],
    );

    assert.equal(removed, 2);
    assert.equal(ids.length, 4);
    assert.equal(weights.length, 4);
    assert.deepEqual(Array.from(ids.getArray(0, ids.length)), [10, 12, 13, 15]);
    assert.deepEqual(Array.from(weights.getArray(0, weights.length)), [0.5, 2.5, 3.5, 5.5]);
});

test("WebglBufferArray avoids redundant GPU uploads", () => {
    const calls = {
        allocations: [],
        uploads: [],
    };
    const gl = {
        ARRAY_BUFFER: 0x8892,
        DYNAMIC_DRAW: 0x88e8,
        createBuffer: () => ({}),
        bindBuffer() {},
        bufferData(type, size, usage) {
            calls.allocations.push({ type, size, usage });
        },
        bufferSubData(type, offset, data) {
            calls.uploads.push({ type, offset, data: Array.from(data) });
        },
    };

    const buffer = new WebglBufferArray(
        gl,
        ArrayType.Uint32,
        gl.ARRAY_BUFFER,
        gl.DYNAMIC_DRAW,
    );

    for (let i = 0; i < 600; i++) buffer.push(i);
    buffer.makeDirty();
    buffer.bufferData();

    assert.deepEqual(calls.allocations, [{
        type: gl.ARRAY_BUFFER,
        size: 1024 * Uint32Array.BYTES_PER_ELEMENT,
        usage: gl.DYNAMIC_DRAW,
    }]);
    assert.equal(calls.uploads.length, 1);
    assert.equal(calls.uploads[0].data.length, 600);

    buffer.bufferData();
    assert.equal(calls.allocations.length, 1);
    assert.equal(calls.uploads.length, 1);

    buffer.push(600);
    buffer.makeDirty();
    buffer.bufferData();

    assert.equal(calls.allocations.length, 1);
    assert.equal(calls.uploads.length, 2);
    assert.equal(calls.uploads[1].data.at(-1), 600);
});
