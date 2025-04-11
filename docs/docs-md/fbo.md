# Frame Buffer Objects (FBO)

Frame Buffer Objects (FBOs) in Rapid.js allow you to render content to a texture instead of directly to the screen. This is useful for creating effects like post-processing, reflections, or dynamic textures.

## Creating an FBO

```javascript
// Create a new FBO with specified dimensions
const fbo = rapid.textures.createFrameBufferObject(128, 64);

const renderTexture = await rapid.textures.textureFromFrameBufferObject(fbo);
```

## Using FBOs

There are two ways to render to an FBO:

### 1. Using drawToFBO

The simplest way is to use the `drawToFBO` method:

```javascript
rapid.drawToFBO(fbo, () => {
    // All rendering commands here will be drawn to the FBO
    rapid.renderSprite({
        texture: someTexture,
        position: new Vec2(100, 100)
    });
    
    rapid.renderRect({
        width: 50,
        height: 50,
        position: new Vec2(200, 200),
        color: new Color(255, 0, 0, 255)
    });
});

// Now you can use the render texture
rapid.renderSprite({
    texture: renderTexture,
    position: new Vec2(0, 0)
});
```

### 2. Manual Control

For more control, you can manually start and end FBO rendering:

```javascript
// Start rendering to FBO
rapid.startFBO(fbo);

// Your rendering commands
rapid.renderSprite({/* ... */});
rapid.renderRect({/* ... */});

// End FBO rendering
rapid.endFBO();
```

## Resizing FBOs

You can resize an FBO if needed:

```javascript
// Resize the FBO to new dimensions
fbo.resize(1024, 768);
```

## Deleting FBO

```javascript
rapid.textures.destroy(fbo);
```

## Common Use Cases

### Post-Processing Effects

```javascript
// Create an FBO for the main scene
const sceneFBO = rapid.textures.createFrameBufferObject(width, height);
const sceneTexture = await rapid.textures.textureFromFrameBufferObject(sceneFBO);

// Render scene to FBO
rapid.drawToFBO(sceneFBO, () => {
    // Render your scene here
    renderScene();
});

// Apply post-processing effect when rendering the FBO to screen
rapid.renderSprite({
    texture: sceneTexture,
    position: new Vec2(0, 0),
    shader: postProcessShader  // Custom shader for effects
});
```