import assert from "node:assert/strict";
import test from "node:test";

import { ArrayType, WebglBufferArray } from "../dist/rapid-render.js";

test("WebglBufferArray grows without losing data and avoids redundant uploads", () => {
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

    assert.equal(buffer.length, 600);
    assert.equal(buffer.get(0), 0);
    assert.equal(buffer.get(511), 511);
    assert.equal(buffer.get(599), 599);
    assert.deepEqual(calls.allocations, [{
        type: gl.ARRAY_BUFFER,
        size: 1024 * Uint32Array.BYTES_PER_ELEMENT,
        usage: gl.DYNAMIC_DRAW,
    }]);
    assert.equal(calls.uploads.length, 1);
    assert.equal(calls.uploads[0].data.length, 600);

    // Clean buffers must not be sent to the GPU again.
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
