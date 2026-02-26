// @ts-ignore
import catUrl from '../cat.png';
import cat2Url from '../cat2.png';
export async function init() {
    // noshow start
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const infoEl = document.getElementById('info') as HTMLSpanElement;
    const { Rapid } = await import('../../src/render.ts');
    const { Color } = await import('../../src/color.ts');
    // noshow end   

    const rapid = new Rapid({
        canvas,
        logicWidth: 640,
        logicHeight: 480,
        physicsWidth: 640,
        physicsHeight: 480,
        backgroundColor: new Color(0.05, 0.05, 0.12, 1)
    });

    const [tex1, tex2] = await Promise.all([
        rapid.texture.load(catUrl),
        rapid.texture.load(cat2Url),
    ]);

    const SPRITE_W = tex1.width;
    const SPRITE_H = tex1.height;

    const GRAVITY = 0.75;
    let bounce = -0.85;

    let sprites: any[] = [];
    let count = 0;
    const SPRITES_PER_ADD = 100;

    function addSprites(n: number) {
        for (let i = 0; i < n; i++) {
            sprites.push({
                x: 0,
                y: 0,
                vx: Math.random() * 10,
                vy: Math.random() * 10 - 5,
                tex: Math.random() < 0.5 ? tex1 : tex2,
            });
        }
        count = sprites.length;
    }

    let adding = false;
    const onPointerDown = () => adding = true;
    const onPointerUp = () => adding = false;

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return {
        loop(dt: number) {
            const scale = dt * 60;
            if (adding) {
                addSprites(SPRITES_PER_ADD);
            }
            infoEl.textContent = `Sprites: ${count} | Click canvas to spawn!`;

            rapid.clear();
            const ms = rapid.matrixStack;

            for (const s of sprites) {
                s.vy += GRAVITY * scale;
                s.x += s.vx * scale;
                s.y += s.vy * scale;

                if (s.x < 0) {
                    s.x = 0;
                    s.vx *= -1;
                } else if (s.x + SPRITE_W > rapid.logicWidth) {
                    s.x = rapid.logicWidth - SPRITE_W;
                    s.vx *= -1;
                }

                if (s.y < 0) {
                    s.y = 0;
                    s.vy *= bounce;
                } else if (s.y + SPRITE_H > rapid.logicHeight) {
                    s.y = rapid.logicHeight - SPRITE_H;
                    s.vy *= bounce;
                    if (Math.random() > 0.5) s.vy -= Math.random() * 6;
                }

                ms.identity();
                ms.translate(s.x, s.y);
                rapid.drawSprite(s.tex);
            }
            rapid.flush();
        },
        // noshow start
        resize(newW: number, newH: number) {
            bounce = (newH / 480) * -0.1 - 0.75;
            rapid.resize(newW, newH, newW, newH);
        },

        destroy() {
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
        }
        // noshow end
    };
}
