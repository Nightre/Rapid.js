# 🚀 Rapid.js

⚠️ This project is under development and will be completed soon ⚠️

A highly efficient and lightweight WebGL renderer capable of rendering 10k sprites at 60fps.


[Demo](https://nightre.github.io/rapid.js/demo/)

# Features:
* Fast rendering ( capable of rendering 10,000 sprites at 60fps )
* Multi-texture support ( Batch rendering based on the GPU's maximum texture units )
* Texture cropping
* Graphic
* Matrix stacking
* Color manipulation

# Screen Shot

![screen](./screenshot/screen.png)

# Useage

```js
// Creating textures
const cat = await rapid.texture.textureFromUrl("./cat.png")
const plane = await rapid.texture.textureFromUrl("./plane.png")
// or
// Texture.fromImageSource(img)
// Texture.fromUrl(url)
// set clip
cat.setClipRegion(
    10,10 // top-left corner of the clipped region.
    50,50 // size
)
//                      R   G   B   A
const color = new Color(255,255,255,255)
// or Color.fromHex
// Called before starting rendering
rapid.startRender()


rapid.save() // Save state
rapid.matrixStack.translate(0,0)
rapid.matrixStack.scale(1)
rapid.matrixStack.rotate(0)

//               texture offset color
rapid.renderSprite(cat,0,0, color) // draw Sprite
rapid.restore() // back to the previous saved state

// draw graphic
// Different vertices can have different colors
rapid.startGraphicDraw()
rapid.addGraphicVertex(0, 0, color)
rapid.addGraphicVertex(100, 0, color)
rapid.addGraphicVertex(100, 100, color)
rapid.endGraphicDraw()

// Called after rendering
rapid.endRender()
```