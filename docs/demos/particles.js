import { Color, ParticleEmitter, ParticleShape, Vec2 } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
    const particleTex = await rapid.texture.load("./image/toycar.png");
    const ms = rapid.matrixStack

    const emitter = new ParticleEmitter(rapid, {
        texture: particleTex,
        life: [1, 2],
        emitRate: 50,
        emitShape: ParticleShape.CIRCLE,
        emitRadius: 20,
        animation: {
            rotation: { start: [0, Math.PI * 2], delta: 2 },
            speed: { start: [20, 250], end: 20 },

            acceleration: new Vec2(0, 100),

            scale: { start: [0.8, 1.2], end: 0 },

            color: {
                start: new Color(255, 255, 255, 255),
                end: new Color(255, 50, 0, 0)
            },
        },
        localSpace : false
    });

    emitter.start();

    loop((time, delta) => {
        rapid.clear();
        ms.translate(Math.sin(time) * 200 - 200 / 2 + 720 / 2, 180)
        emitter.update(delta);
        emitter.render();
        rapid.flush();
    });
}
