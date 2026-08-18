/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");
  const tree = await rapid.texture.load("./image/tree.png");

  loop((time) => {
    rapid.clear();

    // Build a three-level hierarchy: hub -> orbit -> sub-orbit. save() hands
    // back the matrix slots it allocated, so each level can be referenced
    // again later by index.
    const hub = rapid.matrixStack.save();
    rapid.matrixStack.translate(150, 150);

    const orbit = rapid.matrixStack.save();
    rapid.matrixStack.rotate(time);
    rapid.matrixStack.translate(70, 0);

    const subOrbit = rapid.matrixStack.save();
    rapid.matrixStack.rotate(time * 4);
    rapid.matrixStack.translate(38, 0);
    rapid.matrixStack.scale(0.6);

    rapid.matrixStack.restore();
    rapid.matrixStack.restore();
    rapid.matrixStack.restore();

    // customMatrix draws straight into a stored matrix, ignoring the stack.
    // It takes over positioning entirely, so the anchor is the image's
    // top-left corner: any centring has to be baked into the matrix.
    rapid.drawSprite({ texture: toycar, customMatrix: hub.world });
    rapid.drawSprite({ texture: toycar, customMatrix: orbit.world });
    rapid.drawSprite({ texture: toycar, customMatrix: subOrbit.world });

    // Now the point of updateMatrix: rewrite one node's *local* matrix and
    // ask the engine to recompute that node and everything under it, as
    // world = parent x local. The sub-orbit below was never touched, yet it
    // follows, because its parent moved.
    rapid.matrix.identity(orbit.local);
    rapid.matrix.rotate(orbit.local, -time * 1.6);
    rapid.matrix.translate(orbit.local, 110, 0);
    rapid.matrixStack.updateMatrix(orbit.step);

    rapid.drawSprite({ texture: tree, customMatrix: orbit.world });
    rapid.drawSprite({ texture: tree, customMatrix: subOrbit.world });

    rapid.flush();
  });
}
