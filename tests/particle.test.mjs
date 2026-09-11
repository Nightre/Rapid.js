import assert from "node:assert/strict";
import { test } from "vitest";

import { ArrayType, DynamicArrayBuffer } from "../src/buffer";
import { ParticleEmitter } from "../src/extensions/particle";
import { ParticleRegion } from "../src/region/particleRegion";

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

class TestParticleRegion extends ParticleRegion {
    renderedInstances = [];

    createBuffer() {
        this.quadBuffer = { bindBuffer() {} };
        this.instanceBuffer = new CpuInstanceBuffer();
    }

    createDefaultShader() {
        this.defaultShader = createShader();
        this.currentShader = this.defaultShader;
        return this.defaultShader;
    }

    render() {
        this.renderedInstances = Array.from(
            this.instanceBuffer.float32.slice(0, this.instanceBuffer.usedElemNum),
        );
        this.texture = undefined;
    }
}

const createParticleRegion = () => new TestParticleRegion({
    gl: {
        ARRAY_BUFFER: 0,
        STATIC_DRAW: 0,
        DYNAMIC_DRAW: 0,
        TEXTURE0: 0,
        TEXTURE_2D: 0,
        activeTexture() {},
        bindTexture() {},
    },
    maxTextureUnits: 16,
    matrix: {},
    projection: new Float32Array(16),
});

const atlasTexture = {
    glTexture: {},
    rawWidth: 64,
    rawHeight: 32,
    uvX: 0.25,
    uvY: 0.125,
    uvW: 0.375,
    uvH: 0.25,
};

test("ParticleEmitter removes expired particles and keeps its buffers aligned", () => {
    const rapid = { premultipliedAlpha: false };
    const options = {
        texture: {},
        life: 0.5,
        animation: { scale: 2 },
    };
    const emitter = new ParticleEmitter(rapid, options);

    emitter.emit(1);
    options.life = 1;
    options.animation.scale = 3;
    emitter.emit(1);

    emitter.update(0.5);

    assert.equal(emitter.count, 1);
    assert.equal(emitter.scaleX.get(0), 3);
    assert.ok(emitter.getAllArrayBuffer().every(buffer => buffer.length === 1));

    emitter.update(0.5);

    assert.equal(emitter.count, 0);
    assert.ok(emitter.getAllArrayBuffer().every(buffer => buffer.length === 0));
});

test("ParticleRegion keeps an atlas region at its logical size", () => {
    const region = createParticleRegion();

    region.drawParticles(
        atlasTexture,
        [0], [0], 0, 0xffffffff, 1, 1, 1,
        atlasTexture.uvX, atlasTexture.uvY, atlasTexture.uvW, atlasTexture.uvH,
        false, false, false, 0.5, 0.5, false,
    );

    assert.equal(region.renderedInstances[2], 64);
    assert.equal(region.renderedInstances[3], 32);
});

test("ParticleRegion sizes per-particle UVs relative to an atlas region", () => {
    const region = createParticleRegion();

    region.drawParticles(
        atlasTexture,
        [0], [0], 0, 0xffffffff, 1, 1, 1,
        [0.25], [0.125], [0.3125], [0.1875],
        false, false, false, 0.5, 0.5, false,
    );

    assert.equal(region.renderedInstances[2], 32);
    assert.equal(region.renderedInstances[3], 16);
});
