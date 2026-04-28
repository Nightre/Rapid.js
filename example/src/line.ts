import { Color } from '../../src/color.ts';
import { Vec2 } from '../../src/math.ts';
import stickUrl from '../road.png';
import { LineTextureMode } from '../../src/line.ts';
import { TextureWrapMode } from '../../src/texture.ts';

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
        backgroundColor: new Color(0.05, 0.05, 0.12, 1)
    });

    const texStick = await rapid.texture.load(stickUrl, {
        wrap: TextureWrapMode.REPEAT
    });

    let time = 0;

    return {
        loop(dt: number) {
            rapid.clear();

            // 1. Draw a box (closed line)
            rapid.drawLine({
                points: [
                    new Vec2(50, 50),
                    new Vec2(250, 50),
                    new Vec2(250, 250),
                    new Vec2(50, 250)
                ],
                width: 10,
                closed: true,
                roundCap: true
            }, Color.Cyan);

            // 2. Draw a sine line
            const sinPoints: Vec2[] = [];
            for (let i = 0; i <= 100; i++) {
                const x = 300 + i * 3;
                const y = 150 + Math.sin(time * 3 + i * 0.1) * 50;
                sinPoints.push(new Vec2(x, y));
            }
            rapid.drawLine({
                points: sinPoints,
                width: 5,
                roundCap: true,
                closed: false
            }, Color.Yellow);

            // 3. Draw a textured line
            const texturedPoints: Vec2[] = [];
            for (let i = 0; i <= 50; i++) {
                const x = 50 + i * 10;
                const y = 350 + Math.cos(time + i * 0.2) * 50;
                texturedPoints.push(new Vec2(x, y));
            }
            rapid.drawLine({
                points: texturedPoints,
                width: 30,
                texture: texStick,
                textureMode: LineTextureMode.REPEAT,
                roundCap: true,
                closed: false
            }, Color.White); // White so original color shows

            time += dt;
            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        }
        // noshow end
    };
}
