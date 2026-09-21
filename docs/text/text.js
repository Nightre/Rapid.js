import { Color, ExpandMode, Rapid, Vec2 } from "rapid-render";

const canvas = document.querySelector("#game");
const stats = document.querySelector("#text-stats");

const controls = {
  text: document.querySelector("#text"),
  fontFamily: document.querySelector("#font-family"),
  fontSize: document.querySelector("#font-size"),
  fontWeight: document.querySelector("#font-weight"),
  fill: document.querySelector("#fill"),
  stroke: document.querySelector("#stroke"),
  strokeThickness: document.querySelector("#stroke-thickness"),
  lineHeight: document.querySelector("#line-height"),
  align: document.querySelector("#align"),
  baseline: document.querySelector("#baseline"),
  logicSize: document.querySelector("#logic-size"),
  x: document.querySelector("#position-x"),
  y: document.querySelector("#position-y"),
};

const values = {
  logicSize: document.querySelector("#logic-size-value"),
  x: document.querySelector("#position-x-value"),
  y: document.querySelector("#position-y-value"),
};

const defaults = Object.fromEntries(
  Object.entries(controls).map(([name, control]) => [name, control.value]),
);

const rapid = new Rapid({
  canvas,
  logicWidth: 960,
  logicHeight: 540,
  expand: ExpandMode.EXPAND,
  backgroundColor: Color.fromHex("#10151c"),
  antialias: true,
});

const readNumber = (control, fallback) => {
  const value = Number(control.value);
  return Number.isFinite(value) ? value : fallback;
};

const readStyle = () => ({
  fontFamily: controls.fontFamily.value || "Arial",
  fontSize: readNumber(controls.fontSize, 48),
  fontWeight: controls.fontWeight.value,
  fill: controls.fill.value,
  stroke: controls.stroke.value,
  strokeThickness: readNumber(controls.strokeThickness, 0),
  lineHeight: readNumber(controls.lineHeight, 1),
  align: controls.align.value,
  baseline: controls.baseline.value,
});

const textTexture = rapid.texture.createTextTexture({
  text: controls.text.value,
  ...readStyle(),
});

const updateText = () => {
  textTexture.text = controls.text.value;
};

const updateStyle = () => {
  textTexture.style = readStyle();
};

controls.text.addEventListener("input", updateText);

for (const [name, control] of Object.entries(controls)) {
  if (name === "text" || ["logicSize", "x", "y"].includes(name)) continue;
  control.addEventListener("input", updateStyle);
}

document.querySelector("#reset").addEventListener("click", () => {
  for (const [name, value] of Object.entries(defaults)) controls[name].value = value;
  updateText();
  updateStyle();
  applyLogicSize(false);
  updateTransformValues();
});

const logicHeightForCanvas = (width) => (
  width * window.innerHeight / Math.max(window.innerWidth, 1)
);

let logicWidth = readNumber(controls.logicSize, 960);
let logicHeight = logicHeightForCanvas(logicWidth);

const resize = () => {
  rapid.resize(logicWidth, logicHeight, window.innerWidth, window.innerHeight);
};

const updateTransformValues = () => {
  values.logicSize.value = `${Math.round(logicWidth)} × ${Math.round(logicHeight)}`;
  values.x.value = Math.round(readNumber(controls.x, logicWidth / 2));
  values.y.value = Math.round(readNumber(controls.y, logicHeight / 2));
};

const applyLogicSize = (preservePosition = true) => {
  const previousWidth = logicWidth;
  const previousHeight = logicHeight;
  logicWidth = readNumber(controls.logicSize, 960);
  logicHeight = logicHeightForCanvas(logicWidth);

  if (preservePosition) {
    controls.x.value = String(readNumber(controls.x, previousWidth / 2) * logicWidth / previousWidth);
    controls.y.value = String(readNumber(controls.y, previousHeight / 2) * logicHeight / previousHeight);
  }

  controls.x.max = String(logicWidth);
  controls.y.max = String(logicHeight);
  resize();
  updateTransformValues();
};

controls.logicSize.addEventListener("input", () => applyLogicSize());
for (const name of ["x", "y"]) {
  controls[name].addEventListener("input", updateTransformValues);
}

window.addEventListener("resize", () => applyLogicSize());
applyLogicSize(false);

const render = () => {
  const x = readNumber(controls.x, 480);
  const y = readNumber(controls.y, 270);
  const inverseResolution = 1 / rapid.viewport.resolution;
  const cssPixelInLogic = rapid.dpr * inverseResolution;

  rapid.clear();

  rapid.drawLine({
    points: Vec2.FromArray([[0, y], [logicWidth, y]]),
    width: inverseResolution,
    color: new Color(69, 86, 104, 180),
  });
  rapid.drawLine({
    points: Vec2.FromArray([[x, 0], [x, logicHeight]]),
    width: inverseResolution,
    color: new Color(69, 86, 104, 180),
  });

  rapid.drawSprite({
    texture: textTexture,
    x,
    y,
  });

  const textureLeft = textTexture.offsetX;
  const textureTop = textTexture.offsetY;
  const textureRight = textureLeft + textTexture.width;
  const textureBottom = textureTop + textTexture.height;

  rapid.drawLine({
    points: Vec2.FromArray([
      [textureLeft, textureTop],
      [textureRight, textureTop],
      [textureRight, textureBottom],
      [textureLeft, textureBottom],
    ]),
    closed: true,
    width: inverseResolution,
    color: new Color(150, 165, 180, 210),
    x,
    y,
  });

  rapid.drawCircle({
    x,
    y,
    radius: 2 * cssPixelInLogic,
    color: new Color(255, 193, 92),
  });

  rapid.flush();

  stats.textContent = [
    `Anchor       ${controls.align.value} / ${controls.baseline.value}`,
    `Position     ${x.toFixed(1)}, ${y.toFixed(1)}`,
    `Texture      ${textTexture.width.toFixed(1)} × ${textTexture.height.toFixed(1)}`,
    `Resolution   ${textTexture.resolution.toFixed(2)}x`,
  ].join("\n");

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
