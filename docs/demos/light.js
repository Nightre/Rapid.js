import { Color, Vec2, Light } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { canvas, loop }) {
  const [sprite, normalMap, lightTexture] = await Promise.all([
    rapid.texture.load("./image/godot.png"),
    rapid.texture.load("./image/godot_normal.png"),
    rapid.texture.load("./image/Light.png"),
  ]);

  const light = new Light(rapid);
  const shadowLights = [light, new Light(rapid)];
  const center = new Vec2(rapid.width * 0.5, rapid.height * 0.5);
  const lights = [
    { position: new Vec2(center.x - 110, center.y + 70), diameter: 350,
      height: 70, color: new Color(255, 145, 64) },
    { position: new Vec2(center.x + 110, center.y - 70), diameter: 350,
      height: 70, color: new Color(56, 189, 248) },
  ];
  const occluder = [
    new Vec2(center.x - 15, center.y - 70),
    new Vec2(center.x + 15, center.y - 70),
    new Vec2(center.x + 15, center.y + 40),
    new Vec2(center.x + 70, center.y + 40),
    new Vec2(center.x + 70, center.y + 70),
    new Vec2(center.x - 15, center.y + 70),
  ];

  let draggedLight = -1;
  let draggedPointer = -1;

  const createLightMatrix = ({ position, diameter }) => {
    const step = rapid.matrixStack.save();
    rapid.matrixStack.translate(position.x, position.y);
    rapid.matrixStack.scale(diameter);
    rapid.matrixStack.restore();
    return step;
  };

  const draw = () => {
    rapid.clear();
    rapid.drawRect({ x: 0, y: 0, width: rapid.width, height: rapid.height,
      color: new Color(15, 23, 42) });

    const lightMatrices = lights.map(createLightMatrix);
    const lightTextures = lights.map((_, i) =>
      shadowLights[i].lightShadow(lightTexture, lightMatrices[i], occluder));
    const shader = light.setupLight({
      lightMatrix: lightMatrices,
      normalMap,
      lightTexture: lightTextures,
      lightHeight: lights.map(item => item.height),
      color: lights.map(item => item.color),
      metallic: 0.35,
      roughness: 0.25,
    });

    rapid.drawSprite({
      texture: sprite,
      shader,
      x: center.x,
      y: center.y,
      origin: 0.5,
      scale: 3,
    });

    const blockColor = new Color(71, 85, 105);
    rapid.drawRect({ x: center.x - 15, y: center.y - 70,
      width: 30, height: 140, color: blockColor });
    rapid.drawRect({ x: center.x + 15, y: center.y + 40,
      width: 55, height: 30, color: blockColor });

    for (const item of lights) {
      rapid.drawCircle({ x: item.position.x, y: item.position.y,
        radius: 8, color: item.color });
      rapid.drawCircle({ x: item.position.x, y: item.position.y,
        radius: 3, color: Color.White });
    }
    rapid.flush();
  };

  const toLogicPoint = (event) => {
    const bounds = canvas.getBoundingClientRect();
    return rapid.cssToLogic(new Vec2(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    ));
  };

  const findLight = (point) => lights.findIndex(item =>
    Math.hypot(item.position.x - point.x, item.position.y - point.y) <= 16);

  const moveLight = (index, point) => {
    lights[index].position.x = Math.max(0, Math.min(rapid.width, point.x));
    lights[index].position.y = Math.max(0, Math.min(rapid.height, point.y));
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = toLogicPoint(event);
    const index = findLight(point);
    if (index < 0) return;
    draggedLight = index;
    draggedPointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    moveLight(index, point);
  };

  const onPointerMove = (event) => {
    const point = toLogicPoint(event);
    if (event.pointerId === draggedPointer && draggedLight >= 0) {
      moveLight(draggedLight, point);
    } else {
      canvas.style.cursor = findLight(point) < 0 ? "default" : "grab";
    }
  };

  const onPointerUp = (event) => {
    if (event.pointerId !== draggedPointer) return;
    draggedLight = -1;
    draggedPointer = -1;
    canvas.style.cursor = "default";
  };

  const previousTouchAction = canvas.style.touchAction;
  const previousCursor = canvas.style.cursor;
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  loop(draw);

  return () => {
    canvas.style.touchAction = previousTouchAction;
    canvas.style.cursor = previousCursor;
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}
