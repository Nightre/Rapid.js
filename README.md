
# Rapid.js

A highly efficient ([stress-test](https://nightre.github.io/Rapid.js/docs/examples.html)) and lightweight WebGL-based 2D rendering engine focused on rendering capabilities.

### [Website](https://nightre.github.io/Rapid.js/docs/index.html)

#### [Document](https://nightre.github.io/Rapid.js/docs/docs.html) | [API Docs](https://nightre.github.io/Rapid.js/docs/api/index.html) | [Examples](https://nightre.github.io/Rapid.js/docs/examples.html)

## Features

* **Fast Rendering**
* **TileMap** - YSort, isometric
* **Graphics Drawing**
* **Text Rendering**
* **Line Drawing** - line texture
* **Custom Shaders**
* **Mask**
* **Frame Buffer Object**

> [!WARNING]  
> This project is a work in progress! Expect bugs, report issues, and feel free to contribute.

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

* Light System 🚧 (In Progress)
* 9-slice
* Nodejs Support

## Contributing

Issues and PRs are welcome!

## Screen shot

![1](./screenshot/1.gif)
![2](./screenshot/2.gif)
