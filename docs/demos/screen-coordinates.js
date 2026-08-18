import { Color, Vec2 } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ canvas: HTMLCanvasElement, loop: (cb: (time: number) => void) => void }} ctx
 */
export default async function (rapid, { canvas, loop }) {
  const food = await rapid.texture.load("./image/food.png");

  // Browser events report CSS pixels relative to the viewport. Two steps get
  // them into game space: subtract the canvas offset, then hand the result to
  // cssToLogic, which accounts for device pixel ratio and canvas scaling.
  let pointer = new Vec2(240, 150);

  const onPointerMove = (event) => {
    const bounds = canvas.getBoundingClientRect();
    const css = new Vec2(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );
    pointer = rapid.cssToLogic(css);
  };

  canvas.addEventListener("pointermove", onPointerMove);

  loop(() => {
    rapid.clear();

    // Crosshair through the pointer, in game coordinates.
    rapid.drawLine({
      points: [new Vec2(0, pointer.y), new Vec2(rapid.width, pointer.y)],
      width: 1,
      color: new Color(180, 205, 220),
    });
    rapid.drawLine({
      points: [new Vec2(pointer.x, 0), new Vec2(pointer.x, rapid.height)],
      width: 1,
      color: new Color(180, 205, 220),
    });

    rapid.drawSprite({ texture: food, x: pointer.x, y: pointer.y, origin: 0.5 });

    const readout = rapid.texture.createTextTexture({
      text: `${Math.round(pointer.x)}, ${Math.round(pointer.y)}`,
      fontSize: 16,
      fill: "#243142",
    });
    rapid.drawSprite({ texture: readout, x: 12, y: 12 });

    rapid.flush();
  });

  // Returned cleanup runs when the reader switches to another demo.
  return () => canvas.removeEventListener("pointermove", onPointerMove);
}
