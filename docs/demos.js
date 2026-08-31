import { Rapid, Color } from "rapid-render";
import { highlightCodeBlock } from "./highlight.js";

/**
 * Demo registry.
 *
 * Each demo lives in `./demos/<id>.js` as a real ES module, so it can be
 * edited, type-checked and jumped through like any other source file. The
 * same file serves two purposes: it is imported and executed to drive the
 * canvas, and its raw text is what the reader sees in the code panel. There
 * is no second copy to keep in sync.
 *
 * A demo module default-exports:
 *
 *     export default function (rapid, ctx) { ... }
 *
 * `rapid` is the single shared Rapid instance (see below). `ctx` carries the
 * canvas and `ctx.loop()`. The function may be async, and may return a
 * cleanup function that runs when the reader switches away.
 */

/** Order of the demo picker. Each entry must have a `./demos/<id>.js`. */
export const demoOrder = [
  "minimal",
  "image",
  "sprite",
  "image-animation",
  "sprite-sheet",
  "transformations",
  "matrix-tree",
  "update-matrix",
  "custom-matrix",
  "screen-coordinates",
  "geometry",
  "lines",
  "text",
  "custom-shaders",
  "outline-shader",
  "noise-shader",
  "render-texture",
  "ping-pong-filter",
  "masks",
  "particles",
];

/** Label shown in the picker. */
const demoTitles = {
  minimal: "Minimal",
  image: "Image",
  sprite: "Sprite",
  "image-animation": "Image Animation",
  "sprite-sheet": "Sprite Sheet",
  transformations: "Transformations",
  "matrix-tree": "Matrix Tree",
  "update-matrix": "Update Matrix",
  "custom-matrix": "Custom Matrix",
  "screen-coordinates": "Screen Coordinates",
  geometry: "Geometry",
  lines: "Lines",
  text: "Text",
  "custom-shaders": "Custom Shaders",
  "outline-shader": "Outline Shader",
  "noise-shader": "Extra Texture Shader",
  "render-texture": "Render Textures",
  "ping-pong-filter": "Ping-Pong Filter",
  masks: "Masks & Clipping",
  particles: "Particles",
};

// Vite resolves both of these at build time: the first to lazy module
// loaders, the second to the files' literal text.
const demoModules = import.meta.glob("./demos/*.js");
const demoSources = import.meta.glob("./demos/*.js", {
  query: "?raw",
  import: "default",
  eager: true,
});

const modulePath = (id) => `./demos/${id}.js`;

export const demos = Object.fromEntries(
  demoOrder.map((id) => [id, { id, title: demoTitles[id] ?? id }]),
);

/** Raw text of a demo, for the code panel. */
export const getDemoSource = (id) => demoSources[modulePath(id)] ?? "";

/** Renders a demo's source into a `<code>` element. */
export const renderDemoCode = (target, id) => {
  if (!target) return;
  // highlight.js marks an element with data-highlighted and then refuses to
  // touch it again, so that flag has to go before re-rendering.
  delete target.dataset.highlighted;
  target.textContent = getDemoSource(id);
  target.className = "language-javascript";
  highlightCodeBlock(target);
};

/**
 * The one and only Rapid instance.
 *
 * It is built once, against the canvas exactly as authored in index.html, and
 * is never rebuilt or resized afterwards. Switching demos hands this same
 * object to the next module. Fixed logic and physics sizes keep the drawing
 * coordinates identical for every demo: the canvas is a 480x300 board.
 */
let rapid = null;

const getRapid = (canvas) => {
  rapid ??= new Rapid({
    canvas,
    logicWidth: 480,
    logicHeight: 300,
    physicsWidth: 480,
    physicsHeight: 300,
    backgroundColor: new Color(247, 253, 255),
    antialias: false,
    roundPixels: true,
  });
  return rapid;
};

/**
 * Runs a demo. Returns a function that stops it.
 *
 * Stopping matters: a demo's render loop would otherwise keep drawing onto
 * the shared canvas forever and fight whatever runs next.
 */
export const mountDemo = (id) => {
  const canvas = document.querySelector("#game");
  if (!canvas) return () => {};

  const rapid = getRapid(canvas);

  let stopped = false;
  let frameId = 0;
  let cleanup = null;

  const ctx = {
    canvas,
    /**
     * Runs `callback(time, delta)` every frame until the demo is swapped out.
     * Both arguments are in seconds, `time` counted from when the demo started.
     */
    loop(callback) {
      const start = performance.now();
      let previous = start;

      const step = (now) => {
        if (stopped) return;
        // Clamped so a backgrounded tab does not resume with a huge delta.
        const delta = Math.max(0, Math.min((now - previous) / 1000, 0.05));
        previous = now;
        callback(Math.max(0, (now - start) / 1000), delta);
        frameId = requestAnimationFrame(step);
      };

      frameId = requestAnimationFrame(step);
    },
  };

  // Stencil masks and half-built batches outlive a demo because the instance
  // does; clear them so the next module starts from a known state.
  rapid.flush();
  rapid.clearMask();
  rapid.clear();

  const load = demoModules[modulePath(id)];
  if (!load) {
    console.error(`[demo] no module for "${id}"`);
    return () => {};
  }

  load()
    .then((module) => (stopped ? null : module.default(rapid, ctx)))
    .then((fn) => {
      if (typeof fn !== "function") return;
      if (stopped) fn();
      else cleanup = fn;
    })
    .catch((error) => console.error(`[demo] "${id}" failed:`, error));

  return () => {
    stopped = true;
    cancelAnimationFrame(frameId);
    cleanup?.();
  };
};
