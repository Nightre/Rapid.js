import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  const scene = rapid.texture.createRenderTexture({ width: 160, height: 160 });

  loop((time) => {
    rapid.drawToRenderTexture(scene, () => {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time;
        rapid.drawSprite({
          texture: toycar,
          x: 80 + Math.cos(angle) * 45,
          y: 80 + Math.sin(angle) * 45,
          rotation: angle,
          scale: 0.7,
          origin: 0.5,
        });
      }
      rapid.flush();
    });

    rapid.clear();

    rapid.drawSprite({ texture: scene, x: 130, y: 150, origin: 0.5 });

    rapid.drawSprite({
      texture: scene,
      x: 320,
      y: 150,
      rotation: -time * 0.5,
      scale: 0.55 + 0.15 * Math.sin(time * 2),
      origin: 0.5,
      color: new Color(255, 210, 190),
    });

    rapid.flush();
  });
}
