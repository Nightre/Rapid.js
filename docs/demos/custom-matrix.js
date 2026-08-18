/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  const COLUMNS = 7;
  const ROWS = 4;

  loop((time) => {
    rapid.clear();

    // Skip the matrix stack entirely: allocate a slot per object and write
    // its transform directly. This is what a retained scene graph does — it
    // keeps one matrix per node and hands the index to the draw call.
    //
    // clear() resets the matrix store, so the slots are allocated per frame.
    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        const wave = Math.sin(time * 2 + (column + row) * 0.5);

        const slot = rapid.matrix.alloc();
        rapid.matrix.identity(slot);
        rapid.matrix.translate(slot, 60 + column * 60, 60 + row * 60);
        rapid.matrix.rotate(slot, wave * 0.9);
        rapid.matrix.scale(slot, 0.5 + wave * 0.12, 0.5 + wave * 0.12);
        // Baked-in centring: customMatrix takes over positioning completely,
        // so `origin` on the draw call would be ignored.
        rapid.matrix.translate(slot, -32, -32);

        rapid.drawSprite({ texture: toycar, customMatrix: slot });
      }
    }

    rapid.flush();
  });
}
