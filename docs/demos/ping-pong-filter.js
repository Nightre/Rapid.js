import { CustomGlShader } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  const vertexSource = `
    void vertex(inout vec4 position, vec2 uv) {
    }
  `;

  const blurSource = `
    uniform vec2 uDir;
    uniform vec2 uTexel;

    void fragment(inout vec4 color) {
      vec4 sum = vec4(0.0);
      sum += sampleClampTexture(vRegion - uDir * uTexel * 3.0) * 0.10;
      sum += sampleClampTexture(vRegion - uDir * uTexel * 2.0) * 0.15;
      sum += sampleClampTexture(vRegion - uDir * uTexel) * 0.20;
      sum += color * 0.10;
      sum += sampleClampTexture(vRegion + uDir * uTexel) * 0.20;
      sum += sampleClampTexture(vRegion + uDir * uTexel * 2.0) * 0.15;
      sum += sampleClampTexture(vRegion + uDir * uTexel * 3.0) * 0.10;
      color = sum;
    }
  `;

  const tintSource = `
    uniform float uTime;

    void fragment(inout vec4 color) {
      float glow = 0.6 + 0.4 * sin(uTime * 3.0);
      color.rgb *= vec3(1.0, glow, 0.6 + 0.4 * glow);
    }
  `;

  const texel = [1 / toycar.base.width, 1 / toycar.base.height];

  const blurX = new CustomGlShader(rapid, vertexSource, blurSource, 0, {
    uDir: [1, 0],
    uTexel: texel,
  }).setPadding(6);

  const blurY = new CustomGlShader(rapid, vertexSource, blurSource, 0, {
    uDir: [0, 1],
    uTexel: texel,
  }).setPadding(6);

  const tint = new CustomGlShader(rapid, vertexSource, tintSource, 0, {
    uTime: 0,
  });

  loop((time) => {
    tint.setUniforms({ uTime: time });

    const filtered = rapid.applyFilters(toycar, [blurX, blurY, tint]);

    rapid.clear();

    rapid.drawSprite({ texture: toycar, x: 150, y: 150, scale: 2, origin: 0.5 });
    rapid.drawSprite({ texture: filtered, x: 330, y: 150, scale: 2, origin: 0.5 });

    rapid.flush();
  });
}
