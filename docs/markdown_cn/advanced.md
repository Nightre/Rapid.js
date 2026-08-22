# 高级绘制

这一章收录一些更底层的渲染控制：矩形裁剪、混合模式，以及跳过变换的快速绘制。它们在做特效、优化热点循环时很有用。

## 矩形裁剪 Scissor

Scissor 把绘制限制在一个矩形区域内，矩形外的像素直接被丢弃。坐标使用和绘制调用一致的逻辑坐标系（左上角为原点）。

最方便的写法是 `withScissor(x, y, width, height, cb)`，回调里的所有绘制都会被裁剪：

```ts
rapid.withScissor(50, 50, 300, 200, () => {
  rapid.drawSprite({ texture: background, x: 0, y: 0 });
  rapid.drawSprite({ texture: hero, x: heroX, y: heroY });
});
```

也可以手动配对使用 `startScissor` / `endScissor`：

```ts
rapid.startScissor(50, 50, 300, 200);
rapid.drawSprite({ texture: background });
rapid.endScissor();
```

Scissor 适合小地图、滚动列表、分屏这类规则的矩形窗口。需要任意形状裁剪时用 [遮罩](#masks)。

> `startScissor` 和 `withScissor` 会先 `flush` 之前的绘制

## 混合模式 BlendMode

混合模式决定新画的像素如何和已有像素叠加。`BlendMode` 提供这些模式：

- `BlendMode.NORMAL`  -  普通 alpha 混合（默认）。
- `BlendMode.ADD`  -  加法混合，适合发光、火焰、能量效果。
- `BlendMode.MULTIPLY`  -  正片叠底，适合阴影、压暗。
- `BlendMode.SCREEN`  -  滤色，比加法更柔和的提亮。
- `BlendMode.ERASE`  -  擦除，用源的 alpha 削掉目标的 alpha。

最方便的写法是 `withBlendMode(mode, cb)`，它会在回调结束后自动恢复成 `NORMAL`：

```ts
import { BlendMode } from "rapid-render";

rapid.withBlendMode(BlendMode.ADD, () => {
  rapid.drawSprite({ texture: glow, x: 100, y: 80 });
  rapid.drawSprite({ texture: glow, x: 160, y: 120 });
});
```

也可以用 `setBlendMode` 手动切换，记得用完切回 `NORMAL`：

```ts
rapid.setBlendMode(BlendMode.MULTIPLY);
rapid.drawSprite({ texture: shadow });
rapid.setBlendMode(BlendMode.NORMAL);
```

> `setBlendMode` 会先 `flush` 之前的绘制