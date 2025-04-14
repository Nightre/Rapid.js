# Rendering

## Rendering Shapes

### Rectangles

```javascript
rapid.renderRect({
    offset: new Vec2(100, 100),  // Position
    width: 200,                  // Width
    height: 150,                 // Height
    color: Color.Red             // Color
});
```

### Circles

```javascript
rapid.renderCircle({
    offset: new Vec2(150, 150),  // Center position
    radius: 50,                  // Radius
    color: Color.Blue            // Color
});
```

## Rendering Sprites

Sprites are textured quads that can be positioned, rotated, and scaled:

```javascript
// Load texture first
const texture = await rapid.textures.textureFromUrl("./assets/character.png");

// Render sprite
rapid.renderSprite({
    texture: texture,               // Texture to render
    position: new Vec2(100, 100),   // Position
    scale: 2,                       // Scale
    flipX: true,                    // Horizontal flip texture
    flipY: true,                    // Vertical flip texture
    /** ... */
});
```

## Rendering Graphics

Graphics are custom shapes defined by vertices with colors or textures:

```javascript
// Define vertices
const points = Vec2.FromArray([
    [0, 0],
    [100, 0],
    [100, 100],
    [50, 150],
    [0, 100],
]);

// Define colors for each vertex
const colors = [
    Color.Red,
    Color.Green,
    Color.Blue,
    Color.Yellow,
    Color.Purple
];

// Render colored shape
rapid.renderGraphic({
    offset: new Vec2(50, 50),
    points: points,
    color: colors
});

rapid.renderGraphic({
    offset: new Vec2(50, 50),
    points: points,
    color: Color.Red 
});
```

### Textured Graphics

```javascript
// Define vertices
const points = Vec2.FromArray([
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
]);

// Define UV coordinates for texture mapping
const uvCoords = Vec2.FromArray([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
]);

// Render textured shape
rapid.renderGraphic({
    offset: new Vec2(200, 50),
    points: points,
    uv: uvCoords,
    texture: myTexture
});
```

## Rendering Lines

```javascript
// Define line points
const linePoints = [
    new Vec2(0, 0),
    new Vec2(100, 50),
    new Vec2(150, 200),
    new Vec2(50, 250),
];

// Render line
rapid.renderLine({
    position: new Vec2(100, 100),
    points: linePoints,
    width: 5,                    // Line width
    color: Color.Blue,           // Line color
    roundCap: true,              // Round line caps
    closed: false                // If true, connects last point to first
});
```
Currently, lines do not support textures, but this is planned and will be supported soon.

### Line Textures

Lines now support textures with two different texture modes:

```javascript
// Define line points
const linePoints = [
    new Vec2(0, 0),
    new Vec2(100, 50),
    new Vec2(150, 200),
    new Vec2(50, 250),
];

// Load texture with REPEAT wrap mode
const roadTexture = await rapid.textures.textureFromUrl("./assets/road.png", false, TextureWrapMode.REPEAT);

// Render textured line with REPEAT mode
rapid.renderLine({
    position: new Vec2(100, 100),
    points: linePoints,
    width: 30,                          // Line width
    texture: roadTexture,               // Line texture
    textureMode: LineTextureMode.REPEAT // Texture repeats along the line
});

// Render textured line with STRETCH mode
rapid.renderLine({
    position: new Vec2(300, 100),
    points: linePoints,
    width: 30,                           // Line width
    texture: roadTexture,                // Line texture
    textureMode: LineTextureMode.STRETCH // Texture stretches along the line
});
```