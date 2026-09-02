import { Vec2 } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default function (rapid) {
  // Text rasterises through a canvas 2d context, so any font the page can use
  // works here. Assigning to `.text` later re-rasterises in place.
  const title = rapid.texture.createTextTexture({
    text: "Hello Rapid! ggg W",
    fontSize: 34,
    fontWeight: "bold",
    fill: "#243142",
  });

  const subtitle = rapid.texture.createTextTexture({
    text: "WebGL 2D renderer",
    fontSize: 20,
    fill: "#54b8ea",
  });

  const outlined = rapid.texture.createTextTexture({
    text: "Outlined text\naaa\nggggg\nWWWW",
    fontSize: 24,
    fontWeight: "bold",
    fill: "#5fc37a",
    stroke: "#243142",
    strokeThickness: 4,
    align: "center"
  });

  rapid.clear();

  rapid.drawSprite({ texture: title, x: 240, y: 90, origin: 0.5 });
  rapid.drawSprite({ texture: subtitle, x: 240, y: 150, origin: 0.5 });
  rapid.drawSprite({ texture: outlined, x: rapid.width / 2, y: 0, origin: new Vec2(0.5, 0) });

  rapid.flush();
}
