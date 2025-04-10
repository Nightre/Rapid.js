# Rapid.js

A highly efficient [stress-test](https://nightre.github.io/Rapid.js/docs/examples.htm) and lightweight WebGL-based 2D rendering engine focused on rendering capabilities.

### [Website](https://nightre.github.io/Rapid.js/docs/index.html)

#### [Document](https://nightre.github.io/Rapid.js/docs/docs.html) | [API Docs](https://nightre.github.io/Rapid.js/docs/api/index.html) | [Examples](https://nightre.github.io/Rapid.js/docs/examples.html)

## Features

* **Fast Rendering**
* **TileMap** - YSort, isometric
* **Graphics Drawing**
* **Text Rendering**
* **Line Drawing**
* **Custom Shaders**
* **Mask**

## Install

```bash
npm i rapid-render
```

Or via CDN:

```html
<script src="https://unpkg.com/rapid-render/dist/rapid.umd.cjs"></script>
```

## Quick Start

```js
import { Rapid, Color, Vec2 } from "rapid-render"

// Initialize
const rapid = new Rapid({
    canvas: document.getElementById("gameCanvas"),
    backgroundColor: Color.fromHex("E6F0FF")
})

// Render example
rapid.render(() => {
    rapid.renderRect({ 
        offset: new Vec2(100, 100), 
        width: 50, 
        height: 50, 
        color: Color.Red 
    })
})
```

For more examples and detailed documentation, visit our [website](https://nightre.github.io/Rapid.js/docs/index.html).

## Roadmap

* Frame Buffer Object (FBO)
* Light System
* Line Texture
* Particle System

## Contributing

Issues and PRs are welcome!
