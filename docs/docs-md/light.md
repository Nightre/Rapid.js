# Light System

Rapid.js provides a light system that allows you to create lighting effects with dynamic shadows. This system can be used to enhance the visual effects of your game or application, creating a more immersive environment.

## Basic Usage

To use the light system, you need to define occlusion polygons and a light source. Here's a simple example:

```javascript
// Define occlusion polygons (obstacles that cast shadows)
const occlusion = [
  [new Vec2(0, 0), new Vec2(100, 0), new Vec2(100, 100), new Vec2(0, 100)]
];

// Define light source position
const lightSource = new Vec2(150, 150);

// Draw light with shadows
rapid.drawLightShadowMask({
  occlusion: occlusion,
  lightSource: lightSource,
  type: MaskType.Include
});

// Draw the light color/texture
rapid.renderCircle({
  position: lightSource,
  radius: 200,
  color: Color.Yellow,
});

// Clear the mask when done
rapid.clearMask();
```

## API Reference

### drawLightShadowMask

```javascript
rapid.drawLightShadowMask(options)
```

Renders a light shadow mask based on the provided occlusion polygons and light source.

**Parameters:**

- `options` (ILightRenderOptions): An object containing:
  - `occlusion` (Vec2[][]): Array of polygon vertices that will cast shadows
  - `lightSource` (Vec2): Position of the light source
  - `type` (MaskType): Type of mask (Include or Exclude)
  - `baseProjectionLength` (number, optional): Base length for shadow projections (default: 1000)

### MaskType

The `MaskType` enum defines how the light and shadows interact:

- `MaskType.Include`: Only areas within the light radius and not in shadow will be rendered
- `MaskType.Exclude`: Areas in shadow will be rendered