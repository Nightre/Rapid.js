/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid) {
  const sprite = await rapid.texture.load("./image/sprite.png");
  const toycar = await rapid.texture.load("./image/toycar.png");
  const tree = await rapid.texture.load("./image/tree.png");

  rapid.clear();

  // Three different textures, still one draw call: the batcher binds several
  // textures at once and picks between them per vertex.
  rapid.drawSprite({ texture: sprite, x: 120, y: 120, origin: 0.5 });
  rapid.drawSprite({ texture: toycar, x: 240, y: 120, origin: 0.5 });
  rapid.drawSprite({ texture: tree, x: 360, y: 120, origin: 0.5 });

  // color tints a sprite, flipX/flipY mirror it.
  rapid.drawSprite({ texture: toycar, x: 180, y: 220, origin: 0.5, flipX: true });
  rapid.drawSprite({ texture: toycar, x: 300, y: 220, origin: 0.5, flipY: true });

  rapid.flush();
}
