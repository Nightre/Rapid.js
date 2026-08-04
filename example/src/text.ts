import { Color } from '../../src/color.ts';
import { CustomGlShader } from '../../src/webgl/glshader.ts';
import { Rapid, TextureFilterMode } from '../../src/render.ts';
import { TextureWrapMode } from '../../src/texture.ts';

const outlineFragment = `
uniform vec2 uTexelSize;
uniform vec4 uOutlineColor;

void fragment(inout vec4 color) {
    float sourceAlpha = color.a;
    float outlineAlpha = 0.0;

    for (int y = -2; y <= 2; y++) {
        for (int x = -2; x <= 2; x++) {
            vec2 stepOffset = vec2(float(x), float(y));
            if (dot(stepOffset, stepOffset) <= 4.01) {
                outlineAlpha = max(outlineAlpha, sampleClampTexture(vRegion + stepOffset * uTexelSize).a);
            }
        }
    }

    vec4 outline = vec4(uOutlineColor.rgb * uOutlineColor.a, uOutlineColor.a);
    color = mix(outline, color, sourceAlpha);
    color.a = max(sourceAlpha, outlineAlpha * uOutlineColor.a);
}
`;

const coolTintFragment = `
void fragment(inout vec4 color) {
    vec3 coolTint = vec3(0.74, 0.88, 1.0);
    color.rgb = mix(color.rgb, color.rgb * coolTint, 0.35);
}
`;

const flashFragment = `
uniform float uFlash;

void fragment(inout vec4 color) {
    float brightness = mix(0.72, 1.42, uFlash);
    vec3 warmLight = vec3(1.0, 0.94, 0.78);
    color.rgb = color.rgb * brightness + warmLight * (uFlash * 0.18 * color.a);
}
`;

const emptyVertex = `
void vertex(inout vec4 position, vec2 region) {
}
`;

export async function init() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const useFiltersInput = document.getElementById('useFilters') as HTMLInputElement;
    const rapid = new Rapid({
        canvas,
        logicWidth: 960,
        logicHeight: 720,
        physicsWidth: 960,
        physicsHeight: 720,
        backgroundColor: Color.fromHex('#eef2f5'),
        textureFilter: TextureFilterMode.NEAREST,
        roundPixels: true,
    });

    const atlas = await rapid.texture.load('./test.png', {
        textureFilter: TextureFilterMode.NEAREST,
        wrap: TextureWrapMode.CLAMP,
    });

    const frames = [
        atlas.getSubTexture(0, 0, 40, 40),
        atlas.getSubTexture(40, 0, 40, 40),
        atlas.getSubTexture(0, 40, 40, 40),
        atlas.getSubTexture(40, 40, 40, 40),
    ];
    const outlineShader = new CustomGlShader(rapid, emptyVertex, outlineFragment, 0, {
        uTexelSize: [1 / atlas.base!.width, 1 / atlas.base!.height],
        uOutlineColor: [0.02, 0.05, 0.08, 1.0],
    }).setPadding(8);
    const coolTintShader = new CustomGlShader(rapid, emptyVertex, coolTintFragment);
    const flashShader = new CustomGlShader(rapid, emptyVertex, flashFragment, 0, {
        uFlash: 0,
    });
    const drawFilteredSprite = (frame: (typeof frames)[number], x: number, y: number, scale: number) => {
        const filtered = rapid.applyFilters(frame, [coolTintShader, outlineShader, flashShader]);
        rapid.drawSprite({ texture: filtered, x, y, scale });
        rapid.flush();
    };

    const label = rapid.texture.createTextTexture({
        text: 'Texture atlas + 3 shader filters',
        fontFamily: 'Arial, sans-serif',
        fontSize: 30,
        fontWeight: '700',
        fill: '#203040',
        stroke: '#ffffff',
        strokeThickness: 4,
        textureFilter: TextureFilterMode.LINEAR,
        wrap: TextureWrapMode.CLAMP,
    });

    const hint = rapid.texture.createTextTexture({
        text: 'Checked: tint -> outline padding 8 -> flash. Unchecked: direct outline only, no applyFilters.',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        fontWeight: '600',
        fill: '#52616d',
        textureFilter: TextureFilterMode.LINEAR,
        wrap: TextureWrapMode.CLAMP,
    });

    let time = 0;

    return {
        loop(dt: number) {
            time += dt;
            rapid.clear();
            const useFilters = useFiltersInput.checked;

            if (useFilters) {
                flashShader.setUniforms({
                    uFlash: Math.sin(time * 1.6) * 0.5 + 0.5,
                });
            }

            rapid.drawSprite({ texture: label, x: 40, y: 36 });
            rapid.drawSprite({ texture: hint, x: 42, y: 82 });

            const scale = 5;
            const cell = 40 * scale;
            const startX = 240;
            const startY = 190;
            const gap = 60;

            frames.forEach((frame, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const bob = Math.sin(time * 2.2 + index * 0.7) * 7;
                const x = startX + col * (cell + gap);
                const y = startY + row * (cell + gap) + bob;

                rapid.drawRect({
                    x: x - 16,
                    y: y - 16,
                    width: cell + 32,
                    height: cell + 32,
                    color: Color.fromHex(index % 2 === 0 ? '#dfe8ef' : '#e7edf1'),
                });

                if (useFilters) {
                    drawFilteredSprite(frame, x, y, scale);
                } else {
                    rapid.drawSprite({
                        texture: frame,
                        shader: outlineShader,
                        x,
                        y,
                        scale,
                    });
                }
            });

            const heroFrame = frames[Math.floor(time * 6) % frames.length] ?? frames[0];
            if (useFilters) {
                drawFilteredSprite(heroFrame, 690, 310 + Math.sin(time * 3) * 10, 7);
            } else {
                rapid.drawSprite({
                    texture: heroFrame,
                    shader: outlineShader,
                    x: 690,
                    y: 310 + Math.sin(time * 3) * 10,
                    scale: 7,
                });
            }

            rapid.flush();
        },
    };
}
