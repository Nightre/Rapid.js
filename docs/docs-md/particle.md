## Overview

Particles are a powerful way to add visual effects to your games and applications. The Rapid.js particle system is designed to be flexible and easy to use, allowing you to create a wide variety of effects with minimal code.

## Basic Usage

To create a particle effect, use the `createParticleEmitter` method:

```javascript
const particleTexture = await rapid.textures.textureFromUrl("./particle.png");

const emitter = rapid.createParticleEmitter({
    position: new Vec2(400, 300),
    texture: particleTexture, // Can be multiple textures [t1, t2] or weighted textures [[t1, 0.9],[t2, 0.1]]
    life: 2, // Use [1, 2.2] to randomly select between 1 and 2.2
    emitRate: 50,
    emitTime: 100, // Emission time interval in seconds
    animation: {
        scale: {
            start: 1,
            end: 0.1,
            // damping: 0.95 or use damping
        },
        color: {
            start: new Color(255, 255, 255, 255),
            end: new Color(255, 255, 255, 0),

            // delta: new Color(0, 0, 0, -20) or set delta instead of end
            // damping: new Color(1, 1, 1, 0.9)
        },
        ...: {
            start: [0, 1] // Random value between 0 and 1
        },
        ...: Vec2.ZERO // Directly assign start value
    }
});

// Start emitting particles
emitter.start();
// Stop emitting new particles but allow existing ones to complete their lifecycle
emitter.stop();

// Emit particles once immediately, amount determined by emitRate
emitter.oneShot();
// Emit specified number of particles immediately
emitter.emit(10);

emitter.clear();


// In your game loop
function update(deltaTime) {
    emitter.update(deltaTime);
    rapid.renderParticles(emitter);
}
```

The following properties can be set in animation:

```
{
    speed: number,
    rotation: number,
    scale: number,
    color: Color,
    velocity: Vec2,
    acceleration: Vec2,
}
```