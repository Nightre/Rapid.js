import { CustomGlShader } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  const MAX_THICKNESS = 5;

  const vertexSource = `
void vertex(inout vec4 position, vec2 uv) {
}
`;

  // A transparent pixel that has an opaque neighbour within uThickness texels
  // is sitting just outside the silhouette, so paint the outline colour there.
  // Sampling a ring of directions rather than only the four axes keeps the
  // thickness even around diagonal edges.
  const fragmentSource = `
uniform vec2 uTexel;
uniform vec4 uOutlineColor;
uniform float uThickness;

void fragment(inout vec4 color) {
  if (color.a > 0.0) return;

  float around = 0.0;
  for (int i = 0; i < 12; i++) {
    float angle = float(i) * 0.5236; // 2*pi / 12
    vec2 offset = vec2(cos(angle), sin(angle)) * uTexel * uThickness;
    around = max(around, sampleClampTexture(vRegion + offset).a);
  }

  color = uOutlineColor * around;
}
`;

  const shader = new CustomGlShader(rapid, vertexSource, fragmentSource, 0, {
    // One texel step, which lets uThickness be expressed in whole pixels.
    uTexel: [1 / toycar.base.width, 1 / toycar.base.height],
    uOutlineColor: [1, 0.88, 0.08, 1],
    uThickness: 1,
  })
    // The outline falls outside the sprite's own bounds, so the quad has to
    // grow to make room. Padding is fixed when the shader is built, so it is
    // sized for the thickest the animation ever gets — anything past this
    // would be clipped.
    .setPadding(MAX_THICKNESS);

  loop((time) => {
    // Only the uniform animates; the geometry never changes.
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.5);
    shader.setUniforms({ uThickness: 1 + (MAX_THICKNESS - 1) * pulse });

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
