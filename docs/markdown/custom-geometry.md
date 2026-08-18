# Custom Geometry

In addition to sprites, Rapid.js provides simple and intuitive methods for rendering common geometric shapes (such as rectangles, circles, and lines), while also allowing you to submit arbitrary custom vertices directly.

## Built-in Shape Drawing Functions

For common geometric shapes, Rapid provides out-of-the-box high-level drawing functions.

```ts
import { Color } from "rapid-render";

// Basic rectangle
rapid.drawRect({
  x: 50,
  y: 50,
  width: 120,
  height: 80,
  color: new Color(84, 184, 234),
});

// Basic circle
rapid.drawCircle({
  x: 100,
  y: 100,
  radius: 40,
  color: new Color(95, 195, 122),
});
```

## drawGraphic

When you need to draw more complex shapes, passing an array of vertex points to `drawGraphic` is the easiest method. By default, it renders using `gl.TRIANGLES`.

```ts
import { Vec2, Color } from "rapid-render";

rapid.drawGraphic({
  points: Vec2.FromArray([
    [0, 0],
    [120, 0],
    [60, 100],
  ]),
  color: new Color(84, 184, 234),
});
```

`points` can be `Vec2` instances or plain `{ x, y }` objects.

## Primitive Draw Mode: drawMode

`drawMode` maps directly to WebGL primitive types. Triangle fans are especially suited for convex polygons.

```ts
rapid.drawGraphic({
  drawMode: rapid.gl.TRIANGLE_FAN,
  points: Vec2.FromArray([
    [60, 0],
    [120, 40],
    [95, 110],
    [25, 110],
    [0, 40],
  ]),
  color: new Color(95, 195, 122),
});
```

Commonly used primitive modes include `gl.TRIANGLES`, `gl.TRIANGLE_FAN`, and `gl.TRIANGLE_STRIP`.

## Per-Vertex Colors

Passing a single `Color` to `color` colors the entire geometry uniformly; passing a `Color[]` array maps colors to vertices in sequence, creating color gradients.

```ts
rapid.drawGraphic({
  drawMode: rapid.gl.TRIANGLES,
  points: Vec2.FromArray([
    [0, 0],
    [120, 0],
    [60, 100],
  ]),
  color: [
    new Color(255, 143, 112),
    new Color(84, 184, 234),
    new Color(95, 195, 122),
  ],
});
```

## Applying Textures

When passing a `texture`, you can specify texture UV coordinates (0 to 1) for each vertex via `uv`. Omitted `uv` entries default all vertices to `(0, 0)`.

```ts
const texture = await rapid.texture.load("./image/toycar.png");

rapid.drawGraphic({
  drawMode: rapid.gl.TRIANGLE_FAN,
  texture,
  points: Vec2.FromArray([
    [0, 0],
    [128, 0],
    [128, 128],
    [0, 128],
  ]),
  uv: Vec2.FromArray([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]),
});
```

## Lower Level: startGraphic / addGraphicVertex / endGraphic

`drawGraphic` encapsulates these three steps internally. When generating vertices dynamically inside a loop or trying to avoid allocating vertex arrays per frame, you can use the lower-level API directly.

```ts
rapid.startGraphic(rapid.gl.TRIANGLE_FAN, texture);

const segments = 24;
for (let i = 0; i < segments; i++) {
  const angle = (i / segments) * Math.PI * 2;
  const x = Math.cos(angle) * 80;
  const y = Math.sin(angle) * 80;
  const u = 0.5 + Math.cos(angle) * 0.5;
  const v = 0.5 + Math.sin(angle) * 0.5;
  rapid.addGraphicVertex(x, y, u, v);
}

rapid.endGraphic();
```

The engine also provides two built-in vertex helper methods for use alongside `startGraphic` / `endGraphic`:

```ts
rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
rapid.addRectVertex(120, 80, new Color(84, 184, 234)); // 4 rectangle vertices
rapid.endGraphic();

rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
rapid.addCircleVertex(60, new Color(95, 195, 122), 48); // Circle with radius 60 and 48 segments
rapid.endGraphic();
```
