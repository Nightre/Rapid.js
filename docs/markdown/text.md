# Text Rendering

Rapid.js renders text via `TextTexture`. Internally, it draws text onto an HTML Canvas and uploads it as a WebGL texture, enabling you to draw text with `drawSprite` just like regular sprites.

## Creating Text Textures

Create text textures using `rapid.texture.createTextTexture(options)`, where `text` is the text content and other fields set text styling.

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

`createTextTexture` returns a standard `Texture`, meaning all `drawSprite` capabilities—transformations, tinting, flipping—are fully supported. Text textures render at higher resolutions scaled by device pixel ratio (DPR), ensuring text remains sharp.

## Styling

Style fields originate from [ITextStyle](api/interfaces/ITextStyle):

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

`align` and `baseline` modify texture `offsetX` / `offsetY` values, acting as text anchoring relative to drawing coordinates. For instance, with `align: "center"` and `baseline: "middle"`, `drawSprite`'s `(x, y)` corresponds to the center of the text.

## Multi-Line Text

Newlines (`\n`) within text strings are recognized as line breaks and rendered line by line.

```ts
const paragraph = rapid.texture.createTextTexture({
  text: "Line 1\nLine 2\nLine 3",
  fontSize: 20,
  fill: "#4e5f6b",
});
```

## Dynamic Updates

After creation, assigning a new string directly to `.text` updates the texture, automatically re-rendering canvas contents and uploading to GPU. Updates are skipped if content remains unchanged.

```ts
const score = rapid.texture.createTextTexture({ text: "Score: 0", fontSize: 24 });

function setScore(value: number) {
  score.text = `Score: ${value}`;
}
```

Styles can also be updated partially at runtime; the `.style` setter accepts partial fields and merges them with existing styles.

```ts
score.style = { fill: "#5fc37a", fontWeight: "bold" };
```
