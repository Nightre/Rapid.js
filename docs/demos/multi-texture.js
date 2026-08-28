import { Color } from "rapid-render";

const TEXTURE_SIZE = 64;
const BATCH_COUNT = 3;

/**
 * Creates a numbered canvas so every generated WebGL texture is visibly
 * distinct in the demo.
 * @param {number} number
 * @returns {HTMLCanvasElement}
 */
function createNumberedCanvas(number) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create a 2D canvas context");

  const hue = Math.floor(Math.random() * 360);
  context.fillStyle = `hsl(${hue}, 72%, 52%)`;
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  context.font = "bold 24px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 5;
  context.strokeStyle = "rgba(0, 0, 0, 0.55)";
  context.fillStyle = "#ffffff";
  context.strokeText(String(number), TEXTURE_SIZE / 2, TEXTURE_SIZE / 2);
  context.fillText(String(number), TEXTURE_SIZE / 2, TEXTURE_SIZE / 2);

  return canvas;
}

function createPanelLayout(itemCount, x, y, width, height) {
  const columns = Math.ceil(Math.sqrt(itemCount * (width / height)));
  const rows = Math.ceil(itemCount / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const positions = new Float32Array(itemCount * 2);

  for (let index = 0; index < itemCount; index++) {
    positions[index * 2] = x + (index % columns + 0.5) * cellWidth;
    positions[index * 2 + 1] =
      y + (Math.floor(index / columns) + 0.5) * cellHeight;
  }

  return {
    positions,
    scale: (Math.min(cellWidth, cellHeight) * 0.72) / TEXTURE_SIZE,
    circleRadius: Math.min(cellWidth, cellHeight) * 0.26,
  };
}

function createStatusCanvas(width, height, panelTops, panelHeight, labelWidth, checks) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create a status canvas context");

  const allPassed = checks.every((check) => check.actual === check.expected);
  const actualTotal = checks.reduce((sum, check) => sum + check.actual, 0);
  const expectedTotal = checks.reduce((sum, check) => sum + check.expected, 0);

  context.textBaseline = "middle";
  context.font = "700 13px system-ui, sans-serif";
  context.fillStyle = allPassed ? "#16834b" : "#c62828";
  context.fillText(
    `${allPassed ? "PASS" : "FAIL"} · ${actualTotal}/${expectedTotal} test draw calls`,
    8,
    13,
  );

  for (let index = 0; index < checks.length; index++) {
    const check = checks[index];
    const top = panelTops[index];
    const passed = check.actual === check.expected;

    context.strokeStyle = "rgba(75, 98, 112, 0.28)";
    context.lineWidth = 1;
    context.strokeRect(3.5, top + 0.5, width - 7, panelHeight - 1);

    context.fillStyle = "rgba(247, 253, 255, 0.9)";
    context.fillRect(4, top + 1, labelWidth - 8, panelHeight - 2);

    context.font = "700 11px system-ui, sans-serif";
    context.fillStyle = "#243142";
    context.fillText(check.title, 9, top + 14);

    context.font = "10px system-ui, sans-serif";
    context.fillStyle = "#5a6877";
    context.fillText(check.detail, 9, top + 31);

    context.font = "700 11px system-ui, sans-serif";
    context.fillStyle = passed ? "#16834b" : "#c62828";
    context.fillText(
      `${passed ? "PASS" : "FAIL"} · ${check.actual}/${check.expected} calls`,
      9,
      top + 49,
    );
  }

  return canvas;
}

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ canvas: HTMLCanvasElement, loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default function (rapid, { canvas, loop }) {
  const maxTextureUnits = rapid.maxTextureUnits;
  const textureCount = maxTextureUnits * BATCH_COUNT;
  const circleAfterTexture = Math.max(1, Math.floor(maxTextureUnits / 2));
  const textures = Array.from({ length: textureCount }, (_, index) =>
    rapid.texture.create(createNumberedCanvas(index + 1)),
  );

  const labelWidth = Math.min(148, rapid.width * 0.32);
  const panelTop = 26;
  const panelGap = 3;
  const panelHeight =
    (rapid.height - panelTop - panelGap * 3 - 4) / 4;
  const panelTops = Array.from(
    { length: 4 },
    (_, index) => panelTop + index * (panelHeight + panelGap),
  );
  const contentX = labelWidth;
  const contentWidth = rapid.width - contentX - 5;
  const contentInsetY = 3;
  const contentHeight = panelHeight - contentInsetY * 2;

  const exactLayout = createPanelLayout(
    maxTextureUnits,
    contentX,
    panelTops[0] + contentInsetY,
    contentWidth,
    contentHeight,
  );
  const overflowLayout = createPanelLayout(
    maxTextureUnits + 1,
    contentX,
    panelTops[1] + contentInsetY,
    contentWidth,
    contentHeight,
  );
  const reuseLayout = createPanelLayout(
    maxTextureUnits + 1,
    contentX,
    panelTops[2] + contentInsetY,
    contentWidth,
    contentHeight,
  );
  const regionLayout = createPanelLayout(
    maxTextureUnits + 1,
    contentX,
    panelTops[3] + contentInsetY,
    contentWidth,
    contentHeight,
  );

  const circleColor = new Color(37, 49, 66);

  const originalTitle = canvas.title;
  const originalAriaLabel = canvas.getAttribute("aria-label");
  let statusTexture = null;
  let reported = false;

  loop(() => {
    rapid.clear();

    const drawAt = (texture, layout, slot) => {
      rapid.drawSprite({
        texture,
        x: layout.positions[slot * 2],
        y: layout.positions[slot * 2 + 1],
        scale: layout.scale,
        origin: 0.5,
      });
    };

    let before = rapid.drawcallCount;
    for (let index = 0; index < maxTextureUnits; index++) {
      drawAt(textures[index], exactLayout, index);
    }
    rapid.flush();
    const exactCalls = rapid.drawcallCount - before;

    before = rapid.drawcallCount;
    for (let index = 0; index < maxTextureUnits + 1; index++) {
      drawAt(textures[maxTextureUnits + index], overflowLayout, index);
    }
    rapid.flush();
    const overflowCalls = rapid.drawcallCount - before;

    before = rapid.drawcallCount;
    for (let index = 0; index < maxTextureUnits + 1; index++) {
      drawAt(textures[index % 2], reuseLayout, index);
    }
    rapid.flush();
    const reuseCalls = rapid.drawcallCount - before;

    before = rapid.drawcallCount;
    for (let index = 0; index < maxTextureUnits; index++) {
      const visualSlot = index < circleAfterTexture ? index : index + 1;
      drawAt(textures[maxTextureUnits * 2 + index], regionLayout, visualSlot);

      if (index + 1 === circleAfterTexture) {
        rapid.drawCircle({
          x: regionLayout.positions[circleAfterTexture * 2],
          y: regionLayout.positions[circleAfterTexture * 2 + 1],
          radius: regionLayout.circleRadius,
          color: circleColor,
        });
      }
    }
    rapid.flush();
    const regionCalls = rapid.drawcallCount - before;

    const checks = [
      {
        title: "EXACT LIMIT",
        detail: `${maxTextureUnits} unique textures`,
        actual: exactCalls,
        expected: 1,
      },
      {
        title: "LIMIT + 1",
        detail: `${maxTextureUnits + 1} unique textures`,
        actual: overflowCalls,
        expected: 2,
      },
      {
        title: "TEXTURE REUSE",
        detail: `${maxTextureUnits + 1} sprites / 2 textures`,
        actual: reuseCalls,
        expected: 1,
      },
      {
        title: "REGION SWITCH",
        detail: "sprites → circle → sprites",
        actual: regionCalls,
        expected: 3,
      },
    ];

    const allPassed = checks.every((check) => check.actual === check.expected);
    const actualTotal = checks.reduce((sum, check) => sum + check.actual, 0);
    const expectedTotal = checks.reduce((sum, check) => sum + check.expected, 0);

    if (!statusTexture) {
      const statusCanvas = createStatusCanvas(
        rapid.width,
        rapid.height,
        panelTops,
        panelHeight,
        labelWidth,
        checks,
      );
      statusTexture = rapid.texture.create(statusCanvas);
    }

    // The status overlay is intentionally drawn after all measurements, so
    // its texture and draw call do not affect any test result above.
    rapid.drawSprite({ texture: statusTexture, x: 0, y: 0 });
    rapid.flush();

    if (!reported) {
      const summary =
        `${allPassed ? "PASS" : "FAIL"} · ${maxTextureUnits} units · ` +
        `${actualTotal}/${expectedTotal} test draw calls`;
      canvas.title = summary;
      canvas.setAttribute("aria-label", `Multi-texture batching demo: ${summary}`);
      console.info(`[multi-texture] ${summary}`);
      reported = true;
    }
  });

  return () => {
    for (const texture of textures) rapid.texture.destroy(texture);
    if (statusTexture) rapid.texture.destroy(statusTexture);
    canvas.title = originalTitle;
    if (originalAriaLabel === null) canvas.removeAttribute("aria-label");
    else canvas.setAttribute("aria-label", originalAriaLabel);
  };
}
