import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid) {
  const food = await rapid.texture.load("./image/food.png");

  rapid.clear();

  // withMask draws the first callback into the stencil buffer, then clips
  // everything the second callback draws to that shape.
  rapid.withMask(
    () => rapid.drawCircle({ x: 110, y: 150, radius: 52 }),
    () => rapid.drawSprite({ texture: food, x: 110, y: 150, origin: 0.5 }),
  );

  // Any geometry works as a mask, including a rotated rect.
  rapid.withMask(
    () => {
      rapid.drawRect({
        x: 240,
        y: 150,
        width: 96,
        height: 96,
        rotation: Math.PI / 4,
        origin: 0.5,
      });
    },
    () => {
      for (let i = 0; i < 11; i++) {
        rapid.drawRect({
          x: 180,
          y: 96 + i * 11,
          width: 120,
          height: 6,
          color: new Color(84, 184, 234),
        });
      }
    },
  );

  // The mask can be several disjoint shapes at once.
  rapid.withMask(
    () => {
      for (let i = 0; i < 7; i++) {
        rapid.drawRect({ x: 340 + i * 15, y: 98, width: 8, height: 104 });
      }
    },
    () => {
      rapid.drawCircle({
        x: 390,
        y: 150,
        radius: 52,
        color: new Color(255, 143, 112),
      });
    },
  );

  rapid.flush();
}
