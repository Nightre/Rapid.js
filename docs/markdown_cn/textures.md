# 纹理

Texture 是 Rapid.js 里最常用的资源类型。图片、Canvas、Video、ImageBitmap、离屏 Canvas 都可以变成 Texture，然后交给 Rapid.js 绘制使用。

最常见的流程是：先用 `rapid.texture` 创建或加载纹理，再在每一帧把它画出来。

```ts
import { Rapid } from "rapid-render";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const rapid = new Rapid({ canvas });

const texture = await rapid.texture.load("./image/toycar.png");

rapid.clear();
rapid.drawSprite({
  texture,
  x: 120,
  y: 80,
});
rapid.flush();
```

## 加载图片

`rapid.texture.load(url)` 会异步加载图片，并自动把同一个 URL 对应的底层 GPU 纹理缓存起来。

```ts
const hero = await rapid.texture.load("./image/hero.png");
const toycar = await rapid.texture.load("./image/toycar.png");
```

## 从已有图像创建

如果你已经有了 `HTMLImageElement`、`ImageBitmap` 或 `OffscreenCanvas`，可以用 `rapid.texture.create(source)` 同步创建纹理。

```ts
const image = new Image();
image.src = "./image/tree.png";
await image.decode();

const tree = rapid.texture.create(image);
```

也可以给动态资源设置一个 `key`，让下次创建时复用缓存。

```ts
const player = rapid.texture.create(image, {
  key: "player-idle",
});

const cachedPlayer = rapid.texture.create(image, {
  key: "player-idle",
});
```

设置过 `key` 之后，`rapid.texture.load` 也会先查同一个缓存。下面这句不会再去请求 `"player-idle"` 这个地址，而是直接返回缓存里的纹理引用。

```ts
const cachedByKey = await rapid.texture.load("player-idle");
```

## 裁剪区域与子纹理

`setRegion(x, y, w, h)` 直接设置当前 Texture 显示哪一块图片。

```ts
const image = await rapid.texture.load("./image/sprites.png");

const idle = image.clone().setRegion(0, 0, 32, 32);
const run = image.clone().setRegion(32, 0, 32, 32);
```

`getSubTexture(x, y, width, height)` 返回一个新的 Texture，坐标相对当前 Texture。

```ts
const row = image.clone().setRegion(0, 64, 256, 32);

const frame0 = row.getSubTexture(0, 0, 32, 32);
const frame1 = row.getSubTexture(32, 0, 32, 32);
```

## 拆分网格

如果精灵图是规则网格，可以直接用 `splitGrid(cellWidth, cellHeight, cols?, rows?, gap?)`。

```ts
const sheet = await rapid.texture.load("./image/hero_run.png");
const frames = sheet.splitGrid(32, 32);
```

如果每个格子之间有间隔，把间隔像素传给 `gap`。

```ts
const frames = sheet.splitGrid(32, 32, 4, 2, 1);
```

没有传 `cols` 和 `rows` 时（若要使用 `gap` 可以在代码中传 `undefined` 占位），Rapid.js 会根据当前 Texture 的宽高自动向下取整。`gap` 会算进每个格子的步进距离里。

## 过滤与重复模式

创建纹理时可以通过 `textureFilter` 控制缩放采样，通过 `wrap` 控制 UV 超出 0 到 1 范围时如何取样。

```ts
import { TextureFilterMode, TextureWrapMode } from "rapid-render";

const pixelTexture = await rapid.texture.load("./image/pixel.png", {
  textureFilter: TextureFilterMode.NEAREST,
  wrap: TextureWrapMode.CLAMP,
});
```

- `TextureFilterMode.NEAREST` 适合像素风，边缘更硬。
- `TextureFilterMode.LINEAR` 适合普通图片，缩放时更平滑。
- `TextureWrapMode.CLAMP` 会把边缘像素延伸出去。
- `TextureWrapMode.REPEAT` 会重复平铺纹理。
- `TextureWrapMode.MIRRORED_REPEAT` 会镜像重复纹理。

## 更新动态纹理

Canvas 和 Video 常常会变化。已经创建好的纹理可以通过 `base.updateSource` 把新的像素重新上传到 GPU。

```ts
const dynamicCanvas = document.createElement("canvas");
dynamicCanvas.width = 128;
dynamicCanvas.height = 128;

const dynamicTexture = rapid.texture.create(dynamicCanvas);
const ctx = dynamicCanvas.getContext("2d")!;

function frame() {
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "red";
  ctx.fillRect(Math.random() * 96, 40, 32, 32);

  dynamicTexture.base?.updateSource(rapid.gl, dynamicCanvas);

  rapid.clear();
  rapid.drawSprite({ texture: dynamicTexture, x: 100, y: 80 });
  rapid.flush();

  requestAnimationFrame(frame);
}

frame();
```

## 预乘 Alpha

`premultipliedAlpha` 控制上传纹理时是否使用预乘 alpha。默认情况下会跟随 `Rapid` 实例的 `premultipliedAlpha` 设置。

```ts
const texture = await rapid.texture.load("./image/glow.png", {
  premultipliedAlpha: true,
});
```

一般图片保持默认即可。只有在你明确知道素材的 alpha 处理方式，或者在自定义混合效果里发现边缘颜色不对时，才需要调整它。

## 销毁纹理

不再使用纹理时，可以通过 `rapid.texture.destroy(texture)` 释放引用。Rapid.js 会记录底层 `BaseTexture` 被多少个 Texture 引用；引用数归零后才会真正删除 WebGL 纹理。

```ts
rapid.texture.destroy(tree);
```

如果你想按 URL 或 key 销毁缓存，也可以传字符串。

```ts
rapid.texture.destroy("./image/hero.png");
rapid.texture.destroy("player-idle");
```

第二个参数设为 `true` 会不考虑引用强制销毁底层资源。

```ts
rapid.texture.destroy("player-idle", true);
```

需要清空所有缓存时使用：

```ts
rapid.texture.destroyAll();
```
