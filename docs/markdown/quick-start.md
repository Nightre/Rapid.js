# Quick Start

This is an introductory tutorial. This example does only one thing: loads `toycar.png` and renders it onto the canvas.

## HTML

```html
<canvas id="game" width="480" height="300"></canvas>
<script type="module" src="./main.ts"></script>
```

## TypeScript

```ts
import { Rapid, Color } from "rapid-render";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const rapid = new Rapid({ canvas });

// Load texture
const toycar = await rapid.texture.load("./image/toycar.png");

rapid.clear(); // 1. Clear renderer. Start rendering

// 2. Submit draw command
rapid.drawSprite({
  texture: toycar,
  x: 160,
  y: 100,
});

rapid.flush(); // 3. Flush render queue. Finish rendering
```

## Rotating the Image

`Rapid.js` does not handle the game loop or frame scheduling for you, so next you need to add your own `gameloop`.
If you want to animate the image, place the drawing code inside `requestAnimationFrame`.

```js
let rotation = 0;

function frame() {
  rotation += 0.02;

  rapid.clear();
  rapid.drawSprite({
    texture: toycar,
    x: 240,
    y: 150,
    rotation,
    origin: 0.5,
  });
  rapid.flush();

  requestAnimationFrame(frame);
}

frame();
```

If you need to destroy the Rapid.js instance, use:

```ts
rapid.destroy();
```
