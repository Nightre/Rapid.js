# 线条绘制

`drawLine` 把一组点连成一条有宽度的折线。它内部会根据点、宽度和斜接自动生成三角形几何体，所以线条的转角是实心填充的，不会出现缝隙。

## 基本用法

传入一个 `Vec2` 数组作为路径点，用 `width` 控制线宽。

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

`points` 至少要有两个点。少于两个点时不会画出任何东西。

## 闭合路径

`closed: true` 会把最后一个点和第一个点连起来，形成闭合多边形的描边。

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

## 圆头线帽

`roundCap: true` 会在折线的起点和终点各加一个半圆，让端点变圆润。闭合路径没有端点，所以这个选项在 `closed: true` 时无效。

```ts
rapid.drawLine({
  points: path,
  width: 12,
  roundCap: true,
  color: new Color(255, 143, 112),
});
```

## 给线条贴纹理

传入 `texture` 后，线条会被贴上纹理。`textureMode` 决定纹理沿线的铺法：

- `LineTextureMode.STRETCH`：把整张纹理沿整条线拉伸一次（默认）。
- `LineTextureMode.REPEAT`：按线段长度重复平铺纹理，适合虚线、锁链、轨迹这类素材。

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

REPEAT 模式下重复的密度取决于纹理的原始宽度。