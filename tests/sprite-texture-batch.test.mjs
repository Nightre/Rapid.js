import assert from "node:assert/strict";
import { test } from "vitest";

import { ArrayType, DynamicArrayBuffer } from "../src/buffer";
import { MatrixStack, MatrixStore } from "../src/matrix-engine";
import { Rapid } from "../src/render";
import { SpriteRegion } from "../src/region/spriteRegion";
import { TextTexture, Texture } from "../src/texture";
import { drawSprite } from "../src/draw";

class CpuInstanceBuffer extends DynamicArrayBuffer {
    constructor() {
        super(ArrayType.Uint32);
    }

    bindBuffer() {}
    bufferData() {}
    makeDirty() {}
}

const createShader = () => ({
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
        this.defaultShader = createShader();
        this.currentShader = this.defaultShader;
        return this.defaultShader;
    }
}

const makeTexture = (glTexture) => Object.assign(new Texture(), {
    base: { width: 16, height: 16 },
    glTexture,
    rawWidth: 16,
    rawHeight: 16,
    offsetX: 0,
    offsetY: 0,
});

const createHarness = () => {
    const draws = [];
    const boundTextures = [];
    const gl = {
        TRIANGLE_STRIP: 0x0005,
        TEXTURE0: 0x84c0,
        TEXTURE_2D: 0x0de1,
        activeTexture() {},
        bindTexture(_target, texture) {
            // Region cleanup unbinds every occupied slot. The assertions below
            // describe texture assignment, so retain only actual bindings.
            if (texture !== null) boundTextures.push(texture);
        },
        bindVertexArray() {},
        drawArraysInstanced(mode, first, count, instanceCount) {
            draws.push({ mode, first, count, instanceCount });
        },
    };
    const rapid = {
        gl,
        maxTextureUnits: 16,
        matrix: new MatrixStore(),
        projection: new Float32Array(16),
        roundPixels: false,
        drawcallCount: 0,
        currentRegion: null,
        flush: Rapid.prototype.flush,
        enterRegion: Rapid.prototype.enterRegion,
        getColorUint32: () => 0xFFFFFFFF,
    };
    rapid.matrixStack = new MatrixStack(rapid);
    rapid.matrix = rapid.matrixStack.matrix;
    const spriteRegion = new TestSpriteRegion(rapid);
    rapid.spriteRegion = spriteRegion;

    const drawTextures = (textures) => {
        rapid.enterRegion(spriteRegion);
        for (const texture of textures) {
            spriteRegion.drawSpriteAffine(
                makeTexture(texture),
                1, 0, 0, 1, 0, 0,
            );
        }
    };

    return { rapid, spriteRegion, draws, boundTextures, drawTextures, gl };
};

test("SpriteRegion batches 16 different textures into one draw call", () => {
    const harness = createHarness();
    const textures = Array.from({ length: 16 }, () => ({}));

    harness.drawTextures(textures);
    harness.rapid.flush();

    assert.equal(harness.rapid.drawcallCount, 1);
    assert.deepEqual(harness.draws, [{
        mode: harness.gl.TRIANGLE_STRIP,
        first: 0,
        count: 4,
        instanceCount: 16,
    }]);
    assert.deepEqual(harness.boundTextures, textures);
});

const makeDirtyTexture = () => {
    let updates = 0;
    const texture = Object.assign(makeTexture({}), {
        dirty: true,
        ensureUpdated: TextTexture.prototype.ensureUpdated,
        update() {
            updates++;
            this.rawWidth = 64;
            this.rawHeight = 32;
            this.offsetX = 2;
            this.offsetY = 3;
            this.dirty = false;
        },
    });
    return { texture, getUpdates: () => updates };
};

test("direct SpriteRegion drawing uses updated dimensions and offsets", () => {
    const { rapid, spriteRegion } = createHarness();
    const { texture, getUpdates } = makeDirtyTexture();
    rapid.enterRegion(spriteRegion);

    spriteRegion.drawSpriteAffine(texture, 1, 0, 0, 1, 0, 0);
    const instance = spriteRegion.instanceBuffer.float32;
    assert.equal(instance[0], 64);
    assert.equal(instance[4], 32);
    assert.equal(instance[2], 2);
    assert.equal(instance[5], 3);
    assert.equal(getUpdates(), 1);
});

test("drawSprite computes origin from updated dimensions without a second upload", () => {
    const { rapid, spriteRegion } = createHarness();
    const { texture, getUpdates } = makeDirtyTexture();

    drawSprite(rapid, { texture, origin: 0.5 });
    const instance = spriteRegion.instanceBuffer.float32;
    assert.equal(instance[0], 64);
    assert.equal(instance[4], 32);
    assert.equal(instance[2], -30);
    assert.equal(instance[5], -13);
    assert.equal(getUpdates(), 1);
});

test("SpriteRegion splits 17 different textures at the 16-slot boundary", () => {
    const harness = createHarness();
    const textures = Array.from({ length: 17 }, () => ({}));

    harness.drawTextures(textures);
    harness.rapid.flush();

    assert.equal(harness.rapid.drawcallCount, 2);
    assert.deepEqual(
        harness.draws.map(draw => draw.instanceCount),
        [16, 1],
    );
    assert.deepEqual(harness.boundTextures, textures);
});

test("SpriteRegion reuses two texture slots across many sprites", () => {
    const harness = createHarness();
    const textureA = {};
    const textureB = {};
    const textures = Array.from(
        { length: 200 },
        (_, index) => index % 2 === 0 ? textureA : textureB,
    );

    harness.drawTextures(textures);
    harness.rapid.flush();

    assert.equal(harness.rapid.drawcallCount, 1);
    assert.deepEqual(harness.draws.map(draw => draw.instanceCount), [200]);
    assert.deepEqual(harness.boundTextures, [textureA, textureB]);
});

test("switching to another region closes and isolates the current sprite batch", () => {
    const harness = createHarness();
    const beforeSwitch = Array.from({ length: 8 }, () => ({}));
    const afterSwitch = Array.from({ length: 9 }, () => ({}));
    const otherRegion = {
        enterCount: 0,
        exitCount: 0,
        enter() {
            this.enterCount++;
        },
        exit() {
            this.exitCount++;
        },
        isSameShader() {
            return true;
        },
    };

    harness.drawTextures(beforeSwitch);
    harness.rapid.enterRegion(otherRegion);
    harness.drawTextures(afterSwitch);
    harness.rapid.flush();

    assert.equal(otherRegion.enterCount, 1);
    assert.equal(otherRegion.exitCount, 1);
    assert.equal(harness.rapid.drawcallCount, 2);
    assert.deepEqual(harness.draws.map(draw => draw.instanceCount), [8, 9]);
    assert.deepEqual(
        harness.boundTextures,
        [...beforeSwitch, ...afterSwitch],
    );
});
