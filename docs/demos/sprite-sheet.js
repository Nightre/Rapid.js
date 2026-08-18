/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const sheet = await rapid.texture.load("./image/sprite-sheet.png");

  // The sheet is 512x64: eight 64x64 frames in a row. getSubTexture carves out
  // one frame by pixel rect. Every frame points at the same GPU texture, so
  // drawing several of them still batches into one draw call.
  const FRAME_SIZE = 64;
  const FRAME_COUNT = 8;
  const FPS = 10;

  const frames = Array.from({ length: FRAME_COUNT }, (_, i) =>
    sheet.getSubTexture(i * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE),
  );

  loop((time) => {
    const current = Math.floor(time * FPS) % FRAME_COUNT;

    rapid.clear();

    rapid.drawSprite({
      texture: frames[current],
      x: 240,
      y: 120,
      scale: 2,
      origin: 0.5,
    });

    // The whole strip below, with the playing frame lifted.
    for (let i = 0; i < FRAME_COUNT; i++) {
      rapid.drawSprite({
        texture: frames[i],
        x: 55 + i * 53,
        y: i === current ? 232 : 242,
        scale: 0.75,
        origin: 0.5,
      });
    }

    rapid.flush();
  });
}
