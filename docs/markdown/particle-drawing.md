# Particle Rendering

`drawParticle` and `drawParticles` are low-level particle rendering APIs in Rapid.js. They are best suited for scenarios where you manage the particle state and lifecycle yourself and only need Rapid.js to render them with minimal overhead.

## Use Cases

Commonly used for rendering large amounts of elements, such as particle effects, tilemaps, and bullet hells.

### Differences from `drawSprite`:

- **Limitation**: Only suitable for batch rendering elements that share the same base texture (`BaseTexture`, though different frames/sub-regions within a texture atlas are supported).
- **Benefit**: Bypasses complex scene graph / hierarchical transform calculations, delivering significant performance gains.

If you want Rapid.js to automatically handle the creation, updating, recycling, and rendering of particles for you, use [`ParticleEmitter`](#particles) instead.

This approach is very similar to PixiJS's `ParticleContainer`: you supply a compact set of particle attributes to the renderer, and it draws a large batch of sprites efficiently using a single texture.

## drawParticle

`drawParticle` renders a single particle-style sprite with compact parameters:

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

drawParticles

drawParticles is the high-throughput path. Instead of calling drawParticle once
per particle, you pass the particle attribute arrays all at once to Rapid.js.

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

