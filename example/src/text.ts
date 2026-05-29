import { Color } from '../../src/color.ts';
import { Vec2 } from '../../src/math.ts';
import { Rapid, TextureFilterMode } from '../../src/render.ts';
import { TextureWrapMode, type ITextOptions, type TextTexture } from '../../src/texture.ts';

const baselines: CanvasTextBaseline[] = [
    'top',
    'hanging',
    'middle',
    'alphabetic',
    'ideographic',
    'bottom',
];

const aligns: NonNullable<ITextOptions['align']>[] = ['left', 'center', 'right'];

export async function init() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const rapid = new Rapid({
        canvas,
        logicWidth: 960,
        logicHeight: 720,
        physicsWidth: 960,
        physicsHeight: 720,
        backgroundColor: Color.fromHex('#f7f8fb'),
        textureFilter: TextureFilterMode.LINEAR,
    });

    const makeText = (options: ITextOptions) => rapid.texture.createTextTexture({
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: '600',
        fill: '#17202a',
        stroke: '#ffffff',
        strokeThickness: 3,
        align: 'left',
        baseline: 'top',
        textureFilter: TextureFilterMode.LINEAR,
        wrap: TextureWrapMode.CLAMP,
        ...options,
    });

    const title = makeText({
        text: 'TextTexture\nfill / stroke / font / lineHeight',
        fontFamily: 'Georgia, serif',
        fontSize: 38,
        fontWeight: '700',
        fill: '#163a5f',
        stroke: '#dff2ff',
        strokeThickness: 5,
    });

    const dynamic = makeText({
        text: 'text setter',
        fontSize: 28,
        fontWeight: '800',
        fill: '#0f766e',
        stroke: '#ffffff',
        strokeThickness: 4,
        align: 'center',
        baseline: 'middle',
    });

    const baselineTexts = baselines.map((baseline) => makeText({
        text: `baseline: ${baseline}`,
        fontSize: 26,
        fontWeight: '700',
        fill: baseline === 'middle' || baseline === 'bottom' ? '#a33a10' : '#243447',
        stroke: '#ffffff',
        strokeThickness: 3,
        baseline,
    }));

    const alignTexts = aligns.map((align) => makeText({
        text: `align: ${align}`,
        fontSize: 26,
        fontWeight: '700',
        fill: align === 'center' ? '#155e75' : '#26323f',
        stroke: '#ffffff',
        strokeThickness: 3,
        align,
        baseline: 'middle',
    }));

    const note = makeText({
        text: 'cross = draw position / anchor\nbox = actual texture bounds',
        fontSize: 17,
        fontWeight: '500',
        fill: '#4b5563',
        strokeThickness: 0,
    });

    const alignLabel = makeText({
        text: 'left / center / right align',
        fontSize: 18,
        fontWeight: '700',
        fill: '#374151',
        strokeThickness: 0,
    });

    let time = 0;
    let dynamicUpdateTime = -1;

    const line = (from: Vec2, to: Vec2, color: Color, width = 1) => {
        rapid.drawLine({
            points: [from, to],
            width,
            color,
            roundCap: false,
        });
    };

    const box = (texture: TextTexture, x: number, y: number, color: Color) => {
        const left = x + texture.offsetX;
        const top = y + texture.offsetY;
        const right = left + texture.width;
        const bottom = top + texture.height;

        rapid.drawLine({
            points: [
                new Vec2(left, top),
                new Vec2(right, top),
                new Vec2(right, bottom),
                new Vec2(left, bottom),
            ],
            width: 1,
            closed: true,
            color,
        });
    };

    const anchor = (x: number, y: number) => {
        line(new Vec2(x - 9, y), new Vec2(x + 9, y), Color.fromHex('#d33f49'), 2);
        line(new Vec2(x, y - 9), new Vec2(x, y + 9), Color.fromHex('#2563eb'), 2);
        rapid.drawCircle({
            x,
            y,
            radius: 3,
            color: Color.fromHex('#111827'),
            segments: 16,
        });
    };

    const drawText = (texture: TextTexture, x: number, y: number, bounds = true) => {
        rapid.drawSprite({ texture, x, y });
        if (bounds) box(texture, x, y, Color.fromHex('#00000066'));
    };

    const drawBaselineRows = () => {
        const x = 190;
        const startY = 230;
        const gap = 72;

        baselineTexts.forEach((texture, i) => {
            const y = startY + i * gap;

            line(new Vec2(55, y), new Vec2(590, y), Color.fromHex('#d33f4944'), 1);
            anchor(x, y);
            drawText(texture, x, y);
        });
    };

    const drawAlignRows = () => {
        const x = 775;
        const startY = 230;
        const gap = 68;

        line(new Vec2(x, 185), new Vec2(x, 405), Color.fromHex('#2563eb44'), 1);

        aligns.forEach((align, i) => {
            const y = startY + i * gap;
            const texture = alignTexts[i];

            anchor(x, y);
            drawText(texture, x, y);
        });

        drawText(alignLabel, 670, 430, false);
    };

    const drawDynamicText = () => {
        const x = 700;
        const y = 585;
        const pulse = Math.sin(time * 3) * 0.5 + 0.5;
        const hue = Math.round(175 + pulse * 95);
        const updateBucket = Math.floor(time * 10);

        if (updateBucket !== dynamicUpdateTime) {
            dynamicUpdateTime = updateBucket;
            dynamic.text = `text setter: ${time.toFixed(1)}s\nstyle setter: hsl(${hue}, 70%, 38%)\n111\n111\n111`;
            dynamic.style = {
                fill: `hsl(${hue}, 70%, 38%)`,
                stroke: '#ffffff',
                strokeThickness: 4,
            };
        }

        line(new Vec2(540, y), new Vec2(910, y), Color.fromHex('#16a34a44'), 1);
        line(new Vec2(x, 515), new Vec2(x, 660), Color.fromHex('#16a34a44'), 1);
        anchor(x, y);
        rapid.drawSprite({ texture: dynamic, x, y });
        box(dynamic, x, y, Color.fromHex('#00000066'));
    };

    return {
        loop(dt: number) {
            time += dt;
            rapid.clear();

            rapid.drawRect({
                x: 28,
                y: 24,
                width: 904,
                height: 120,
                color: Color.fromHex('#e8eef7'),
            });
            drawText(title, 48, 38, false);
            drawText(note, 690, 70, false);

            drawBaselineRows();
            drawAlignRows();
            drawDynamicText();

            rapid.flush();
        },
    };
}
