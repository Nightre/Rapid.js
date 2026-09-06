import assert from "node:assert/strict";
import test from "node:test";

import * as api from "../dist/rapid-render.js";

const runtimeExports = [
    "BlendMode",
    "CanvasScaleMode",
    "Color",
    "CustomGlShader",
    "GLShader",
    "LineTextureMode",
    "MaskType",
    "ParticleEmitter",
    "ParticleShape",
    "Rapid",
    "RenderTexture",
    "TextTexture",
    "Texture",
    "TextureFilterMode",
    "TextureWrapMode",
    "Vec2",
];

test("public entry exposes only the supported runtime API", () => {
    assert.deepEqual(Object.keys(api).sort(), runtimeExports);
});

test("Color bulk mutations keep packed values in sync", () => {
    const color = new api.Color(0, 0, 0, 0);
    color.setRGBA(300, -1, 128, 128);
    color.clamp();

    assert.deepEqual([color.r, color.g, color.b, color.a], [255, 0, 128, 128]);
    assert.equal(color.uint32, 0x808000ff);
    assert.equal(color.premultipliedUint32, 0x80400080);
});
