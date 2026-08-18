import { Color, ParticleEmitter, ParticleShape, Vec2 } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
    // Use toycar.png as the particle
    const particleTex = await rapid.texture.load("./image/toycar.png");

    const emitter = new ParticleEmitter(rapid, {
        texture: particleTex,
        life: [1, 2],
        emitRate: 20, // Less rate because cars are bigger
        emitShape: ParticleShape.CIRCLE,
        emitRadius: 20,
        position: new Vec2(50, 50),
        
        animation: {
            // Erupt out in all directions
            rotation: { start: [0, Math.PI * 2] },
            speed: { start: [50, 150], end: 20 },
            
            // Gravity pulls them down slightly
            acceleration: new Vec2(0, 100),
            
            // Keep cars normal size, shrinking at the end
            scale: { start: [0.8, 1.2], end: 0 },
            
            // Just fade out to transparent (white color retains the car's original colors)
            color: {
                start: new Color(255, 255, 255, 255),
                end: new Color(255, 255, 255, 0)
            }
        }
    });

    emitter.start();

    loop((time, delta) => {
        rapid.clear();
        emitter.update(delta);
        emitter.render();
        rapid.flush();
    });
}
