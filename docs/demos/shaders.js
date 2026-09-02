import { CustomGlShader, TextureWrapMode } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
    const [toycar, pattern] = await Promise.all([
        rapid.texture.load("./image/toycar.png"),
        rapid.texture.load("./image/line-texture.png", {
            wrap: TextureWrapMode.REPEAT,
        }),
    ]);

    const wobbleVertex = `
        uniform mediump float uTime;
        uniform float uWobble;

        void vertex(inout vec4 position, vec2 uv) {
        position.x += sin(uv.y * 18.0 + uTime * 3.0) * uWobble;
        }
    `;
    const wobbleFragment = `
        uniform mediump float uTime;

        void fragment(inout vec4 color) {
        float pulse = 0.72 + 0.28 * sin(uTime * 4.0);
        color.rgb *= vec3(1.0, pulse, pulse);
        }
    `;
    const wobbleShader = new CustomGlShader(
        rapid,
        wobbleVertex,
        wobbleFragment,
        0,
        { uTime: 0, uWobble: 7 },
    );

    const passthroughVertex = `
        void vertex(inout vec4 position, vec2 uv) {
        }
    `;
    const outlineFragment = `
        uniform vec2 uTexel;
        uniform vec4 uOutlineColor;
        uniform float uThickness;

        void fragment(inout vec4 color) {
        if (color.a > 0.0) return;

        float around = 0.0;
        for (int i = 0; i < 12; i++) {
            float angle = float(i) * 0.5236;
            vec2 offset = vec2(cos(angle), sin(angle)) * uTexel * uThickness;
            around = max(around, sampleClampTexture(vRegion + offset).a);
        }
        color = uOutlineColor * around;
        }
    `;
    const MAX_OUTLINE = 4;
    const outlineShader = new CustomGlShader(
        rapid,
        passthroughVertex,
        outlineFragment,
        0,
        {
            uTexel: [1 / toycar.base.width, 1 / toycar.base.height],
            uOutlineColor: [1, 0.88, 0.08, 1],
            uThickness: 1,
        },
    ).setPadding(MAX_OUTLINE);

    const textureFragment = `
        uniform sampler2D uPattern;
        uniform float uTime;
        uniform float uMix;

        void fragment(inout vec4 color) {
        vec2 local = (vRegion - vUVRect.xy) / (vUVRect.zw - vUVRect.xy);
        vec2 patternUV = local * 2.0 + vec2(uTime * 0.25, uTime * 0.1);
        vec4 sampled = texture(uPattern, patternUV);
        color.rgb = mix(color.rgb, sampled.rgb, uMix);
        }
    `;
    const textureShader = new CustomGlShader(
        rapid,
        passthroughVertex,
        textureFragment,
        1,
        { uTime: 0, uMix: 1 },
    );
    textureShader.setUniforms({ uPattern: pattern.glTexture });

    const makeLabel = (text) =>
        rapid.texture.createTextTexture({
            text,
            fontSize: 14,
            fontWeight: "bold",
            fill: "#526272",
            align: "center",
            lineHeight: 1.1,
        });
    const labels = [
        makeLabel("Custom shader\nvertex + fragment"),
        makeLabel("Outline shader\npadded sampling"),
        makeLabel("Extra texture\nsecond sampler"),
    ];

    loop((time) => {
        wobbleShader.setUniforms({ uTime: time });

        const pulse = 0.5 + 0.5 * Math.sin(time * 2.5);
        outlineShader.setUniforms({
            uThickness: 1 + (MAX_OUTLINE - 1) * pulse,
        });

        textureShader.setUniforms({
            uTime: time,
            uMix: 0.5 + 0.5 * Math.sin(time * 1.2),
        });

        rapid.clear();

        rapid.drawSprite({
            texture: toycar,
            shader: wobbleShader,
            x: 80,
            y: 125,
            scale: 1.6,
            origin: 0.5,
        });
        rapid.drawSprite({
            texture: toycar,
            shader: outlineShader,
            x: 240,
            y: 125,
            scale: 1.6,
            origin: 0.5,
        });
        rapid.drawSprite({
            texture: toycar,
            shader: textureShader,
            x: 400,
            y: 125,
            scale: 1.6,
            origin: 0.5,
        });

        for (let i = 0; i < labels.length; i++) {
            rapid.drawSprite({
                texture: labels[i],
                x: 80 + i * 160,
                y: 215,
                origin: 0.5,
            });
        }

        rapid.flush();
    });

    return () => {
        wobbleShader.destroy();
        outlineShader.destroy();
        textureShader.destroy();
    };
}
