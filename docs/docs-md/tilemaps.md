# Tile Maps

Tile maps are an efficient way to create large game worlds by arranging tiles in a grid. Rapid.js provides a powerful tile map system with support for both standard (square) and isometric tile maps.

## Getting Started

To use tile maps in your game, you'll need to:
1. Create a tileset
2. Prepare your map data
3. Render the tilemap

### Creating a Tileset

A tileset manages your tile textures and their properties. Here's how to create one:

```javascript
// Create a tileset with 32x32 pixel tiles
const tileSet = new TileSet(32, 32);

// Load textures
const grassTexture = await rapid.textures.textureFromUrl("./grass.png");
const treeTexture = await rapid.textures.textureFromUrl("./tree.png");

// Register tiles with IDs
tileSet.setTile(0, grassTexture);  // Simple tile
tileSet.setTile(1, {               // Tile with additional properties
    texture: treeTexture,
    origin: new Vec2(0.5, 1),      // Set origin point
    ySortOffset: 16,               // Y-sort offset for proper layering
    x: -16,                        // Position offset
    y: 16
});
```

### Preparing Map Data

Map data is represented as a 2D array of tile IDs. Each number corresponds to a tile ID in your tileset:

```javascript
const mapData = [
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [1, 0, 0, 1],
];
```

### Rendering the Tilemap

To render your tilemap, use the `renderTileMapLayer` method:

```javascript
// Basic rendering with just a tileset
rapid.renderTileMapLayer(mapData, tileSet);

// Advanced rendering with options
rapid.renderTileMapLayer(mapData, {
    tileSet: tileSet,
    shape: TilemapShape.SQUARE,  // or TilemapShape.ISOMETRIC
    error: 2,                    // Number of extra tiles to render beyond viewport
    // ... other options
});
```

## Advanced Features

### Error Margin

The error margin system allows you to render additional tiles beyond the visible viewport. This is particularly important for:
- Tiles larger than the base tile size
- Smooth scrolling and camera movement
- Preventing visual artifacts at screen edges

You can configure the error margin in three ways:

```javascript
{
    error: 2,                    // Same margin for both X and Y
    errorX: 2,                   // Specific X-axis margin
    errorY: 2,                   // Specific Y-axis margin
}
```

### Y-Sorting

Y-sorting enables proper depth ordering for overlapping sprites and tiles. This is especially useful for games with a top-down perspective:

```javascript
const options = {
    tileSet: tileSet,
    ySortCallback: [
        {
            ySort: player.position.y,
            render: () => {
                rapid.renderSprite({
                    texture: playerTexture,
                    offsetX: player.position.x,
                    offsetY: player.position.y,
                    origin: new Vec2(0.5, 1)
                });
            }
        }
    ]
};
```

### Isometric Maps

Rapid.js supports isometric tilemaps. To create an isometric map:

```javascript
const options = {
    tileSet: tileSet,
    shape: TilemapShape.ISOMETRIC
};

rapid.renderTileMapLayer(isometricMapData, options);
```

### Coordinate Conversion

The tilemap system provides methods to convert between screen (local) and map coordinates:

```javascript
// Convert screen position to map coordinates
const mapPos = rapid.tileMap.localToMap(screenPos, options);

// Convert map coordinates to screen position
const screenPos = rapid.tileMap.mapToLocal(mapPos, options);
```

### Dynamic Tile Properties

You can modify tile properties dynamically using the `eachTile` callback:

```javascript
const options = {
    tileSet: tileSet,
    eachTile: (tileId, mapX, mapY) => {
        // Return modified properties for specific tiles
        if (tileId === 1) {
            return {
                rotation: Math.sin(time) * 0.1,
                // ... other sprite properties
            };
        }
    }
};
```