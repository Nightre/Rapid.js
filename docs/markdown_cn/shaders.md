# 自定义 Shaders

Rapid.js 的自定义 shader 不是整段替换内置 shader，而是把你的代码插进 Sprite、AtlasSprite、Graphic 这些 Region 的基础 shader 里。

你需要提供两个函数：

```glsl
void vertex(inout vec4 position, vec2 uv) {
  // 修改 position。最后 Rapid.js 会继续乘 u_projection。
}

void fragment(inout vec4 color) {
  // 修改 color。color 默认已经采样了当前 Texture 并乘过 tint color。
}
```

## 基础例子

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

## 可用变量

在 `vertex` 里：

- `position`：当前顶点位置，可以直接修改。
- `uv`：当前像素对应的纹理坐标，也就是 `vRegion`。
- `u_projection`：Rapid.js 内部使用的投影矩阵。

在 `fragment` 里：

- `color`：当前输出颜色。
- `vRegion`：当前纹理坐标。
- `vUVRect`：当前 Texture 的 UV 范围。
- `vColor`：drawSprite 传入的 tint color。
- `sampleTexture(uv)`：采样当前 Texture。
- `sampleClampTexture(uv)`：采样当前 Texture，超出 `vUVRect` 时返回透明。
- `sampleTextureLocal(uv)`：若有纹理设置了 Region 采样当前 Region 的Texture。

## Uniforms

`GLShader` 会从最终 GLSL 里自动解析 uniform 类型，所以 `setUniforms` 只需要传普通 JS 值。

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

支持的常用类型：

- `float` / `int` / `bool`
- `vec2` / `vec3` / `vec4`
- `ivec2` / `ivec3` / `ivec4`
- `mat2` / `mat3` / `mat4`
- `sampler2D`

## 额外纹理

如果自定义 shader 里要用额外的 `sampler2D`，构造函数的第 4 个参数 `usedTextureUnitNum` 要写上占用的纹理数量。

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

`usedTextureUnitNum` 会预留纹理单元，避免 Sprite 批处理时把所有纹理单元用完。

## Padding

有些效果需要采样 Sprite 外围的像素，比如描边、发光、模糊。这个时候要给 shader 设置 padding，让绘制范围向外扩。

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

`setPadding(pixels)` 会把这个 padding 传给所有已经编译过的 Region shader。也可以在 `drawSprite` 时单独传 `padding`。

## Filters

`rapid.applyFilters(texture, shaders)` 会把一组 `CustomGlShader` 按顺序画进内部复用的 RenderTexture。适合做后处理链。

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

`applyFilters` 会根据 shader 的 `padding` 扩大 RenderTexture，并把最后的结果作为一个 `RenderTexture` 返回。

## GLShader

`GLShader` 是更底层的封装。它接收完整的 vertex shader 和 fragment shader，自动解析 attribute 和 uniform，然后帮你调用正确的 `gl.uniform*`。

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

普通绘制用 `CustomGlShader` 就够了。只有在你要自己管理 attribute、VAO 或写新的 Region 时，才需要直接用 `GLShader`。
