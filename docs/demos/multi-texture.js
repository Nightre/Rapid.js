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

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ canvas: HTMLCanvasElement, loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default function (rapid, { canvas, loop }) {
  const textureCount = rapid.maxTextureUnits * BATCH_COUNT;
  const textures = Array.from({ length: textureCount }, (_, index) =>
    rapid.texture.create(createNumberedCanvas(index + 1)),
  );

  // Fit every numbered texture into the 480 x 300 demo canvas regardless of
  // how many texture units the current GPU exposes.
  const columns = Math.ceil(
    Math.sqrt(textureCount * (rapid.width / rapid.height)),
  );
  const rows = Math.ceil(textureCount / columns);
  const cellWidth = rapid.width / columns;
  const cellHeight = rapid.height / rows;
  const scale = (Math.min(cellWidth, cellHeight) * 0.82) / TEXTURE_SIZE;

  const originalTitle = canvas.title;
  const originalAriaLabel = canvas.getAttribute("aria-label");
  let reported = false;

  loop(() => {
    rapid.clear();

    for (let index = 0; index < textures.length; index++) {
      rapid.drawSprite({
        texture: textures[index],
        x: (index % columns + 0.5) * cellWidth,
        y: (Math.floor(index / columns) + 0.5) * cellHeight,
        scale,
        origin: 0.5,
      });
    }

    rapid.flush();

    if (!reported) {
      const summary =
        `${textureCount} textures · ${rapid.maxTextureUnits} units · ` +
        `${rapid.drawcallCount} draw calls`;
      canvas.title = summary;
      canvas.setAttribute("aria-label", `Multi-texture batching demo: ${summary}`);
      console.info(`[multi-texture] ${summary}`);
      reported = true;
    }
  });

  return () => {
    for (const texture of textures) rapid.texture.destroy(texture);
    canvas.title = originalTitle;
    if (originalAriaLabel === null) canvas.removeAttribute("aria-label");
    else canvas.setAttribute("aria-label", originalAriaLabel);
  };
}
