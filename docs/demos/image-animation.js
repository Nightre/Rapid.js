/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const toycar = await rapid.texture.load("./image/toycar.png");

  // `time` is seconds since this demo started, `delta` seconds since the last
  // frame. Driving animation off time rather than counting frames keeps the
  // speed identical on a 60Hz and a 144Hz display.
  loop((time) => {
    rapid.clear();

    rapid.drawSprite({
      texture: toycar,
      x: 240,
      y: 150,
      rotation: time,
      scale: 1 + 0.4 * Math.sin(time * 2),
      origin: 0.5,
    });

    rapid.flush();
  });
}
