/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid) {
  // Textures are cached by URL, so loading the same file twice is free.
  const sprite = await rapid.texture.load("./image/sprite.png");
  const tree = await rapid.texture.load("./image/tree.png");
  const texture = await rapid.texture.load("./image/texture.png");

  rapid.clear();

  // origin is a normalised anchor: 0 is the top-left corner (the default),
  // 0.5 the centre. So x/y below is where the middle of each image lands.
  rapid.drawSprite({ texture: sprite, x: 120, y: 150, origin: 0.5 });
  rapid.drawSprite({ texture: tree, x: 240, y: 150, origin: 0.5 });
  rapid.drawSprite({ texture, x: 360, y: 150, origin: 0.5 });

  rapid.flush();
}
