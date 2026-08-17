<p align="center">
  <img src="./docs/image/logo_title.png" alt="Rapid" width="180" height="97" style="image-rendering: pixelated;">
</p>

<p align="center">
  A stateless, high-performance WebGL 2D renderer for browser games.
</p>

<p align="center">
  <a href="https://nightre.github.io/Rapid.js/">Website</a>
  &middot;
  <a href="https://nightre.github.io/Rapid.js/docs.html">Docs</a>
  &middot;
  <a href="https://nightre.github.io/Rapid.js/api/">API Reference</a>
</p>

---

## What is Rapid?

Rapid is a focused WebGL 2D rendering engine for games and visual tools. It gives you fast sprites, custom geometry, masks, particles, render textures, lines, text, transforms, and shader hooks while leaving scenes, entities, input, physics, and game state to your own architecture.

It is designed to stay close to your game loop instead of becoming the game engine around it.

> The documentation and demos are still being written.

## Highlights

- **Automatic batching**  
  Rapid detects compatible draw work and batches it for you, with no need for Pixi-style `ParticleContainer` setup or manual render grouping.

- **Powerful custom shaders**  
  Add sprite and geometry effects through shader hooks while still using Rapid's normal renderer, transforms, textures, and draw APIs.

- **Flexible transforms**  
  Compose motion, hierarchy, camera behavior, and local drawing with multiple transform styles backed by a fast matrix engine.

- **A complete 2D toolkit**  
  Draw sprites, lines, masks, particles, render textures, text, and custom geometry from one compact WebGL renderer.

## Install

```bash
npm install rapid-render
```

## Quick Start

```ts
import { Rapid, Color } from "rapid-render";

const canvas = document.querySelector("canvas")!;
const rapid = new Rapid({
  canvas,
  backgroundColor: new Color(247, 253, 255),
});

function frame() {
  rapid.clear();
  rapid.drawRect({
    x: 40,
    y: 40,
    width: 160,
    height: 96,
    color: new Color(84, 184, 234),
  });
  rapid.flush();
  requestAnimationFrame(frame);
}

frame();
```

## Development

```bash
npm install
npm run build
npm run docs
```

## Links

- Website: <https://nightre.github.io/Rapid.js/>
- Documentation: <https://nightre.github.io/Rapid.js/docs.html>
- API reference: <https://nightre.github.io/Rapid.js/api/>
