import assert from "node:assert/strict";
import test from "node:test";

import {
    BaseTexture,
    Texture,
    TextureManager,
} from "../dist/rapid-render.js";

const createBase = (width = 64, height = 32) => {
    const glTexture = {};
    return {
        base: new BaseTexture(glTexture, width, height),
        glTexture,
    };
};

test("Texture construction and destruction maintain BaseTexture.refCount", () => {
    const { base, glTexture } = createBase();
    const first = new Texture(base);
    const second = new Texture(base);

    assert.equal(base.refCount, 2);
    assert.equal(first.base, base);
    assert.equal(first.glTexture, glTexture);
    assert.equal(first.rawWidth, 64);
    assert.equal(first.rawHeight, 32);

    // Reassigning the same base must not increment the count again.
    first.setBase(base);
    assert.equal(base.refCount, 2);

    first.destroy();
    assert.equal(base.refCount, 1);
    assert.equal(first.base, undefined);
    assert.equal(first.glTexture, null);
    assert.equal(base.glTexture, glTexture);

    // destroy() is idempotent from the reference-count perspective.
    first.destroy();
    assert.equal(base.refCount, 1);

    second.destroy();
    assert.equal(base.refCount, 0);
    assert.equal(base.glTexture, glTexture);
});

test("Texture.setBase transfers its reference between BaseTextures", () => {
    const first = createBase();
    const second = createBase(128, 48);
    const texture = new Texture(first.base);

    texture.setBase(second.base);

    assert.equal(first.base.refCount, 0);
    assert.equal(second.base.refCount, 1);
    assert.equal(texture.base, second.base);
    assert.equal(texture.glTexture, second.glTexture);
    assert.equal(texture.rawWidth, 128);
    assert.equal(texture.rawHeight, 48);

    texture.setBase(second.base);
    assert.equal(second.base.refCount, 1);

    texture.destroy();
    assert.equal(second.base.refCount, 0);
});

test("clone, target clone and sub-textures share exactly one BaseTexture reference each", () => {
    const shared = createBase(128, 128);
    const other = createBase(16, 16);
    const source = new Texture(shared.base).setRegion(16, 24, 64, 48);
    const clone = source.clone();
    const subTexture = source.getSubTexture(4, 6, 20, 10);
    const target = new Texture(other.base);

    source.clone(target);

    assert.equal(shared.base.refCount, 4);
    assert.equal(other.base.refCount, 0);
    assert.equal(clone.base, shared.base);
    assert.equal(subTexture.base, shared.base);
    assert.equal(target.base, shared.base);

    // Cloning into the same target again must not leak another reference.
    source.clone(target);
    assert.equal(shared.base.refCount, 4);

    clone.destroy();
    subTexture.destroy();
    target.destroy();
    source.destroy();
    assert.equal(shared.base.refCount, 0);
});

test("TextureManager deletes the GPU BaseTexture only after the final reference", () => {
    const deletedTextures = [];
    const render = {
        gl: {
            deleteTexture(texture) {
                deletedTextures.push(texture);
            },
        },
    };
    const manager = new TextureManager(render);
    const { base, glTexture } = createBase();
    const first = new Texture(base);
    const second = new Texture(base);

    manager.destroy(first);

    assert.equal(base.refCount, 1);
    assert.equal(base.glTexture, glTexture);
    assert.deepEqual(deletedTextures, []);

    manager.destroy(second);

    assert.equal(base.refCount, 0);
    assert.equal(base.glTexture, null);
    assert.deepEqual(deletedTextures, [glTexture]);

    // The BaseTexture is already empty, so repeated cleanup cannot double-delete.
    manager.destroy(base);
    assert.deepEqual(deletedTextures, [glTexture]);
});
