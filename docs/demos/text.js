import { Color, Vec2 } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default function (rapid, { loop }) {
  // Text rasterises through a canvas 2d context, so any font the page can use
  // works here. Newlines create multiple rows in the same texture.
  const title = rapid.texture.createTextTexture({
    text: "Text alignment",
    fontSize: 28,
    fontWeight: "bold",
    fill: "#ffffff",
    stroke: "#243142",
    strokeThickness: 10,
    align: "center",
  });

  const left = rapid.texture.createTextTexture({
    text: "LEFT\nstarts at the guide",
    fontSize: 20,
    fontWeight: "bold",
    fill: "#ff8f70",
    align: "left",
    lineHeight: 1.15,
  });

  const center = rapid.texture.createTextTexture({
    text: "CENTER\non the guide",
    fontSize: 20,
    fontWeight: "bold",
    fill: "#5fc37a",
    align: "center",
    lineHeight: 1.15,
  });

  const right = rapid.texture.createTextTexture({
    text: "RIGHT\nends at the guide",
    fontSize: 20,
    fontWeight: "bold",
    fill: "#54b8ea",
    align: "right",
    lineHeight: 1.15,
  });

  const timer = rapid.texture.createTextTexture({
    text: "time: 0.0s",
    fontSize: 18,
    fontWeight: "bold",
    fill: "#243142",
    align: "center",
  });

  const guideX = 240;

  loop((time) => {
    // Updating `.text` re-rasterises only when the displayed value changes.
    timer.text = `time: ${time.toFixed(1)}s`;

    // Partial style updates merge with the existing title style.
    const hue = Math.round((time * 90) % 360);
    title.style = { fill: `hsl(${hue}, 75%, 55%)` };

    rapid.clear();

    rapid.drawLine({
      points: [new Vec2(guideX, 52), new Vec2(guideX, 264)],
      width: 2,
      color: new Color(180, 205, 220),
    });

    rapid.drawSprite({ texture: title, x: guideX, y: 27, origin: 0.5 });

    // Match each texture's horizontal origin to its text alignment. The same
    // x coordinate is therefore the left edge, centre, or right edge.
    rapid.drawSprite({ texture: left, x: guideX, y: 65, origin: new Vec2(0, 0) });
    rapid.drawSprite({ texture: center, x: guideX, y: 138, origin: new Vec2(0.5, 0) });
    rapid.drawSprite({ texture: right, x: guideX, y: 211, origin: new Vec2(1, 0) });
    rapid.drawSprite({ texture: timer, x: guideX, y: 282, origin: 0.5 });

    rapid.flush();
  });
}
