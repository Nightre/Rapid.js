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
        physicsWidth: 640,
        physicsHeight: 480,
        backgroundColor: Color.fromNorm(0.06, 0.11, 0.22),
    });

    const tex = await rapid.texture.load(catUrl);

    // RenderTexture for the scene (top half) and the reflection (bottom half)
    const HALF_H = 240;
    const sceneRT = rapid.texture.createRenderTexture(640, HALF_H);
    const reflectRT = rapid.texture.createRenderTexture(640, HALF_H);

    // Wave distortion shader applied to the flipped reflection
    const waveShader = new CustomGlShader(rapid,
        `void vertex(inout vec4 position, inout vec2 region) {}`,
        `
uniform float u_time;

void fragment(inout vec4 color) {
    float wave = sin(vRegion.y * 28.0 + u_time * 2.2) * 0.013
               + sin(vRegion.y * 14.0 + u_time * 1.4) * 0.007;
    vec2 uv = vec2(vRegion.x + wave, vRegion.y);
    color = sampleTexture(uv);

    // Water tint: darken and push toward blue
    float depth = vRegion.y;
    color.rgb *= 0.6 - depth * 0.15;
    color.r   *= 0.5;
    color.g   *= 0.8;
    color.b   *= 1.2;
}`
    );

    let time = 0;

    return {
        loop(dt: number) {
            time += dt;
            rapid.clear();
            const ms = rapid.matrixStack;

            waveShader.setUniforms({ u_time: time });

            // Ball position: gentle floating bob
            const ballX = 320 + Math.sin(time * 0.5) * 120;
            const ballY = 90 + Math.sin(time * 0.8) * 22;

            // ── 1. Render scene into sceneRT ──────────────────────────────
            rapid.enterRenderTexture(sceneRT);
            rapid.clearRenderTexture(Color.fromNorm(0.08, 0.14, 0.28));

            // Sky gradient quad
            ms.identity();
            rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
            rapid.addGraphicVertex(0, 0, 0, 0, Color.fromNorm(0.06, 0.10, 0.22).uint32);
            rapid.addGraphicVertex(640, 0, 1, 0, Color.fromNorm(0.06, 0.10, 0.22).uint32);
            rapid.addGraphicVertex(640, HALF_H, 1, 1, Color.fromNorm(0.16, 0.28, 0.50).uint32);
            rapid.addGraphicVertex(0, HALF_H, 0, 1, Color.fromNorm(0.16, 0.28, 0.50).uint32);
            rapid.endGraphic();

            // Moon
            ms.identity();
            ms.translate(540, 45);
            rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
            rapid.addCircleVertex(28, Color.fromNorm(1.0, 0.97, 0.82), 48);
            rapid.endGraphic();

            // Soft moon glow halo
            ms.identity();
            ms.translate(540, 45);
            rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
            rapid.addCircleVertex(50, Color.fromNorm(0.9, 0.87, 0.55, 0.1), 48);
            rapid.endGraphic();

            // The ball (textured sprite)
            ms.identity();
            ms.translate(ballX - tex.width / 2, ballY - tex.height / 2);
            rapid.drawSprite(tex);

            rapid.flush();
            rapid.leaveRenderTexture();

            // ── 2. Flip scene into reflectRT ──────────────────────────────
            rapid.enterRenderTexture(reflectRT);
            rapid.clearRenderTexture(new Color(0, 0, 0, 0));

            ms.identity();
            ms.translate(0, HALF_H);
            ms.scale(1, -1);
            rapid.drawSprite(sceneRT);

            rapid.flush();
            rapid.leaveRenderTexture();

            // ── 3. Composite to screen ────────────────────────────────────

            // Top half: scene
            ms.identity();
            rapid.drawSprite(sceneRT);

            // Thin glowing water-surface divider
            ms.identity();
            ms.translate(0, HALF_H - 1);
            rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
            rapid.addGraphicVertex(0, 0, 0, 0, Color.fromNorm(0.45, 0.82, 1.0, 0.95).uint32);
            rapid.addGraphicVertex(640, 0, 1, 0, Color.fromNorm(0.45, 0.82, 1.0, 0.95).uint32);
            rapid.addGraphicVertex(640, 3, 1, 1, Color.fromNorm(0.25, 0.60, 1.0, 0.0).uint32);
            rapid.addGraphicVertex(0, 3, 0, 1, Color.fromNorm(0.25, 0.60, 1.0, 0.0).uint32);
            rapid.endGraphic();

            // Bottom half: wave-distorted reflection
            ms.identity();
            ms.translate(0, HALF_H);
            rapid.drawSprite(reflectRT, undefined, false, false, waveShader);

            // Subtle blue water overlay
            ms.identity();
            ms.translate(0, HALF_H);
            rapid.startGraphic(rapid.gl.TRIANGLE_FAN);
            rapid.addGraphicVertex(0, 0, 0, 0, Color.fromNorm(0.02, 0.08, 0.26, 0.15).uint32);
            rapid.addGraphicVertex(640, 0, 1, 0, Color.fromNorm(0.02, 0.08, 0.26, 0.15).uint32);
            rapid.addGraphicVertex(640, HALF_H, 1, 1, Color.fromNorm(0.01, 0.04, 0.16, 0.32).uint32);
            rapid.addGraphicVertex(0, HALF_H, 0, 1, Color.fromNorm(0.01, 0.04, 0.16, 0.32).uint32);
            rapid.endGraphic();

            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        }
        // noshow end
    };
}
