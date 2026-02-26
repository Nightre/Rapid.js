// home.ts — 首页性能 demo，自动不断增加精灵展示渲染性能

import { Color } from '../src/color.ts';

async function main() {
    const canvas = document.getElementById('demo-canvas') as HTMLCanvasElement;
    const countEl = document.getElementById('demo-count') as HTMLElement;
    const fpsEl = document.getElementById('demo-fps') as HTMLElement;

    const { Rapid } = await import('../src/render.ts');

    const W = canvas.width;
    const H = canvas.height;

    const rapid = new Rapid({
        canvas,
        logicWidth: W,
        logicHeight: H,
        physicsWidth: W,
        physicsHeight: H,
    });
    rapid.backgroundColor = new Color(0.04, 0.04, 0.10, 1);

    const [tex1, tex2] = await Promise.all([
        rapid.texture.load('./cat.png'),
        rapid.texture.load('./cat2.png'),
    ]);

    const SPRITE_W = 48, SPRITE_H = 48;
    const GRAVITY = 0.6;
    const BOUNCE = -0.82;
    const AUTO_ADD_INTERVAL = 400; // ms
    const SPRITES_PER_AUTO = 200;

    interface Sp {
        x: number; y: number;
        vx: number; vy: number;
        tex: any;
    }
    const sprites: Sp[] = [];

    function addSprites(n: number) {
        for (let i = 0; i < n; i++) {
            sprites.push({
                x: 0, y: 0,
                vx: Math.random() * 8 + 2,
                vy: Math.random() * 6 - 3,
                tex: Math.random() < 0.5 ? tex1 : tex2,
            });
        }
    }

    // Auto-add sprites at interval
    let autoTimer = setInterval(() => addSprites(SPRITES_PER_AUTO), AUTO_ADD_INTERVAL);

    // Allow click/hold to add more
    let holding = false;
    canvas.addEventListener('pointerdown', () => holding = true);
    window.addEventListener('pointerup', () => holding = false);

    // FPS tracking
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let fps = 0;

    let lastTime = performance.now();

    function tick(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        frameCount++;
        const elapsed = now - lastFpsTime;
        if (elapsed >= 500) {
            fps = Math.round(frameCount / elapsed * 1000);
            frameCount = 0;
            lastFpsTime = now;
        }

        if (holding) addSprites(50);

        rapid.clear();
        const ms = rapid.matrixStack;
        const scale = dt * 60;

        for (const s of sprites) {
            s.vy += GRAVITY * scale;
            s.x += s.vx * scale;
            s.y += s.vy * scale;

            if (s.x < 0) { s.x = 0; s.vx *= -1; }
            else if (s.x + SPRITE_W > W) { s.x = W - SPRITE_W; s.vx *= -1; }

            if (s.y < 0) { s.y = 0; s.vy *= -BOUNCE; }
            else if (s.y + SPRITE_H > H) {
                s.y = H - SPRITE_H;
                s.vy *= BOUNCE;
                if (Math.random() > 0.5) s.vy -= Math.random() * 4;
            }

            ms.identity();
            ms.translate(s.x, s.y);
            rapid.drawSprite(s.tex);
        }
        if ((rapid as any).currentRegion) (rapid as any).currentRegion.exit();

        countEl.textContent = sprites.length.toLocaleString();
        fpsEl.textContent = fps + ' fps';

        requestAnimationFrame(tick);
    }

    // Kick off with initial batch
    addSprites(SPRITES_PER_AUTO);
    requestAnimationFrame(tick);
}

main();
