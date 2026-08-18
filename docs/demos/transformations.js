import { Vec2 } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  const box = await rapid.texture.load("./image/box.png");

  loop((time) => {
    rapid.clear();

    // Plain position. The anchor defaults to the top-left corner.
    rapid.drawSprite({ texture: box, x: 30, y: 40 });

    // rotation is radians, applied around that same anchor, so this one
    // swings around its own corner.
    rapid.drawSprite({ texture: box, x: 220, y: 40, rotation: time });

    // origin moves the anchor into the image: 0.5 is its centre, so this one
    // spins in place.
    rapid.drawSprite({
      texture: box,
      x: 400,
      y: 72,
      rotation: time,
      origin: 0.5,
    });

    // scale takes a number, or a Vec2 to scale each axis separately.
    rapid.drawSprite({
      texture: box,
      x: 90,
      y: 210,
      scale: new Vec2(1 + 0.5 * Math.sin(time * 2), 1),
      origin: 0.5,
    });

    // offset shifts the image after rotation, in its own local space, which
    // turns the spin into an orbit.
    rapid.drawSprite({
      texture: box,
      x: 250,
      y: 210,
      rotation: time,
      offsetX: 45,
      origin: 0.5,
    });

    // It all composes.
    rapid.drawSprite({
      texture: box,
      x: 410,
      y: 210,
      rotation: -time,
      scale: 0.6 + 0.3 * Math.cos(time * 3),
      origin: 0.5,
    });

    rapid.flush();
  });
}
