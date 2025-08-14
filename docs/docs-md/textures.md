# Textures

Textures are images used for rendering sprites and other graphics in Rapid.js. The engine provides comprehensive tools for loading, manipulating, and using textures.

## Loading Textures

```javascript
// Load a texture from a URL
const texture = await rapid.texture.textureFromUrl("./assets/character.png");

// You can also load textures from a data URL or an Image object
const imageElement = document.getElementById("myImage");
const textureFromImage = await rapid.texture.textureFromSource(imageElement);
```

## Using Textures

Once loaded, textures can be used with various rendering methods:

```javascript
// Render as a sprite
rapid.renderSprite({
    texture: texture,
    position: new Vec2(100, 100)
});

// Use in graphics rendering
rapid.renderGraphic({
    offset: new Vec2(200, 200),
    points: myPoints,
    uv: myUVCoordinates,
    texture: texture
});
```

## Sprite Sheets

Rapid.js supports sprite sheets to efficiently manage multiple images:

```javascript
// Load a sprite sheet
const spriteSheet = await rapid.texture.textureFromUrl("./assets/spritesheet.png");

// Split into individual sprites (divide the texture into a grid)
const sprites = spriteSheet.createSpritesheet(32, 32);
// sprites is now an array of textures, each 32x32 pixels

// Use individual sprites
rapid.renderSprite({
    texture: sprites[0],  // First sprite in the sheet
    position: new Vec2(100, 100)
});

rapid.renderSprite({
    texture: sprites[5],  // Sixth sprite in the sheet
    position: new Vec2(150, 100)
});
```

## Texture Manipulation

### Clipping Regions

You can create new textures by clipping regions from existing ones:

```javascript
// Original texture
const fullTexture = await rapid.texture.textureFromUrl("./assets/character.png");

// Create a clipped texture (x, y, width, height)
const headTexture = fullTexture.clone().setClipRegion(0, 0, 32, 32);
const bodyTexture = fullTexture.clone().setClipRegion(0, 32, 32, 64);
```

## Texture Wrap Modes

Rapid.js supports different texture wrap modes that control how textures behave when texture coordinates go outside the 0-1 range:

```javascript
// Available wrap modes:
// TextureWrapMode.REPEAT - Repeats the texture (tiling)
// TextureWrapMode.CLAMP - Clamps to edge (stretches the edge pixels)
// TextureWrapMode.MIRROR - Mirrors the texture at each repeat

// Load texture with specific wrap mode
const tilingTexture = await rapid.texture.textureFromUrl(
    "./assets/pattern.png", 
    true,  // antialias
    TextureWrapMode.REPEAT  // wrap mode
);
```

## Deleting Textures

```js
rapid.texture.destroy(texture);
```
