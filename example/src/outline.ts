import { Color } from '../../src/color.ts';
import catUrl from '../cat3.png';
import cat2Url from '../cat4.png';


// @ts-ignore
export async function init() {
    // noshow start
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const { Rapid } = await import('../../src/render.ts');
    const { CustomGlShader } = await import('../../src/webgl/glshader.ts');
    // noshow end

    const rapid = new Rapid({
        canvas,
        logicWidth: 640,
        logicHeight: 480,
        backgroundColor: new Color(0.05, 0.05, 0.12, 1),
    });

    const [tex1, tex2] = await Promise.all([
        rapid.texture.load(catUrl),
        rapid.texture.load(cat2Url),
    ]);

    // Outline shader — samples neighboring UV positions via sampleTexture().
    // sampleTexture() always picks the correct texture unit, so this works
    // even in a batched draw call with multiple textures.
    const outlineShader = new CustomGlShader(rapid,
        `void vertex(inout vec4 position, inout vec2 region) {}`,
        `
uniform vec4  u_color;   // outline color
uniform float u_width;   // outline width in UV space

vec4 sampleTexture2(vec2 uv) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
    return sampleTexture(uv);
}
void fragment(inout vec4 color) {
    color = sampleTexture2(vRegion);

    if (color.a < 0.01) {
        float w = u_width;
        float a = sampleTexture2(vRegion + vec2( w,  0)).a
                + sampleTexture2(vRegion + vec2(-w,  0)).a
                + sampleTexture2(vRegion + vec2( 0,  w)).a
                + sampleTexture2(vRegion + vec2( 0, -w)).a
                + sampleTexture2(vRegion + vec2( w,  w)).a * 0.7  // 对角
                + sampleTexture2(vRegion + vec2(-w,  w)).a * 0.7
                + sampleTexture2(vRegion + vec2( w, -w)).a * 0.7
                + sampleTexture2(vRegion + vec2(-w, -w)).a * 0.7;
        if (a > 0.0) color = u_color;
    }
}`
    );

    // Outline width in pixels — both textures will have the same screen-pixel outline
    // u_width (UV space) = OUTLINE_PX / tex.width   (pixels → UV ratio)
    // PADDING must be >= OUTLINE_PX to give the shader room to draw the outline
    const OUTLINE_PX = 3;
    const PADDING = OUTLINE_PX + 2;  // a bit of extra room

    const padded1 = tex1.withPadding(PADDING);
    const padded2 = tex2.withPadding(PADDING);

    // Precomputed UV-space widths for each texture
    const w1 = OUTLINE_PX / tex1.width;   // e.g. 3/64  ≈ 0.047
    const w2 = OUTLINE_PX / tex2.width;   // e.g. 3/128 ≈ 0.023 — same px, different UV ratio

    let time = 0;

    return {
        loop(dt: number) {
            rapid.clear();
            const ms = rapid.matrixStack;
            time += dt;

            // --- Red outlined sprites (tex1) ---
            outlineShader.setUniforms({ u_color: [1.0, 0.25, 0.25, 1.0], u_width: w1 });
            for (let i = 0; i < 5; i++) {
                ms.identity();
                ms.translate(60 + i * 120, 140 + Math.sin(time + i) * 40);
                ms.rotateWithOffset(time * 0.4 + i, padded1.width / 2, padded1.height / 2);
                rapid.drawSprite(padded1, Color.White(), false, false, outlineShader);
            }

            // --- Blue outlined sprites (tex2) ---
            // u_width uses tex2's own pixel ratio — same OUTLINE_PX, different UV value

            outlineShader.setUniforms({ u_color: [0.3, 0.8, 1.0, 1.0], u_width: w2 });
            for (let i = 0; i < 5; i++) {
                ms.identity();
                ms.translate(60 + i * 120, 320 + Math.cos(time + i) * 30);
                rapid.drawSprite(padded2, Color.White(), false, false, outlineShader);
            }

            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        }
        // noshow end
    };
}
