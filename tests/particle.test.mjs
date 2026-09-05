import assert from "node:assert/strict";
import test from "node:test";

import { ParticleEmitter } from "../dist/rapid-render.js";

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
