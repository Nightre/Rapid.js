import { Color } from '../../src/color.ts';
import catUrl from '../cat.png';

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

    const tex = await rapid.texture.load(catUrl);

    // --- Filter 1: Horizontal Gaussian blur ---
    const blurH = new CustomGlShader(rapid,
        `void vertex(inout vec4 position, inout vec2 region) {}`,
        `
uniform float u_px;   // 1.0 / textureWidth

void fragment(inout vec4 color) {
    color = sampleTexture(vRegion + vec2(-2.0 * u_px, 0.0)) * 0.06
          + sampleTexture(vRegion + vec2(-1.0 * u_px, 0.0)) * 0.24
          + sampleTexture(vRegion)                           * 0.40
          + sampleTexture(vRegion + vec2( 1.0 * u_px, 0.0)) * 0.24
          + sampleTexture(vRegion + vec2( 2.0 * u_px, 0.0)) * 0.06;
}`
    );

    // --- Filter 2: Vertical Gaussian blur ---
    const blurV = new CustomGlShader(rapid,
        `void vertex(inout vec4 position, inout vec2 region) {}`,
        `
uniform float u_px;   // 1.0 / textureHeight

void fragment(inout vec4 color) {
    color = sampleTexture(vRegion + vec2(0.0, -2.0 * u_px)) * 0.06
          + sampleTexture(vRegion + vec2(0.0, -1.0 * u_px)) * 0.24
          + sampleTexture(vRegion)                           * 0.40
          + sampleTexture(vRegion + vec2(0.0,  1.0 * u_px)) * 0.24
          + sampleTexture(vRegion + vec2(0.0,  2.0 * u_px)) * 0.06;
}`
    );

    // --- Filter 3: Tint / color shift ---
    const tint = new CustomGlShader(rapid,
        `void vertex(inout vec4 position, inout vec2 region) {}`,
        `
uniform float u_time;

void fragment(inout vec4 color) {
    color.r = color.r * (0.6 + 0.4 * sin(u_time));
    color.g = color.g * (0.6 + 0.4 * cos(u_time * 0.7));
    color.b = color.b * (0.6 + 0.4 * sin(u_time * 1.3 + 1.0));
}`
    );

    blurH.setUniforms({ u_px: 4.0 / tex.width });
    blurV.setUniforms({ u_px: 4.0 / tex.height });

    let time = 0;

    return {
        loop(dt: number) {
            rapid.clear();
            const ms = rapid.matrixStack;
            time += dt;

            tint.setUniforms({ u_time: time });

            // Original texture — top left
            ms.identity();
            ms.translate(20, 100);
            rapid.drawSprite(tex);

            // Single blur pass (horizontal only) — top right
            const blurredH = rapid.applyFilters(tex, [blurH]);
            ms.identity();
            ms.translate(200, 100);
            rapid.drawSprite(blurredH);

            // Animated: only tint, no blur
            ms.identity();
            ms.translate(380, 100);
            rapid.drawSprite(rapid.applyFilters(tex, [blurV]));

            // Animated: only tint, no blur
            ms.identity();
            ms.translate(380 + 180, 100);
            rapid.drawSprite(rapid.applyFilters(tex, [tint]));

            // Full Gaussian blur (H + V) — bottom left
            const blurred = rapid.applyFilters(tex, [blurH, blurV]);
            ms.identity();
            ms.translate(20, 180);
            rapid.drawSprite(blurred);

            // All three filters chained: blur H → blur V → color tint — bottom right
            const filtered = rapid.applyFilters(tex, [blurH, blurV, tint]);
            ms.identity();
            ms.translate(200, 180);
            rapid.drawSprite(filtered);


            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        }
        // noshow end
    };
}
