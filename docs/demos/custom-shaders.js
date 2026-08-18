import { CustomGlShader } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  // A custom shader supplies two hooks rather than a whole program. The
  // vertex hook can displace `position`; the fragment hook receives the
  // already-sampled `color` and rewrites it. Batching, texture binding and
  // the projection matrix stay with the engine.
  //
  // Each hook is spliced into the engine's own shader, so a uniform has to be
  // declared in every stage that uses it — uTime appears in both below.
  const vertexSource = `
uniform float uTime;
uniform float uWobble;

void vertex(inout vec4 position, vec2 uv) {
  // uv runs 0..1 down the quad, so each row shifts by a different amount and
  // the sprite ripples instead of sliding as a block.
  position.x += sin(uv.y * 18.0 + uTime * 3.0) * uWobble;
}
`;

  const fragmentSource = `
uniform float uTime;

void fragment(inout vec4 color) {
  // A plain colour pulse: scale the channels over time.
  float pulse = 0.72 + 0.28 * sin(uTime * 4.0);
  color.rgb *= vec3(1.0, pulse, pulse);

  // Something positional. vRegion is the uv inside the atlas and vUVRect is
  // this sprite's rect within it, so normalising gives 0..1 across the sprite
  // whatever the packing. That drives a highlight sweeping left to right.
  vec2 local = (vRegion - vUVRect.xy) / (vUVRect.zw - vUVRect.xy);
  float band = abs(fract(local.x - uTime * 0.3) - 0.5);
  color.rgb += smoothstep(0.42, 0.5, band) * 0.6 * color.a;
}
`;

  // The trailing object declares the uniforms and their initial values.
  const shader = new CustomGlShader(rapid, vertexSource, fragmentSource, 0, {
    uTime: 0,
    uWobble: 3,
  });

  loop((time) => {
    // Uniforms are set once per frame, not per sprite, so the whole batch
    // still goes out in a single draw call.
    shader.setUniforms({ uTime: time });

    rapid.clear();

    rapid.drawSprite({
      texture: toycar,
      shader,
      x: 240,
      y: 150,
      scale: 3,
      origin: 0.5,
    });

    rapid.flush();
  });
}
