// @ts-ignore
import cat3Url from '../cat3.png';
import { Color } from '../../src/color.ts';
import { Vec2 } from '../../src/math.ts';
import { ParticleEmitter, ParticleShape } from '../../src/particle.ts';

// @ts-ignore
export async function init() {
    // noshow start
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const { Rapid } = await import('../../src/render.ts');
    // noshow end

    const rapid = new Rapid({
        canvas,
        logicWidth: 640,
        logicHeight: 480,
        physicsWidth: 640,
        physicsHeight: 480,
        backgroundColor: new Color(0.04, 0.04, 0.10, 1),
    });

    const tex = await rapid.texture.load(cat3Url);

    // ── 1. Fire emitter ─────────────────────────────────────────────────────
    const fireEmitter = new ParticleEmitter(rapid, {
        texture: tex,
        life: [0.6, 1.2],
        emitRate: 40,
        maxParticles: 200,
        emitShape: ParticleShape.CIRCLE,
        emitRadius: 10,
        localSpace: true,
        position: new Vec2(160, 380),
        animation: {
            speed: { start: [50, 90], end: 0 },
            rotation: { start: [-Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5] },
            scale: { start: [1.5, 2.5], end: 0 },
            color: {
                start: new Color(255, 200, 60, 255),
                end:   new Color(180, 30, 0, 0),
            },
        },
    });
    fireEmitter.start();

    // ── 2. Orbit / sparkle emitter ──────────────────────────────────────────
    const sparkleEmitter = new ParticleEmitter(rapid, {
        texture: tex,
        life: [1.0, 1.8],
        emitRate: 20,
        maxParticles: 120,
        emitShape: ParticleShape.CIRCLE,
        emitRadius: 50,
        localSpace: true,
        position: new Vec2(460, 180),
        animation: {
            speed: { start: [30, 60], end: 0 },
            rotation: { start: [0, Math.PI * 2] },
            scale: { start: [0.8, 1.6], end: 0 },
            color: {
                start: [new Color(180, 130, 255, 255), new Color(80, 200, 255, 255)],
                end:   new Color(60, 30, 120, 0),
            },
        },
    });
    sparkleEmitter.start();

    // ── 3. Rain emitter ─────────────────────────────────────────────────────
    const rainEmitter = new ParticleEmitter(rapid, {
        texture: tex,
        life: [0.9, 1.5],
        emitRate: 30,
        maxParticles: 200,
        emitShape: ParticleShape.RECT,
        emitRect: { width: 640, height: 1 },
        localSpace: true,
        position: new Vec2(320, -10),
        animation: {
            speed: 0,
            rotation: { start: Math.PI / 2 },
            scale: { start: [0.5, 1.2], end: 0 },
            velocity: new Vec2(20, 260),
            color: {
                start: new Color(150, 210, 255, 200),
                end:   new Color(80, 130, 220, 0),
            },
        },
    });
    rainEmitter.start();

    // ── 4. Click → explosion burst ──────────────────────────────────────────
    const burstEmitter = new ParticleEmitter(rapid, {
        texture: tex,
        life: [0.4, 0.9],
        emitRate: 60,
        maxParticles: 400,
        emitShape: ParticleShape.CIRCLE,
        emitRadius: 4,
        localSpace: false,
        position: new Vec2(0, 0),
        animation: {
            speed: { start: [100, 240], end: 0, damping: 0.08 },
            rotation: { start: [0, Math.PI * 2] },
            scale: { start: [1.0, 2.0], end: 0 },
            color: {
                start: [new Color(255, 220, 80, 255), new Color(255, 100, 30, 255)],
                end:   new Color(80, 20, 0, 0),
            },
        },
    });

    const onClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const sx = rapid.logicWidth  / rect.width;
        const sy = rapid.logicHeight / rect.height;
        burstEmitter['options'].position = new Vec2(
            (e.clientX - rect.left) * sx,
            (e.clientY - rect.top)  * sy,
        );
        burstEmitter.oneShot();
    };
    canvas.addEventListener('click', onClick);

    let time = 0;

    return {
        loop(dt: number) {
            time += dt;

            // Gently float the sparkle emitter
            sparkleEmitter.position = new Vec2(
                460 + Math.sin(time * 0.7) * 40,
                180 + Math.cos(time * 0.5) * 25,
            );

            fireEmitter.update(dt);
            sparkleEmitter.update(dt);
            rainEmitter.update(dt);
            burstEmitter.update(dt);

            rapid.clear();
            const ms = rapid.matrixStack;

            ms.identity(); rainEmitter.render();
            ms.identity(); fireEmitter.render();
            ms.identity(); sparkleEmitter.render();
            ms.identity(); burstEmitter.render();

            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        },
        destroy() {
            canvas.removeEventListener('click', onClick);
        },
        // noshow end
    };
}
