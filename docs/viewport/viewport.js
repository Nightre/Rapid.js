import {
  CanvasScaleMode,
  Color,
  ExpandMode,
  Rapid,
  Vec2,
} from "rapid-render";

const canvas = document.querySelector("#game");
const scaleModeSelect = document.querySelector("#scale-mode");
const expandModeSelect = document.querySelector("#expand-mode");
const logicSizeSelect = document.querySelector("#logic-size");
const stats = document.querySelector("#viewport-stats");

const scaleModes = {
  CanvasItem: CanvasScaleMode.CanvasItem,
  Viewport: CanvasScaleMode.Viewport,
};

const expandModes = {
  KEEP: ExpandMode.KEEP,
  KEEP_W: ExpandMode.KEEP_W,
  KEEP_H: ExpandMode.KEEP_H,
  EXPAND: ExpandMode.EXPAND,
  IGNORE: ExpandMode.IGNORE,
  NONE: ExpandMode.NONE,
};

const readLogicSize = () => {
  const [width, height] = logicSizeSelect.value.split("x").map(Number);
  return { width, height };
};

const initialSize = readLogicSize();
const rapid = new Rapid({
  canvas,
  logicWidth: initialSize.width,
  logicHeight: initialSize.height,
  scaleMode: scaleModes[scaleModeSelect.value],
  expand: expandModes[expandModeSelect.value],
  backgroundColor: Color.fromHex("#dff4fb"),
  antialias: false,
});

const resize = () => {
  const logicSize = readLogicSize();
  rapid.scaleMode = scaleModes[scaleModeSelect.value];
  rapid.viewport.expandMode = expandModes[expandModeSelect.value];
  rapid.resize(
    logicSize.width,
    logicSize.height,
    window.innerWidth,
    window.innerHeight,
  );
};

scaleModeSelect.addEventListener("change", resize);
expandModeSelect.addEventListener("change", resize);
logicSizeSelect.addEventListener("change", resize);
window.addEventListener("resize", resize);

resize();

const toycar = await rapid.texture.load("../image/toycar.png");
const carSpacing = 48;
const carScale = 0.72;

const render = (now) => {
  rapid.clear();

  const { viewLeft, viewRight, viewTop, viewBottom } = rapid.viewport;
  const startX = Math.floor(viewLeft / carSpacing) * carSpacing + carSpacing / 2;
  const startY = Math.floor(viewTop / carSpacing) * carSpacing + carSpacing / 2;
  const time = now / 1000;
  let carCount = 0;

  for (let y = startY; y < viewBottom + carSpacing; y += carSpacing) {
    for (let x = startX; x < viewRight + carSpacing; x += carSpacing) {
      const column = Math.floor(x / carSpacing);
      const row = Math.floor(y / carSpacing);
      const wave = Math.sin(time * 1.8 + column * 0.55 + row * 0.35);

      rapid.drawSprite({
        texture: toycar,
        x,
        y: y + wave * 3,
        scale: carScale,
        rotation: wave * 0.045,
        origin: 0.5,
        flipX: (column + row) % 2 !== 0,
      });
      carCount++;
    }
  }

  rapid.flush();

  stats.textContent = [
    `CSS viewport  ${window.innerWidth} × ${window.innerHeight}`,
    `Backbuffer    ${canvas.width} × ${canvas.height}`,
    `Logical size  ${Math.round(rapid.logicWidth)} × ${Math.round(rapid.logicHeight)}`,
    `Visible X     ${viewLeft.toFixed(1)} … ${viewRight.toFixed(1)}`,
    `Visible Y     ${viewTop.toFixed(1)} … ${viewBottom.toFixed(1)}`,
    `Resolution    ${rapid.viewport.resolution.toFixed(2)}x`,
    `Toy cars      ${carCount}`,
  ].join("\n");

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
