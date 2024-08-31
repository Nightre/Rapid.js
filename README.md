# 🚀 Rapid.js

A highly efficient and lightweight WebGL renderer

## [API Docs](https://nightre.github.io/Rapid.js/docs/)

[stress test demo](https://nightre.github.io/Rapid.js/demo/) ( [source code](./demo/index.js) )

[render demo](https://nightre.github.io/Rapid.js/demo/matrix_stack.html) ( [source code](./demo/matrix_stack.js) )

[custom shader demo](https://nightre.github.io/Rapid.js/demo/custom-shader.html) ( [source code](./demo/custom-shader.js) )



# Features
* **Fast Rendering**: Render 10,000 sprites at 60fps
* **Multi-Texture Support**: Batch rendering using GPU's maximum texture units
* **Graphics Drawing**
* **Matrix Stack**
* **Text Rendering**
* **Line Drawing**
* **Custom Shaders**
* **Texture Clipping**

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

# Useage

```js
let rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
});

// Create texture
const cat = await rapid.textures.textureFromUrl("./cat.png");
//                      R   G   B   A
const color = new Color(255, 255, 255, 255); // Or use Color.fromHex

// Call before rendering
rapid.startRender();

// Render here...

// Call after rendering
rapid.endRender();

// Set canvas size
rapid.resize(100, 100);
```

# Render

```js
const text = rapid.textures.createText({ text: "Hello!", fontSize: 30 })

rapid.save() // Save state
rapid.matrixStack.translate(0,0)
rapid.matrixStack.scale(1)
rapid.matrixStack.rotate(0)

// Render Sprit
rapid.renderSprite(cat, 0, 0, color) // or rapid.renderSprite(cat, 0, 0, { color })

// Rendr Graphic
const path = Vec2.FormArray([[0, 0], [100, 0], [100, 100]])
rapid.renderGraphic(0,0,{points:path, color:green})
// or
// rapid.startGraphicDraw()
// rapid.addGraphicVertex(0, 0, color)
// rapid.endGraphicDraw()

// Render Text
rapid.renderSprite(text, 200, 0)
text.setText("time:" + Math.round(time))

rapid.restore() // back to the previous saved state
```

# Custom Shader

View demo and watch detailed shader code [custom shader demo](https://nightre.github.io/Rapid.js/demo/custom-shader.html) ( [source code](./demo/custom-shader.js) )

```js
const vertexShaderSource = `...`
const fragmentShaderSource = `...`

const customShader = new GLShader(rapid, vertexShaderSource, fragmentShaderSource)
rapid.startRender()

rapid.renderSprite(plane, 100, 100, {
    shader: customShader, // shader
    uniforms: {
        // Set custom uniform (You can set mat3, vec2, and so on here)
        uCustomUniform: Number(costumUniformValue)
        //  uVec2Uniform: [0,2] // recognized as vec2
        //  uMat3Uniform: [
        //     [0,0,0],
        //     [0,0,0],
        //     [0,0,0],
        //  ]
        // recognized as mat3
    }
});

rapid.endRender()
```
# Screen Shot

![screen](./screenshot/screen.png)
