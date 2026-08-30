# Sprites

A sprite draws a `Texture` onto the canvas. The API method is `rapid.drawSprite(options)`.

## Basic Example

```ts
const texture = await rapid.texture.load("./image/player.png");

rapid.clear();
rapid.drawSprite({
  texture,
  x: 160,
  y: 120,
});
rapid.flush();
```

`drawSprite` does not submit work to the GPU immediately; it enters the rendering queue first. Typically, you call `drawSprite` many times per frame and finish with a single `rapid.flush()` call.

## Options

`drawSprite` accepts the following options, with `texture` being the only required parameter:

```ts
import { Color, Vec2 } from "rapid-render";

rapid.drawSprite({
  texture,                              // Texture to render

  x: 160,                               // x position
  y: 120,                               // y position
  // position: new Vec2(160, 120),         Can also pass position via Vec2

  rotation: Math.PI / 4,                // Rotation angle in radians
  scale: new Vec2(2, 1),                // Scale. Can also pass a single number: scale: 2

  origin: new Vec2(0.5, 1),             // Anchor/origin. Can also pass a single number: origin: 0.5

  offsetX: -8,                          // Pixel offset X
  offsetY: -4,                          // Pixel offset Y
  // offset: new Vec2(-8, -4),             Can also pass offset via Vec2

  flipX: true,                          // Horizontal flip
  flipY: false,                         // Vertical flip

  color: new Color(255, 255, 255, 180), // Color tinting and opacity; white leaves original image unchanged

  shader: customShader,                 // Custom shader
  customMatrix: matrixIndex,            // Specify custom matrix index directly

  modifyStack: false,                    // Whether to modify the matrix stack; defaults to false
});
```

## Padding

`padding` expands the drawing quad of the Sprite outward by a specified number of pixels. Normal images usually do not require padding; it is useful when filters or custom shaders sample near texture edges (e.g. creating an `Outline Shader`).

```ts
rapid.drawSprite({
  texture,
  x: 160,
  y: 120,
  padding: 2,
});
```

## Animated Frames

Sprite animation is usually achieved by switching `Texture` instances per frame.

```ts
const sheet = await rapid.texture.load("./image/player_run.png");
const frames = sheet.splitGrid(32, 32, 6, 1, 1);

let index = 0;

function frame() {
  index = (index + 1) % frames.length;

  rapid.clear();
  rapid.drawSprite({
    texture: frames[index],
    x: 160,
    y: 120,
    origin: 0.5,
  });
  rapid.flush();

  requestAnimationFrame(frame);
}

frame();
```
