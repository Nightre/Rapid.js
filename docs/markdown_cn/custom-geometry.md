# 自定义图形

除了精灵，Rapid.js 还提供了简单直观的常用几何图形绘制方法（如矩形、圆形、线条），同时也允许你直接提交任意顶点。

## 预制形状绘制函数
对于最常见的几何图形，Rapid 提供了开箱即用的高阶绘制函数。

```ts
import { Color } from "rapid-render";

// 基础绘制
rapid.drawRect({
  x: 50,
  y: 50,
  width: 120,
  height: 80,
  color: new Color(84, 184, 234),
});

// 基础圆形
rapid.drawCircle({
  x: 100,
  y: 100,
  radius: 40,
  color: new Color(95, 195, 122),
});
```

## drawGraphic

需要绘制更复杂的图形时，最简单的方式是把一组顶点传给 `drawGraphic`。默认按 `gl.TRIANGLES` 绘制。

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

`points` 可以是 `Vec2`，也可以是普通的 `{ x, y }` 对象。

## 绘制模式 drawMode

`drawMode` 直接对应 WebGL 的图元类型。三角形扇特别适合画凸多边形。

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

常用的有 `gl.TRIANGLES`、`gl.TRIANGLE_FAN`、`gl.TRIANGLE_STRIP`。

## 逐顶点颜色

`color` 传单个 `Color` 时整块几何体统一着色；传一个 `Color[]` 时会按顶点顺序一一对应，实现渐变。

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

## 贴纹理

传入 `texture` 后，可以再用 `uv` 指定每个顶点的纹理坐标（0 到 1）。不传 `uv` 时所有顶点默认取 `(0, 0)`。

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

## 底层：startGraphic / addGraphicVertex / endGraphic

`drawGraphic` 内部就是把这三步封装起来。需要在循环里动态生成顶点、或者想避免每帧构造顶点数组时，可以直接用底层写法。

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

引擎也内置了两个顶点辅助方法，配合 `startGraphic` / `endGraphic` 使用：

```ts
rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
rapid.addRectVertex(120, 80, new Color(84, 184, 234)); // 矩形四个顶点
rapid.endGraphic();

rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
rapid.addCircleVertex(60, new Color(95, 195, 122), 48); // 半径 60、48 段的圆
rapid.endGraphic();
```