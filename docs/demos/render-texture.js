import { Color } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  // An offscreen target. A RenderTexture *is* a Texture, so once something
  // has been drawn into it you can hand it straight to drawSprite.
  const scene = rapid.texture.createRenderTexture({ width: 160, height: 160 });

  loop((time) => {
    // drawToRenderTexture binds the target, clears it, runs the callback and
    // unbinds again. Coordinates inside are relative to the target, not the
    // canvas: (0, 0) is the target's top-left.
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

    // The whole offscreen scene is now one texture, so it can be transformed
    // and repeated as a unit — six draw calls became one sprite.
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
