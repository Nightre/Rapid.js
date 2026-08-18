/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const textures = await Promise.all(
    ["sprite", "toycar", "tree", "box", "food", "knife"].map((name) =>
      rapid.texture.load(`./image/${name}.png`),
    ),
  );

  const COUNT = 2000;

  // Plain arrays of numbers rather than objects: cheaper to walk every frame.
  const sprites = Array.from({ length: COUNT }, () => ({
    texture: textures[Math.floor(Math.random() * textures.length)],
    x: Math.random() * 480,
    y: Math.random() * 300,
    vx: (Math.random() - 0.5) * 160,
    vy: (Math.random() - 0.5) * 160,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 3,
  }));

  const readout = rapid.texture.createTextTexture({
    text: "",
    fontSize: 15,
    fill: "#243142",
    stroke: "#ffffff",
    strokeThickness: 3,
  });

  let smoothedFps = 60;
  let sinceUpdate = 0;

  loop((time, delta) => {
    // clear() zeroes drawcallCount, so the previous frame's total has to be
    // sampled before clearing.
    const drawCalls = rapid.drawcallCount;

    for (const sprite of sprites) {
      sprite.x += sprite.vx * delta;
      sprite.y += sprite.vy * delta;
      sprite.rotation += sprite.spin * delta;

      if (sprite.x < -40) sprite.x = 520;
      else if (sprite.x > 520) sprite.x = -40;
      if (sprite.y < -40) sprite.y = 340;
      else if (sprite.y > 340) sprite.y = -40;
    }

    rapid.clear();

    // Six different textures, all in flight at once. Multi-texture batching
    // keeps this to a handful of draw calls rather than one per sprite.
    for (const sprite of sprites) {
      rapid.drawSprite({
        texture: sprite.texture,
        x: sprite.x,
        y: sprite.y,
        rotation: sprite.rotation,
        scale: 0.45,
        origin: 0.5,
      });
    }

    sinceUpdate += delta;
    if (sinceUpdate > 0.25) {
      smoothedFps = Math.round(1 / Math.max(delta, 0.0001));
      readout.text = `${COUNT} sprites · ${drawCalls} draw calls · ${smoothedFps} fps`;
      sinceUpdate = 0;
    }

    rapid.drawSprite({ texture: readout, x: 10, y: 10 });

    rapid.flush();
  });
}
