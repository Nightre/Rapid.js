# Custom Shaders

Custom shaders in Rapid.js do not replace the built-in shader entirely; instead, they inject your custom code into base shaders of regions like `Sprite`, `AtlasSprite`, and `Graphic`.

You need to provide two GLSL functions:

```glsl
void vertex(inout vec4 position, vec2 uv) {
  // Modify position. Rapid.js will continue multiplying by u_projection afterward.
}

void fragment(inout vec4 color) {
  // Modify color. color has already sampled the current Texture and multiplied by tint color by default.
}
```

## Basic Example

```ts
import { CustomGlShader } from "rapid-render";

const vs = `
void vertex(inout vec4 position, vec2 uv) {
}
`;

const fs = `
uniform float uTime;

void fragment(inout vec4 color) {
  color.rgb *= 0.5 + 0.5 * sin(uTime);
}
`;

const shader = new CustomGlShader(rapid, vs, fs, 0, {
  uTime: 0,
});

function frame(time: number) {
  shader.setUniforms({
    uTime: time / 1000,
  });

  rapid.clear();
  rapid.drawSprite({
    texture,
    shader,
    x: 160,
    y: 120,
  });
  rapid.flush();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

## Available Variables

In `vertex`:

- `position`: Current vertex position; can be modified directly.
- `uv`: Texture coordinate corresponding to the current vertex (`vRegion`).
- `u_projection`: Projection matrix used internally by Rapid.js.

In `fragment`:

- `color`: Current output fragment color.
- `vRegion`: Current global texture coordinates.
- `vUVRect`: UV bounds of the current `Texture`.
- `vColor`: Tint color passed from `drawSprite`.
- `sampleTexture(uv)`: Samples the current `Texture`.
- `sampleClampTexture(uv)`: Samples the current `Texture`, returning transparent `vec4(0.0)` when out of `vUVRect`.
- `sampleTextureLocal(uv)`: Maps local [0..1] UVs to the sub-region UV range of the texture.

## Uniforms

`GLShader` parses uniform types from GLSL automatically, allowing `setUniforms` to take standard JavaScript values directly.

```ts
const fs = `
uniform float uAmount;
uniform vec4 uTint;

void fragment(inout vec4 color) {
  color.rgb = mix(color.rgb, uTint.rgb, uAmount);
}
`;

const shader = new CustomGlShader(rapid, vs, fs, 0, {
  uAmount: 0.5,
  uTint: [1, 0, 0, 1],
});

shader.setUniforms({
  uAmount: 0.8,
  uTint: [0, 0.5, 1, 1],
});
```

Supported uniform types:

- `float` / `int` / `bool`
- `vec2` / `vec3` / `vec4`
- `ivec2` / `ivec3` / `ivec4`
- `mat2` / `mat3` / `mat4`
- `sampler2D`

## Additional Textures

If your custom shader requires extra `sampler2D` uniforms, specify the number of occupied texture units in the 4th constructor argument `usedTextureUnitNum`.

```ts
const noise = await rapid.texture.load("./image/noise.png");

const fs = `
uniform sampler2D uNoise;

void fragment(inout vec4 color) {
  vec4 noiseColor = texture(uNoise, vRegion * 4.0);
  color.rgb *= noiseColor.rgb;
}
`;

const shader = new CustomGlShader(rapid, vs, fs, 1);

shader.setUniforms({
  uNoise: noise.glTexture!,
});
```

`usedTextureUnitNum` reserves GPU texture units, preventing sprite batching from consuming all available units.

## Padding

Certain effects sample pixels beyond the sprite quad bounds (such as outline, glow, or blur). Set `padding` on the shader to expand the quad drawing area.

```ts
const outlineFs = `
uniform vec4 uOutlineColor;
uniform vec2 uTexel;

void fragment(inout vec4 color) {
  float a = color.a;
  a = max(a, sampleClampTexture(vRegion + vec2( uTexel.x, 0.0)).a);
  a = max(a, sampleClampTexture(vRegion + vec2(-uTexel.x, 0.0)).a);
  a = max(a, sampleClampTexture(vRegion + vec2(0.0,  uTexel.y)).a);
  a = max(a, sampleClampTexture(vRegion + vec2(0.0, -uTexel.y)).a);

  if (color.a == 0.0 && a > 0.0) {
    color = uOutlineColor;
  }
}
`;

const outline = new CustomGlShader(rapid, vs, outlineFs, 0, {
  uOutlineColor: [1, 0, 0, 1],
  uTexel: [1 / texture.rawWidth, 1 / texture.rawHeight],
}).setPadding(1);

rapid.drawSprite({
  texture,
  shader: outline,
  x: 160,
  y: 120,
});
```

`setPadding(pixels)` propagates padding to all compiled Region shaders. You can also pass `padding` per call inside `drawSprite`.

## Filters

`rapid.applyFilters(texture, shaders)` renders a chain of `CustomGlShader` instances sequentially into reusable internal `RenderTexture` passes—ideal for post-processing filter chains.

```ts
const result = rapid.applyFilters(texture, [
  outline,
  glow,
]);

rapid.drawSprite({
  texture: result,
  x: 160,
  y: 120,
});
```

`applyFilters` expands the render texture size according to the shader `padding` and returns the final result as a `RenderTexture`.

## GLShader

`GLShader` is a lower-level wrapper. It accepts full vertex and fragment shader GLSL sources, parses attributes/uniforms automatically, and dispatches `gl.uniform*` calls.

```ts
import { GLShader } from "rapid-render";

const shader = new GLShader(rapid.gl, vsSource, fsSource, [
  { name: "aPosition", size: 2, stride: 8, offset: 0 },
]);

shader.use();
shader.setUniform("uTime", 1.0);
shader.setUniforms({
  uResolution: [rapid.logicWidth, rapid.logicHeight],
});
```

`CustomGlShader` is recommended for general rendering. Direct `GLShader` usage is only needed when managing vertex attributes/VAOs manually or building custom Region renderers.
