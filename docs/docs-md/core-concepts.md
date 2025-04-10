# Core Concepts

Rapid.js is designed around several core concepts that make it powerful yet easy to use.

### The Rendering Cycle

The rendering cycle drives Rapid.js, typically running in a `requestAnimationFrame` game loop for smooth updates.

```javascript
function gameLoop() {
    rapid.render(() => {
        // Rendering calls (e.g., draw sprites, text)
    });

    // OR
    
    rapid.startRender();
    // Rendering calls (e.g., draw sprites, text)
    rapid.endRender();

    requestAnimationFrame(gameLoop); // Next frame
}
```

- **`rapid.render()`**: Wraps rendering calls in a single, efficient function.
- **`rapid.startRender()` / `endRender()`**: Manually control the rendering process for flexibility.

## Key Concepts

### Rapid

The main engine class that manages rendering and provides core functionality.

```javascript
const rapid = new Rapid({
    canvas: document.getElementById("gameCanvas"),
    backgroundColor: Color.White,
    // Optional parameters
    width: 800,   // Canvas width
    height: 600,  // Canvas height
    antialias: true  // Enable antialiasing
});
```

## Matrix Stack

The matrix stack provides two approaches for managing transformations when rendering:

### Automatic Management

When using `renderSprite()`, the matrix state is automatically saved before applying the sprite's transformations and restored afterward. The `beforeRestore` callback allows drawing additional elements with the current transformations before restoration occurs.

```javascript
rapid.renderSprite({ 
    position: new Vec2(100, 100),
    scale: 3,
    beforeRestore: () => {
        // Additional rendering with current transformation
        rapid.renderSprite({/* ... */})
    }
});
```

### Manual Management

For more control, explicitly manage the matrix stack using `save()` and `restore()`:

```javascript
const matrixStack = rapid.matrixStack

rapid.save();
matrixStack.translate(new Vec2(100, 100));
matrixStack.rotate(Math.PI / 4);
matrixStack.scale(2);
rapid.renderSprite({...});
rapid.restore();
```

Alternatively, use the `withTransform()` helper function for cleaner code with automatic save/restore:

```javascript
const matrixStack = rapid.matrixStack
const withTransform = rapid.withTransform

withTransform(()=>{
    matrixStack.translate(new Vec2(100, 100));
    matrixStack.rotate(Math.PI / 4);
    matrixStack.scale(2);
    rapid.renderSprite({...});
    
    // Nested transformations are properly managed
    withTransform(()=>{
        matrixStack.translate(new Vec2(100, 100));
        matrixStack.rotate(Math.PI / 4);
        matrixStack.scale(2);
        rapid.renderSprite({...});

        // Coordinate conversion utilities
        const localPos = matrixStack.globalToLocal(globalPos);
        const backToGlobal = matrixStack.localToGlobal(localPos);
    })
})
```

This approach provides precise control over the transformation state for complex rendering hierarchies while ensuring proper cleanup of matrix states.

### Getting and Setting Transforms

You can directly get and set the current transformation matrix:

```js
const trans = matrixStack.getTransform()
matrixStack.setTransform(trans)
```

`getTransform()` returns the current transformation matrix, while `setTransform()` allows you to directly set the transformation state. This is particularly useful when you need to save and restore specific transformation states.