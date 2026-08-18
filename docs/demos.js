import { highlightCodeBlock } from "./highlight.js";
import { Rapid, Color, CustomGlShader, TextureWrapMode } from "../src/index.ts";

export const demoOrder = ["toycar", "pulse-shader", "outline-shader", "noise-shader"];

const demoConfig = {
  toycar: {
    id: "toycar",
    title: "Toy Car",
    file: "./demos/toycar.txt",
  },
  "pulse-shader": {
    id: "pulse-shader",
    title: "Pulse Shader",
    file: "./demos/pulse-shader.txt",
  },
  "outline-shader": {
    id: "outline-shader",
    title: "Outline Shader",
    file: "./demos/outline-shader.txt",
  },
  "noise-shader": {
    id: "noise-shader",
    title: "Extra Texture Shader",
    file: "./demos/noise-shader.txt",
  },
};

const sourceCache = {};

const loadDemoSource = async (demoId) => {
  if (sourceCache[demoId]) return sourceCache[demoId];

  const config = demoConfig[demoId];
  if (!config) throw new Error(`Demo ${demoId} not found`);

  try {
    const demoUrl = new URL(config.file, import.meta.url).href;
    const response = await fetch(demoUrl);
    if (!response.ok) throw new Error(`Failed to load ${config.file}`);
    const source = await response.text();
    sourceCache[demoId] = source;
    return source;
  } catch (error) {
    console.error(`Failed to load demo source for ${demoId}:`, error);
    throw error;
  }
};

export const demos = {
  get toycar() {
    return { ...demoConfig.toycar };
  },
  get "pulse-shader"() {
    return { ...demoConfig["pulse-shader"] };
  },
  get "outline-shader"() {
    return { ...demoConfig["outline-shader"] };
  },
  get "noise-shader"() {
    return { ...demoConfig["noise-shader"] };
  },
};

export const getDemoSource = loadDemoSource;

export const renderDemoCode = async (target, demoId) => {
  if (!target) return;
  try {
    const source = await loadDemoSource(demoId);
    // highlight.js tags an element with data-highlighted="yes" and refuses to
    // re-highlight it, so clear that flag before re-rendering a different demo.
    delete target.dataset.highlighted;
    target.textContent = source;
    target.className = "language-typescript";
    highlightCodeBlock(target);
  } catch (error) {
    target.textContent = `Failed to load demo source: ${error.message}`;
  }
};

const createNoiseTexture = (rapid) => {
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = 64;
  noiseCanvas.height = 64;

  const ctx = noiseCanvas.getContext("2d");
  const imageData = ctx.createImageData(64, 64);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.floor(Math.random() * 256);
    imageData.data[i + 0] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  return rapid.texture.create(noiseCanvas, {
    wrap: TextureWrapMode.REPEAT,
  });
};

const createRuntime = (canvas) => {
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

  let disposed = false;

  const fit = () => {
    if (disposed) return;
    const width = canvas.parentElement?.clientWidth || 480;
    const height = Math.round((width * 300) / 480);
    rapid.resize(width, height, width, height);
  };

  fit();
  window.addEventListener("resize", fit);

  return {
    rapid,
    isDisposed: () => disposed,
    dispose: () => {
      disposed = true;
      window.removeEventListener("resize", fit);
      rapid.texture.destroyAll();
    },
  };
};

const drawToycar = (rapid, texture, shader) => {
  rapid.clear();
  rapid.drawSprite({
    texture,
    shader,
    x: 160,
    y: 100,
  });
  rapid.flush();
};

const mountToycarDemo = async (runtime) => {
  const toycar = await runtime.rapid.texture.load("./image/toycar.png");
  if (runtime.isDisposed()) return;
  drawToycar(runtime.rapid, toycar);
};

const mountPulseShaderDemo = async (runtime) => {
  const rapid = runtime.rapid;
  const toycar = await rapid.texture.load("./image/toycar.png");
  if (runtime.isDisposed()) return;

  const shader = new CustomGlShader(rapid, `
void vertex(inout vec4 position, vec2 uv) {
}
`, `
uniform float uTime;

void fragment(inout vec4 color) {
  float pulse = 0.72 + 0.28 * sin(uTime * 4.0);
  color.rgb *= vec3(1.0, pulse, pulse);
}
`, 0, {
    uTime: 0,
  });

  const frame = (time) => {
    if (runtime.isDisposed()) return;
    shader.setUniforms({ uTime: time / 1000 });
    drawToycar(rapid, toycar, shader);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

const mountOutlineShaderDemo = async (runtime) => {
  const rapid = runtime.rapid;
  const toycar = await rapid.texture.load("./image/toycar.png");
  if (runtime.isDisposed()) return;

  const shader = new CustomGlShader(rapid, `
void vertex(inout vec4 position, vec2 uv) {
}
`, `
uniform vec2 uTexel;
uniform vec4 uOutlineColor;

void fragment(inout vec4 color) {
  float around = 0.0;
  around = max(around, sampleClampTexture(vRegion + vec2( uTexel.x, 0.0)).a);
  around = max(around, sampleClampTexture(vRegion + vec2(-uTexel.x, 0.0)).a);
  around = max(around, sampleClampTexture(vRegion + vec2(0.0,  uTexel.y)).a);
  around = max(around, sampleClampTexture(vRegion + vec2(0.0, -uTexel.y)).a);

  if (color.a == 0.0 && around > 0.0) {
    color = uOutlineColor;
  }
}
`, 0, {
    uTexel: [1 / toycar.base.width, 1 / toycar.base.height],
    uOutlineColor: [1, 0.88, 0.08, 1],
  }).setPadding(2);

  drawToycar(rapid, toycar, shader);
};

const mountNoiseShaderDemo = async (runtime) => {
  const rapid = runtime.rapid;
  const toycar = await rapid.texture.load("./image/toycar.png");
  const noise = createNoiseTexture(rapid);
  if (runtime.isDisposed()) return;

  const shader = new CustomGlShader(rapid, `
void vertex(inout vec4 position, vec2 uv) {
}
`, `
uniform sampler2D uNoise;
uniform float uTime;

void fragment(inout vec4 color) {
  vec2 localUV = (vRegion - vUVRect.xy) / (vUVRect.zw - vUVRect.xy);
  vec2 noiseUV = localUV * 8.0 + vec2(uTime * 0.08, 0.0);
  float n = texture(uNoise, noiseUV).r;

  color.rgb *= 0.7 + n * 0.6;
}
`, 1, {
    uTime: 0,
  });

  shader.setUniforms({
    uNoise: noise.glTexture,
  });

  const frame = (time) => {
    if (runtime.isDisposed()) return;
    shader.setUniforms({ uTime: time / 1000 });
    drawToycar(rapid, toycar, shader);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

const mountDemoById = {
  toycar: mountToycarDemo,
  "pulse-shader": mountPulseShaderDemo,
  "outline-shader": mountOutlineShaderDemo,
  "noise-shader": mountNoiseShaderDemo,
};

export const mountDemo = (canvas, demoId = "toycar") => {
  const runtime = createRuntime(canvas);
  const mount = mountDemoById[demoId] ?? mountToycarDemo;
  mount(runtime).catch((error) => {
    console.error(`[Demo] Failed to mount ${demoId}`, error);
  });
  return runtime.dispose;
};
