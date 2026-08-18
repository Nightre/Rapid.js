# 屏幕坐标换算

浏览器事件给的是相对视口的 CSS 像素，得先减去 canvas 自身的偏移，然后通过 `rapid.cssToLogic` 转化为游戏逻辑的坐标。

```ts
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect(); // canvas 相对视口的 CSS 像素位置
  const cssPoint = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
  const logicPoint = rapid.cssToLogic(cssPoint);

  rapid.drawSprite({ texture: cursor, x: logicPoint.x, y: logicPoint.y });
});
```

## toCSSMatrix：把变换同步给真实 DOM 元素

有时候画面上某个位置需要一个真的 HTML 元素（输入框、超链接、富文本），而不是画在 canvas 里的 Sprite。
这时可以把当前 world 矩阵导出成 CSS 的 `matrix(...)`，直接赋给叠在 canvas 上面的 DOM 元素，让它跟着一起变换：

```html
<div style="position: relative;">
  <canvas id="game"></canvas>
  <div id="label" style="position: absolute; left: 0; top: 0; transform-origin: 0 0;">Player</div>
</div>
```

```ts
rapid.matrixStack.save();
rapid.matrixStack.translate(player.x, player.y);
rapid.matrixStack.rotate(player.rotation);

rapid.drawSprite({ texture: player.texture, origin: 0.5 });
label.style.transform = rapid.toCSSMatrix();

rapid.matrixStack.restore();
```