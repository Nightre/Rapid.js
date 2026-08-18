import { highlightCodeBlock } from "./highlight.js";
import { Rapid, Color } from "../src/index.ts";

const toycarSource = `import { Rapid, Color } from "rapid-render";

const canvas = document.querySelector("#game");
const rapid = new Rapid({ canvas });

const toycar = await rapid.texture.load("./image/toycar.png");

rapid.clear();
rapid.drawSprite({
  texture: toycar,
  x: 160,
  y: 100,
});
rapid.flush();`;

export const demoOrder = ["toycar"];

export const demos = {
  toycar: {
    id: "toycar",
    title: "Toy Car",
    source: toycarSource,
  },
};

export const renderDemoCode = (target, source) => {
  if (!target) return;
  target.textContent = source;
  target.className = "language-typescript";
  highlightCodeBlock(target);
};

export const mountDemo = (canvas) => {
  let disposed = false;

  const rapid = new Rapid({
    canvas,
    logicWidth: 480,
    logicHeight: 300,
    physicsWidth: 480,
    physicsHeight: 300,
    backgroundColor: new Color(247, 253, 255),
    antialias: false,
    roundPixels: true,
  });

  const fit = () => {
    if (disposed) return;
    const width = canvas.parentElement?.clientWidth || 480;
    const height = Math.round((width * 300) / 480);
    rapid.resize(width, height, width, height);
  };

  fit();

  rapid.texture.load("./image/toycar.png").then((toycar) => {
    if (disposed) return;
    rapid.clear();
    rapid.drawSprite({
      texture: toycar,
      x: 160,
      y: 100,
    });
    rapid.flush();
  });

  window.addEventListener("resize", fit);

  return () => {
    disposed = true;
    window.removeEventListener("resize", fit);
  };
};
