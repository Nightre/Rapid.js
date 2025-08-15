# Masks

Rapid.js provides a powerful masking system that allows you to control the visibility of rendered elements. Masks can be used to create clipping effects, reveal or hide portions of your scene, and create complex visual effects.

## Basic Masking Concepts

In Rapid.js, masking works by:

1. Drawing a mask shape
2. Drawing content that will be masked

There are two types of masks:

- **Include mask**: Only shows content where the mask exists (default)
- **Exclude mask**: Only shows content where the mask doesn't exist

## Using Masks

```js
// Method 1: Using callback function (Recommended)
rapid.drawMask(MaskType.Include, ()=>{
    rapid.renderCircle({
        offset: new Vec2(200, 200),
        radius: 100,
        color: Color.White  // Color doesn't matter for masks
    });
});

// Method 2: Using start/end functions
rapid.startDrawMask(MaskType.Include);

// Draw a circle as the mask shape
rapid.renderCircle({
    offset: new Vec2(200, 200),
    radius: 100,
    color: Color.White  // Color doesn't matter for masks
});

// End mask drawing
rapid.endDrawMask();
```

Here's a complete example of using an include mask:

```javascript
import { MaskType, Color, Rapid, Vec2 } from "../../dist/rapid.js"

// Initialize Rapid
const rapid = new Rapid({
    canvas: document.getElementById("gameCanvas"),
    backgroundColor: Color.fromHex("FFFFFF")
});

// Load some textures
const texture = await rapid.texture.textureFromUrl("./assets/character.png");

function render() {
    rapid.startRender();
    
    // Create a circular mask using Method 1
    rapid.drawMask(MaskType.Include, () => {
        rapid.renderCircle({
            offset: new Vec2(200, 200),
            radius: 100,
            color: Color.White
        });
    });
    
    // Now render content that will be masked
    rapid.renderSprite({
        texture: texture,
        position: new Vec2(150, 150)
    });
    
    // Clear the mask when you're done
    rapid.clearMask();
    
    // Content rendered after clearMask() is not affected by the mask
    rapid.renderSprite({
        texture: texture,
        position: new Vec2(300, 300)
    });
    
    rapid.endRender();
}
```

## Exclude Masks

To create an exclude mask (showing content only where the mask doesn't exist):

```javascript
// Create an exclude mask using Method 1
rapid.drawMask(MaskType.Exclude, () => {
    // Draw a rectangle as the mask shape
    rapid.renderRect({
        offset: new Vec2(150, 150),
        width: 100,
        height: 100,
        color: Color.White
    });
});

// This content will be visible everywhere EXCEPT inside the rectangle mask
rapid.renderSprite({ /* ... */ });
```

## Best Practices

1. Always use Method 1 (`drawMask`) when possible as it automatically handles mask cleanup
2. If you need more control over the mask timing, use Method 2 (`startDrawMask`/`endDrawMask`)
3. The color used for mask shapes doesn't affect the mask - only the shape matters