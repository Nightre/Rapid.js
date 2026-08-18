# Screen Coordinate Conversion

Browser events provide CSS pixel coordinates relative to the viewport. You must subtract the canvas element's bounding offset first, then convert them to logical game coordinates via `rapid.cssToLogic`.

```ts
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect(); // Canvas CSS position relative to viewport
  const cssPoint = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
  const logicPoint = rapid.cssToLogic(cssPoint);

  rapid.drawSprite({ texture: cursor, x: logicPoint.x, y: logicPoint.y });
});
```

## toCSSMatrix: Syncing Transforms to Real DOM Elements

Sometimes a position on screen requires an actual HTML DOM element (input fields, links, rich text) instead of a Sprite drawn inside the canvas.
In such cases, export the current world matrix as a CSS `matrix(...)` string and apply it directly to DOM elements overlaid on top of the canvas, making them transform synchronously:

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
label.style.transform = rapid.matrixStack.toCSSMatrix();

rapid.matrixStack.restore();
```
