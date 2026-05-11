import { Color } from '../../src/color.ts';
import catUrl from '../cat.png';
import cat2Url from '../cat2.png';

// @ts-ignore
export async function init() {
    // noshow start
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const { Rapid, BlendMode } = await import('../../src/render.ts');
    // noshow end

    const rapid = new Rapid({
        canvas,
        logicWidth: 640,
        logicHeight: 480,
        backgroundColor: Color.fromNorm(0.05, 0.05, 0.12)
    });

    const tex1 = await rapid.texture.load(catUrl);
    const tex2 = await rapid.texture.load(cat2Url);
    let time = 0;

    return {
        loop(dt: number) {
            rapid.clear();
            const ms = rapid.matrixStack;

            ms.identity();
            const w1 = tex1.width;
            const h1 = tex1.height;
            const w2 = tex2.width;
            const h2 = tex2.height;

            // 1. Normal Blend (Alpha Blending)
            ms.save();
            ms.translate(160, 240);
            ms.translate(-w1 / 2, -h1 / 2);
            rapid.drawSprite({ texture: tex1 });

            rapid.setBlendMode(BlendMode.NORMAL);
            ms.translate(Math.sin(time) * 40 - w2 / 2 + w1 / 2, -h2 / 2 + h1 / 2);
            rapid.drawSprite({ texture: tex2 });
            rapid.setBlendMode(BlendMode.NORMAL);
            ms.restore();

            // 2. Additive Blend (Glowing)
            ms.save();
            ms.translate(320, 240);
            ms.translate(-w1 / 2, -h1 / 2);
            rapid.drawSprite({ texture: tex1 });

            rapid.setBlendMode(BlendMode.ADD);
            ms.translate(Math.sin(time) * 40 - w2 / 2 + w1 / 2, -h2 / 2 + h1 / 2);
            // Draw multiple times to highlight glowing
            rapid.drawSprite({ texture: tex2 });
            rapid.drawSprite({ texture: tex2 });
            rapid.setBlendMode(BlendMode.NORMAL);
            ms.restore();

            // Actually it's better to draw a white background for the multiply example
            ms.save();
            ms.translate(480, 240);

            ms.translate(-w1 / 2, -h1 / 2);
            rapid.drawSprite({ texture: tex1 });

            rapid.setBlendMode(BlendMode.MULTIPLY);
            ms.translate(Math.sin(time) * 40 - w2 / 2 + w1 / 2, -h2 / 2 + h1 / 2);
            rapid.drawSprite({ texture: tex2 });
            rapid.setBlendMode(BlendMode.NORMAL);
            ms.restore();

            time += dt * 2;
            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        }
        // noshow end
    };
}
