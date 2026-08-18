import { CustomGlShader, TextureWrapMode } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  // The extra texture. REPEAT wrap lets the shader sample past 0..1 and have
  // it tile, which is what makes it scroll seamlessly.
  const pattern = await rapid.texture.load("./image/line-texture.png", {
    wrap: TextureWrapMode.REPEAT,
  });

  const vertexSource = `
void vertex(inout vec4 position, vec2 uv) {
}
`;

  // The sprite's own texture is sampled by the engine and arrives as `color`.
  // uPattern is a second, unrelated texture that this shader samples itself,
  // at its own scale and its own scrolling offset.
  const fragmentSource = `
uniform sampler2D uPattern;
uniform float uTime;
uniform float uMix;

void fragment(inout vec4 color) {
  // vRegion is the uv inside the atlas; vUVRect is this sprite's rect within
  // it. Normalising gives 0..1 across the sprite whatever the packing, which
  // is what the second texture needs to be addressed in sprite space.
  vec2 local = (vRegion - vUVRect.xy) / (vUVRect.zw - vUVRect.xy);
  vec2 patternUV = local * 2.0 + vec2(uTime * 0.25, uTime * 0.1);

  vec4 sampled = texture(uPattern, patternUV);

  // Keep the sprite's own alpha, so the pattern is clipped to its silhouette
  // and only the colour comes from the second texture.
  color.rgb = mix(color.rgb, sampled.rgb, uMix);
}
`;

  // The `1` reserves one texture unit beyond the sprite's own. Without it
  // uPattern would collide with the batcher's texture bindings.
  const shader = new CustomGlShader(rapid, vertexSource, fragmentSource, 1, {
    uTime: 0,
    uMix: 1,
  });

  // A WebGLTexture passed through setUniforms binds to that reserved unit.
  shader.setUniforms({ uPattern: pattern.glTexture });

  const labelSprite = rapid.texture.createTextTexture({
    text: "sprite texture",
    fontSize: 13,
    fill: "#5a6877",
  });
  const labelResult = rapid.texture.createTextTexture({
    text: "mixed in the shader",
    fontSize: 13,
    fill: "#243142",
  });
  const labelPattern = rapid.texture.createTextTexture({
    text: "extra texture",
    fontSize: 13,
    fill: "#5a6877",
  });

  loop((time) => {
    // Sweeping the blend back and forth makes it obvious which pixels come
    // from which texture.
    shader.setUniforms({
      uTime: time,
      uMix: 0.5 + 0.5 * Math.sin(time * 1.2),
    });

    rapid.clear();

    // Left: the sprite on its own, no shader.
    rapid.drawSprite({ texture: toycar, x: 80, y: 130, scale: 1.6, origin: 0.5 });
    rapid.drawSprite({ texture: labelSprite, x: 80, y: 200, origin: 0.5 });

    // Middle: the same sprite with the extra texture blended into it.
    rapid.drawSprite({
      texture: toycar,
      shader,
      x: 240,
      y: 130,
      scale: 1.6,
      origin: 0.5,
    });
    rapid.drawSprite({ texture: labelResult, x: 240, y: 200, origin: 0.5 });

    // Right: the extra texture itself, drawn plainly for comparison.
    rapid.drawSprite({ texture: pattern, x: 400, y: 130, scale: 1.6, origin: 0.5 });
    rapid.drawSprite({ texture: labelPattern, x: 400, y: 200, origin: 0.5 });

    rapid.flush();
  });
}
