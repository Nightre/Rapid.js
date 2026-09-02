import assert from "node:assert/strict";
import test from "node:test";

import {
    ArrayType,
    DynamicArrayBuffer,
    MatrixStore,
    SpriteRegion,
} from "../dist/rapid-render.js";

class CpuInstanceBuffer extends DynamicArrayBuffer {
    constructor() {
        super(ArrayType.Uint32);
    }

    bindBuffer() {}
    bufferData() {}
    makeDirty() {}
}

const shader = () => ({
    use() {},
    bindVAO() {},
    unbindVAO() {},
    setAttributes() {},
    setUniform() {},
});

class TestSpriteRegion extends SpriteRegion {
    createBuffer() {
        this.quadBuffer = { bindBuffer() {} };
        this.instanceBuffer = new CpuInstanceBuffer();
    }

    createDefaultShader() {
        this.defaultShader = shader();
        this.currentShader = this.defaultShader;
        return this.defaultShader;
    }
}

const makeTexture = (glTexture) => ({
    base: { width: 16, height: 16 },
    glTexture,
    rawWidth: 16,
    rawHeight: 16,
    offsetX: 0,
    offsetY: 0,
});

test("SpriteRegion flushes once when a texture batch exceeds the available slots", () => {
    const draws = [];
    const boundTextures = [];
    const gl = {
        TRIANGLE_STRIP: 0x0005,
        TEXTURE0: 0x84c0,
        TEXTURE_2D: 0x0de1,
        activeTexture() {},
        bindTexture(_target, texture) {
            boundTextures.push(texture);
        },
        bindVertexArray() {},
        drawArraysInstanced(mode, first, count, instanceCount) {
            draws.push({ mode, first, count, instanceCount });
        },
    };
    const rapid = {
        gl,
        maxTextureUnits: 2,
        matrix: new MatrixStore(),
        projection: new Float32Array(16),
        roundPixels: false,
        drawcallCount: 0,
    };
    const region = new TestSpriteRegion(rapid);
    region.enter();

    const textureA = {};
    const textureB = {};
    const textureC = {};

    for (const texture of [textureA, textureB, textureC]) {
        region.drawSpriteAffine(
            makeTexture(texture),
            1, 0, 0, 1, 0, 0,
        );
    }
    region.flush();

    assert.equal(rapid.drawcallCount, 2);
    assert.deepEqual(draws, [
        { mode: gl.TRIANGLE_STRIP, first: 0, count: 4, instanceCount: 2 },
        { mode: gl.TRIANGLE_STRIP, first: 0, count: 4, instanceCount: 1 },
    ]);
    assert.deepEqual(boundTextures, [textureA, textureB, textureC]);
});
