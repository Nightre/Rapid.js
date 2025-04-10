<p align="center">
  <img src="./screenshot/logo.png" alt="Rapid.js Logo" width="100" style="image-rendering: pixelated;">
</p>

<a href="https://nightre.github.io/Rapid.js/docs/index.html"><h1 align="center">Rapid.js</h1></a>

A highly efficient ([stress-test](./docs/examples.html)) and lightweight WebGL-based 2D rendering engine focused on rendering capabilities. Rapid.js provides a simple and intuitive API for developers to quickly build high-performance 2D 
games, while staying completely independent from your game's architecture and logic.


### [Website](https://nightre.github.io/Rapid.js/docs/index.html)

#### [Document](https://nightre.github.io/Rapid.js/docs/docs.html)

#### [API Docs](https://nightre.github.io/Rapid.js/docs/api/index.html)

#### [Examples](https://nightre.github.io/Rapid.js/demo/)

# Features

* **Fast Rendering**
* **TileMap** - YSort, isometric
* **Graphics Drawing**
* **Text Rendering**
* **Line Drawing**
* **Custom Shaders**
* **Mask**

> [!WARNING]  
> This project is under active development! Please expect bugs, report any issues you find, and contributions are welcome.


# Install

```
npm i rapid-render
```

Or use unpkg

```html
<script src="https://unpkg.com/rapid-render/dist/rapid.umd.cjs"></script>
```

# Import

```js
import { Rapid } from "rapid-render"
```

# Usage

Rapid.js is a focused WebGL-based 2D rendering engine that provides rendering capabilities only. It does not include any game architecture, state management, physics, or other game-related systems - it's purely a rendering engine. This intentional design choice means you have complete freedom to structure your game however you want.

Here's a simple example showing how to use Rapid.js to create a bouncing box:

First, create a canvas element in your HTML:

```html
<canvas id="gameCanvas" width="500" height="500"></canvas>
```

Then, add the following JavaScript code:

```js
import { Rapid, Color, Vec2 } from "rapid-render"

// Initialize Rapid
const rapid = new Rapid({
    canvas: document.getElementById("gameCanvas"),
    backgroundColor: Color.fromHex("E6F0FF")
})

// Position and velocity
let position = new Vec2(100, 100)
let velocity = new Vec2(2, 2)

function gameLoop() {
    // Update position
    position.x += velocity.x
    position.y += velocity.y
    
    // Simple collision with boundaries
    if (position.x < 0 || position.x > 400) velocity.x *= -1
    if (position.y < 0 || position.y > 400) velocity.y *= -1
    
    // Render using the recommended render callback method
    rapid.render(() => {
        rapid.renderRect({ 
            offset: position, 
            width: 50, 
            height: 50, 
            color: Color.Red 
        })
    })
    // rapid.startRender();
    // ...
    // rapid.endRender();
    requestAnimationFrame(gameLoop);
}

gameLoop()
```

This will create a red square that bounces around the canvas, demonstrating basic animation and collision detection.

Note: All rendering operations must be performed within a render context, either:
- Inside a `rapid.render(() => { ... })` callback (Recommended), or
- Between `rapid.startRender()` and `rapid.endRender()` calls

# Road Map

* Frame Buffer Object (allows rendering to a texture instead of screen) [Under development]
* Light system
* Line Texture 
* Particle system
