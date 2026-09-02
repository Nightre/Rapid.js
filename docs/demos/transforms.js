import { Color, Vec2 } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const [box, toycar] = await Promise.all([
    rapid.texture.load("./image/box.png"),
    rapid.texture.load("./image/toycar.png"),
  ]);

  const makeLabel = (text) =>
    rapid.texture.createTextTexture({
      text,
      fontSize: 14,
      fontWeight: "bold",
      fill: "#526272",
      align: "center",
    });

  const labels = [
    makeLabel("Transform options"),
    makeLabel("Matrix stack tree"),
    makeLabel("updateMatrix"),
    makeLabel("Custom matrices"),
  ];
  const divider = new Color(205, 225, 235);

  loop((time) => {
    rapid.clear();

    rapid.drawLine({
      points: [new Vec2(240, 8), new Vec2(240, 292)],
      width: 1,
      color: divider,
    });
    rapid.drawLine({
      points: [new Vec2(8, 150), new Vec2(472, 150)],
      width: 1,
      color: divider,
    });

    rapid.drawSprite({ texture: labels[0], x: 120, y: 20, origin: 0.5 });
    rapid.drawSprite({ texture: labels[1], x: 360, y: 20, origin: 0.5 });
    rapid.drawSprite({ texture: labels[2], x: 120, y: 168, origin: 0.5 });
    rapid.drawSprite({ texture: labels[3], x: 360, y: 168, origin: 0.5 });

    // Transform options compose position, rotation, scale and origin.
    rapid.drawSprite({
      texture: box,
      x: 120,
      y: 88,
      rotation: time,
      scale: 0.75 + Math.sin(time * 2) * 0.18,
      origin: 0.5,
    });

    // A three-level articulated hierarchy built with save/restore.
    const stack = rapid.matrixStack;
    stack.save();
    stack.translate(315, 88);
    stack.rotate(Math.sin(time) * 0.55);
    rapid.drawRect({ x: 0, y: -9, width: 52, height: 18, color: new Color(231, 76, 60) });

    stack.save();
    stack.translate(47, 0);
    stack.rotate(Math.sin(time * 1.5) * 0.9 + 0.35);
    rapid.drawRect({ x: 0, y: -7, width: 42, height: 14, color: new Color(46, 204, 113) });

    stack.save();
    stack.translate(37, 0);
    stack.rotate(Math.sin(time * 2.4));
    rapid.drawRect({ x: 0, y: -5, width: 25, height: 10, color: new Color(52, 152, 219) });
    stack.restore();
    stack.restore();
    stack.restore();

    // Store a hierarchy, draw its old world matrices in orange, then rewrite
    // one local matrix. updateMatrix recomputes that node and its child, which
    // are drawn again in green without rebuilding the hierarchy.
    const hub = stack.save();
    stack.translate(105, 232);

    const orbit = stack.save();
    stack.rotate(time);
    stack.translate(48, 0);

    const child = stack.save();
    stack.rotate(time * 3);
    stack.translate(28, 0);

    stack.restore();
    stack.restore();
    stack.restore();

    rapid.drawCircle({ radius: 7, color: new Color(52, 73, 94), customMatrix: hub.world });
    rapid.drawCircle({ radius: 7, color: new Color(255, 143, 112), customMatrix: orbit.world });
    rapid.drawCircle({ radius: 5, color: new Color(255, 143, 112), customMatrix: child.world });

    rapid.matrix.identity(orbit.local);
    rapid.matrix.rotate(orbit.local, -time * 1.4);
    rapid.matrix.translate(orbit.local, 58, 0);
    stack.updateMatrix(orbit.step);

    rapid.drawCircle({ radius: 7, color: new Color(95, 195, 122), customMatrix: orbit.world });
    rapid.drawCircle({ radius: 5, color: new Color(95, 195, 122), customMatrix: child.world });

    // A retained scene graph can skip the stack and supply matrix slots
    // directly. Here every sprite owns a small animated matrix.
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 3; column++) {
        const wave = Math.sin(time * 2 + (column + row) * 0.7);
        const slot = rapid.matrix.alloc();
        rapid.matrix.identity(slot);
        rapid.matrix.translate(slot, 300 + column * 60, 215 + row * 55);
        rapid.matrix.rotate(slot, wave * 0.8);
        rapid.matrix.scale(slot, 0.42 + wave * 0.06, 0.42 + wave * 0.06);
        rapid.matrix.translate(slot, -32, -32);
        rapid.drawSprite({ texture: toycar, customMatrix: slot });
      }
    }

    rapid.flush();
  });
}
