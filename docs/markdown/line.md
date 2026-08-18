# Line Rendering

`drawLine` connects a series of points into a polyline with stroke width. Internally, it automatically generates triangle geometry based on vertices, line width, and miter joins, ensuring line joints are solid and free of gaps.

## Basic Usage

Pass an array of `Vec2` points as the path and specify line thickness using `width`.

```ts
import { Vec2, Color } from "rapid-render";

rapid.drawLine({
  points: Vec2.FromArray([
    [20, 20],
    [120, 80],
    [220, 30],
  ]),
  width: 8,
  color: new Color(84, 184, 234),
});
```

`points` requires at least two points. Providing fewer than two points draws nothing.

## Closed Paths

Setting `closed: true` connects the last point back to the first point, forming a closed polygon stroke outline.

```ts
rapid.drawLine({
  points: Vec2.FromArray([
    [60, 20],
    [120, 60],
    [95, 130],
    [25, 130],
    [0, 60],
  ]),
  width: 6,
  closed: true,
  color: new Color(95, 195, 122),
});
```

## Round Caps

Setting `roundCap: true` appends a semicircle at the start and end of the polyline, smoothing out endpoints. Closed paths have no open endpoints, so this option is inactive when `closed: true`.

```ts
rapid.drawLine({
  points: path,
  width: 12,
  roundCap: true,
  color: new Color(255, 143, 112),
});
```

## Textured Lines

Passing a `texture` maps a texture along the stroke path. `textureMode` controls how the texture stretches or tiles:

- `LineTextureMode.STRETCH`: Stretches the entire texture once across the full line length (default).
- `LineTextureMode.REPEAT`: Tiles the texture repeatedly based on line length—ideal for dashed lines, chains, or motion trails.

```ts
import { LineTextureMode, Vec2 } from "rapid-render";

const dash = await rapid.texture.load("./image/dash.png");
const path = Vec2.FromArray([[20, 20], [120, 80], [220, 30]]);

rapid.drawLine({
  points: path,
  width: 16,
  texture: dash,
  textureMode: LineTextureMode.REPEAT,
});
```

In `REPEAT` mode, tiling density depends on the original pixel width of the texture.
