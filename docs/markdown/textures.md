# Textures

`Texture` is the most commonly used resource type in Rapid.js. Images, `ImageBitmap`, or `OffscreenCanvas` can all be turned into `Texture` instances and rendered with Rapid.js.

The most typical workflow is: create or load a texture using `rapid.texture`, then draw it in every frame.

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

## Loading Images

`rapid.texture.load(url)` asynchronously loads an image and automatically caches the underlying GPU texture associated with that URL.

```ts
const hero = await rapid.texture.load("./image/hero.png");
const toycar = await rapid.texture.load("./image/toycar.png");
```

## Creating from Existing Images

If you already have an `HTMLImageElement`, `ImageBitmap`, or `OffscreenCanvas`, you can create a texture synchronously using `rapid.texture.create(source)`.

```ts
const image = new Image();
image.src = "./image/tree.png";
await image.decode();

const tree = rapid.texture.create(image);
```

You can also assign a `key` to dynamic resources so that subsequent creations reuse the cached texture.

```ts
const player = rapid.texture.create(image, {
  key: "player-idle",
});

const cachedPlayer = rapid.texture.create(image, {
  key: "player-idle",
});
```

Once a `key` is set, `rapid.texture.load` will also check the same cache first. The line below will not fetch `"player-idle"` as a URL, but return the cached texture reference directly.

```ts
const cachedByKey = await rapid.texture.load("player-idle");
```

## Clipping Region & Sub-Textures

`setRegion(x, y, w, h)` directly specifies which sub-region of the image the current `Texture` displays.

```ts
const image = await rapid.texture.load("./image/sprites.png");

const idle = image.clone().setRegion(0, 0, 32, 32);
const run = image.clone().setRegion(32, 0, 32, 32);
```

`getSubTexture(x, y, width, height)` returns a new `Texture` with coordinates relative to the current `Texture`.

```ts
const row = image.clone().setRegion(0, 64, 256, 32);

const frame0 = row.getSubTexture(0, 0, 32, 32);
const frame1 = row.getSubTexture(32, 0, 32, 32);
```

## Splitting Grids

If your sprite sheet is a regular grid, you can use `splitGrid(cellWidth, cellHeight, cols?, rows?, gap?)` directly.

```ts
const sheet = await rapid.texture.load("./image/hero_run.png");
const frames = sheet.splitGrid(32, 32);
```

If there is spacing between grid cells, pass the gap size in pixels to `gap`.

```ts
const frames = sheet.splitGrid(32, 32, 4, 2, 1);
```

When `cols` and `rows` are omitted (you can pass `undefined` as a placeholder if you need to pass `gap`), Rapid.js automatically calculates grid dimensions by flooring based on the Texture size. `gap` is factored into the step stride of each cell.

## Filter & Wrap Modes

When creating textures, you can control scaling sampling via `textureFilter`, and UV sampling behavior beyond 0..1 via `wrap`.

```ts
import { TextureFilterMode, TextureWrapMode } from "rapid-render";

const pixelTexture = await rapid.texture.load("./image/pixel.png", {
  textureFilter: TextureFilterMode.NEAREST,
  wrap: TextureWrapMode.CLAMP,
});
```

- `TextureFilterMode.NEAREST`: Ideal for pixel art, crisp edges.
- `TextureFilterMode.LINEAR`: Ideal for regular images, smooth scaling.
- `TextureWrapMode.CLAMP`: Clamps edge pixels outwards.
- `TextureWrapMode.REPEAT`: Repeats the texture in a grid tile pattern.
- `TextureWrapMode.MIRRORED_REPEAT`: Repeats the texture with alternating mirror reflections.

## Updating Dynamic Textures

Canvas and Video elements change frequently. Already created textures can re-upload new pixel data to the GPU using `base.updateSource`.

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

## Premultiplied Alpha

`premultipliedAlpha` controls whether textures use premultiplied alpha when uploaded. By default, it inherits the setting from the `Rapid` instance.

```ts
const texture = await rapid.texture.load("./image/glow.png", {
  premultipliedAlpha: true,
});
```

Standard images can keep the default. You only need to adjust it if you know your asset's alpha handling explicitly or notice edge discoloration in custom blending effects.

## Destroying Textures

When textures are no longer needed, call `rapid.texture.destroy(texture)` to release references. Rapid.js tracks how many `Texture` instances reference an underlying `BaseTexture`; the WebGL texture is deleted only when reference count reaches zero.

```ts
rapid.texture.destroy(tree);
```

You can also pass a URL string or key to destroy cache entries:

```ts
rapid.texture.destroy("./image/hero.png");
rapid.texture.destroy("player-idle");
```

Setting the second parameter to `true` forcibly destroys the underlying GPU resource regardless of reference count:

```ts
rapid.texture.destroy("player-idle", true);
```

To clear all cached textures:

```ts
rapid.texture.destroyAll();
```
