# 文本绘制

Rapid.js 通过 `TextTexture` 渲染文字。它在内部用一张 HTML Canvas 把文字画出来，再上传成纹理，所以你可以像画普通精灵一样用 `drawSprite` 把文字画到画面上。

## 创建文字纹理

用 `rapid.texture.createTextTexture(options)` 创建，`text` 是文字内容，其余是样式。

```ts
const label = rapid.texture.createTextTexture({
  text: "Hello Rapid",
  fontSize: 32,
  fontFamily: "Arial",
  fill: "#243142",
});

rapid.clear();
rapid.drawSprite({
  texture: label,
  x: 40,
  y: 40,
});
rapid.flush();
```

`createTextTexture` 返回的就是一个 `Texture`，因此变换、颜色、翻转等所有 `drawSprite` 的能力都能直接用。纹理会根据设备像素比（dpr）以更高分辨率绘制，缩放后文字依然清晰。

## 样式

样式字段来自 [ITextStyle](api/interfaces/ITextStyle)：

```ts
const title = rapid.texture.createTextTexture({
  text: "GAME OVER",
  fontSize: 48,
  fontWeight: "bold",
  fill: "#ff8f70",
  stroke: "#243142",
  strokeThickness: 4,
  align: "center",
  baseline: "middle",
});
```

`align` 和 `baseline` 会改变纹理的 `offsetX` / `offsetY`，也就是文字相对绘制坐标的锚点。比如 `align: "center"` + `baseline: "middle"` 时，`drawSprite` 的 `x, y` 就是文字的中心。

## 多行文字

文本里的 `\n` 会被识别为换行，逐行排版。

```ts
const paragraph = rapid.texture.createTextTexture({
  text: "第一行\n第二行\n第三行",
  fontSize: 20,
  fill: "#4e5f6b",
});
```

## 动态更新

创建之后，直接给 `text` 赋值就能更新内容，纹理会自动重新绘制并上传。内容没变化时不会做多余的更新。

```ts
const score = rapid.texture.createTextTexture({ text: "Score: 0", fontSize: 24 });

function setScore(value: number) {
  score.text = `Score: ${value}`;
}
```

样式也可以在运行时局部更新，`style` 的 setter 接受部分字段并与已有样式合并。

```ts
score.style = { fill: "#5fc37a", fontWeight: "bold" };
```