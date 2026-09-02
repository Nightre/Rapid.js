# Drawing Particles

`drawParticles` is Rapid.js's direct particle rendering API. It is ideal when you already manage particle state yourself and only need Rapid.js to draw the particles with minimal overhead.

## Use Cases:

Commonly used for rendering a massive number of elements, such as particle effects and tilemaps. 
Differences from `drawSprite`:

- **Limitations:** Only suitable for drawing large numbers of elements based on the same base texture (`BaseTexture`; different sub-regions/Atlas within a texture atlas can be used).

- **Benefits:** Bypasses complex node calculations, resulting in extremely significant performance improvements.

If you want Rapid.js to handle the creation, updating, recycling, and rendering of particles for you, use [ParticleEmitter](#particles).

It is very similar to PixiJS's `ParticleContainer`: you hand over a compact set of particle properties to the renderer, and the renderer efficiently draws a massive amount of sprites using a single texture.

## drawParticles

```ts
const count = 10000;
const x = new Array(count);
const y = new Array(count);
const rotation = new Array(count);
const color = new Array(count);

for (let i = 0; i < count; i++) {
  x[i] = Math.random() * rapid.width;
  y[i] = Math.random() * rapid.height;
  rotation[i] = Math.random() * Math.PI * 2;
  color[i] = new Color(255, 255, 255);
}

function frame() {
  rapid.clear();

  rapid.drawParticles({
    texture: spark,
    x,
    y,
    rotation,
    color, // Pass an ArrayLike value
    scaleX: 1, // Pass a scalar value
    scaleY: 1, // Scalars and ArrayLike values are both detected automatically
    // Each particle can have independent UV coordinates. This is especially
    // useful when drawing tilemaps.
    // u0: [...]
    // v0: [...]
    // u1: [...]
    // v1: [...]
  });

  rapid.flush();
  requestAnimationFrame(frame);
}
```
