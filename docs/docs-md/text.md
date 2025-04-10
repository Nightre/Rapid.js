# Text

Rapid.js provides a powerful text rendering system that creates texture-based text for high-performance rendering.

## Creating Text

To create text in Rapid.js, you use the `createText` method:

```javascript
// Create a simple text texture
const textTexture = rapid.textures.createText({
    text: "Hello World",         // Text content
    fontSize: 24                 // Font size
});

// Render the text
rapid.renderSprite({
    texture: textTexture,
    position: new Vec2(100, 100)
});
```

## Updating Text

You can dynamically update text content:

```javascript
let score = 0;
const scoreText = rapid.textures.createText({ 
    text: "Score: 0", 
    fontSize: 24 
});

function updateScore(newScore) {
    score = newScore;
    // Update text content - this is efficient and doesn't recreate the texture
    scoreText.setText("Score: " + score);
}

function animate() {
    rapid.startRender();
    
    rapid.renderSprite({
        texture: scoreText,
        position: new Vec2(20, 20)
    });
    
    rapid.endRender();
    requestAnimationFrame(animate);
}
```