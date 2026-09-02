# Particle Helper: Particle Emitter

Rapid.js includes a lightweight particle helper powered by `ParticleEmitter`. You describe particle visual attributes and behavior over time, and the emitter manages creation, update, recycling, and rendering of particles.
`ParticleEmitter` calls `drawParticles` internally and is a helper built on top of it.

## Quick Start

Create an emitter, call `start()`, and execute `update(dt)` and `render()` in your game loop every frame.

```ts
import { ParticleEmitter, ParticleShape, Color, Vec2 } from "rapid-render";

const spark = await rapid.texture.load("./image/spark.png");

const emitter = new ParticleEmitter(rapid, {
  texture: spark,
  life: [0.6, 1.2],          // Particle lifespan of 0.6~1.2 seconds
  emitRate: 60,              // Emit 60 particles per second
  emitShape: ParticleShape.CIRCLE,
  emitRadius: 20,
  animation: {
    speed: { start: 120, end: 0 },   // Initial speed 120, decelerates to 0
    rotation: [0, Math.PI * 2],      // Random angle direction
    scale: { start: 1, end: 0 },     // Shrinks and disappears
    color: {
      start: new Color(255, 220, 120),
      end: new Color(255, 80, 0),
    },
  },
});
emitter.position = new Vec2(160, 120);
emitter.start();

let lastTime = performance.now();

function frame(time: number) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  emitter.update(dt);

  rapid.clear();
  emitter.render();
  rapid.flush();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

The parameter for `update` is delta time in **seconds** (not milliseconds).

## Animation Attributes

Each property inside `animation` can be written in four ways:

- Fixed value: `scale: 1`
- A `ParticleAttribute` object: `scale: { start: 1, end: 0 }`
- A random `[min, max]` range: `rotation: [0, Math.PI * 2]`
- Combined forms: `speed: { start: [80, 160], end: 0 }`

`ParticleAttribute` supports the following fields:

- `start`: Initial value.
- `end`: Ending value.
- `damping`: Multiplicative damping factor per second (e.g. `0.9` multiplies by `0.9` every second).
- `delta`: Explicit rate of change per second; calculated automatically from `start` and `end` if omitted.

Animatable properties:

- `speed`: Speed along `rotation` direction (pixels/sec).
- `rotation`: Rotation angle in radians, which also dictates `speed` direction.
- `scale`: Uniform scale.
- `color`: Color tinting (`Color`, 0~255 components).
- `velocity`: Additional velocity vector (pixels/sec). Use `velocity.delta` to simulate constant acceleration (e.g. gravity).

```ts
animation: {
  velocity: { start: new Vec2(0, -60), delta: new Vec2(0, 200) },   // Initial upward velocity with gravity
  color: {
    start: new Color(255, 255, 255),
    end: new Color(255, 255, 255, 0), // Fade out
  },
}
```

## Emission Shapes

`emitShape` defines where particles spawn:

- `ParticleShape.POINT`: Spawns at a single point (default).
- `ParticleShape.CIRCLE`: Spawns randomly within a circle of radius `emitRadius`.
- `ParticleShape.RECT`: Spawns randomly inside `emitRect` (`{ width, height }`).

```ts
const emitter = new ParticleEmitter(rapid, {
  texture: spark,
  life: 1,
  emitShape: ParticleShape.RECT,
  emitRect: { width: 200, height: 20 },
  animation: { /* ... */ },
});
```

## Emission Timing & Cadence

- `emitRate`: Number of particles per second in continuous mode; burst size in burst mode.
- `emitTime`: When > 0, enters burst mode, firing a burst every `emitTime` seconds rather than continuously.
- `maxParticles`: Maximum allowed active particles simultaneously.

`setEmitRate` / `setEmitTime` can also be modified at runtime:

```ts
emitter.setEmitRate(30);
emitter.setEmitTime(0.5); // Burst every 0.5 seconds
```

For one-off burst events, use `emit(count)` or `oneShot()`:

```ts
emitter.emit(50);   // Instantly spawns 50 particles (capped by maxParticles)
emitter.oneShot();  // Instantly spawns emitRate particles
```

## Local vs World Space

`localSpace` (defaults to `true`) determines whether particles move with the emitter or remain in world space:

- `localSpace: true`: Particles are positioned relative to the emitter. Moving `emitter.position` shifts all active particles together (suitable for fire, torches, attach trails).
- `localSpace: false`: Particles lock their initial world position upon creation and no longer move with the emitter (suitable for splashes, explosion debris).

## Emitter Controls

```ts
emitter.start();   // Starts emission
emitter.stop();    // Stops emission; existing particles finish life cycle
emitter.clear();   // Instantly removes all active particles

emitter.getParticleCount(); // Active particle count
emitter.isActive();         // Whether emitting or active particles remain
```
