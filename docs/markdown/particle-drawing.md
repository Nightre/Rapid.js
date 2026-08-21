# Drawing Particles

`drawParticle` and `drawParticles` are the direct particle rendering APIs in Rapid.js. They are ideal when you are already managing particle states yourself and simply want Rapid.js to draw them with minimal overhead.

## Use Cases:

Commonly used for rendering a massive number of elements, such as particle effects and tilemaps. 
Differences from `drawSprite`:

- **Limitations:** Only suitable for drawing large numbers of elements based on the same base texture (`BaseTexture`; different sub-regions/Atlas within a texture atlas can be used).

- **Benefits:** Bypasses complex node calculations, resulting in extremely significant performance improvements.

If you want Rapid.js to handle the creation, updating, recycling, and rendering of particles for you, use [ParticleEmitter](#particles).

It is very similar to PixiJS's `ParticleContainer`: you hand over a compact set of particle properties to the renderer, and the renderer efficiently draws a massive amount of sprites using a single texture.

## drawParticle

`drawParticle` draws a particle-style sprite using more compact parameters.

```ts
rapid.drawParticle({
  texture: spark,
  x: 160,
  y: 120,
  rotation: Math.PI * 0.25,
  scaleX: 1,
  scaleY: 1,
  color: new Color(255, 220, 120),
});
```

## drawParticles

`drawParticles` is the high-throughput path. Instead of calling `drawParticle` once for every single particle, you pass the arrays of particle properties to Rapid.js all at once.

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
    color,
    count,
    scaleX: 1,
    scaleY: 1,
  });

  rapid.flush();
  requestAnimationFrame(frame);
}
```