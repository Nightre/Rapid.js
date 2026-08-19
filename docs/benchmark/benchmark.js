import { CanvasScaleMode, Color, Rapid, TextureFilterMode } from "rapid-render";

const WIDTH = 640;
const HEIGHT = 360;
const SPRITE_SIZE = 48;
const COUNTS = [
  500,
  1000,
  3000,
  5000,
  10000,
  20000,
  30000,
  40000,
  50000,
  60000,
  70000,
  80000,
  90000,
  100000,
  125000,
  150000,
  175000,
  200000,
  400000,
];
const TEXTURE_URLS = ["../image/toycar.png", "../image/tree.png", "../image/knife.png", "../image/sprite.png", "../image/logo_title.png"];
const PHASER4_URL = "https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js";
const EXCALIBUR_URL = "https://esm.sh/excalibur";
const KAPLAY_URL = "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
const MELONJS_URL = "https://cdn.jsdelivr.net/npm/melonjs/+esm";
const WARMUP_MS = 500;
const SAMPLE_MS = 1000;

const renderers = [
  { id: "rapid",     name: "Rapid.js",  color: "#ff0048", maxCount: 400000, run: runRapid },
  { id: "pixijs",    name: "PixiJS",    color: "#00c49f", maxCount: 400000, run: runPixi },    // 蓝绿
  { id: "phaser",    name: "Phaser",    color: "#ffb703", maxCount: 400000, run: runPhaser4 }, // 暖金
  { id: "excalibur", name: "Excalibur", color: "#6291f0", maxCount: 400000, run: runExcalibur },// 纯蓝
  { id: "canvas",    name: "Canvas 2D", color: "#6c757d", maxCount: 5000,  run: runCanvas2D }, // 稳重灰
];
let stage = document.querySelector("#stage");
const chart = document.querySelector("#chart");
const statusText = document.querySelector("#status-text");
const progressText = document.querySelector("#progress-text");
const runButton = document.querySelector("#run-benchmark");
const resultsBody = document.querySelector("#results-body");

const results = Object.fromEntries(renderers.map((renderer) => [renderer.id, new Map()]));
let running = false;
let excaliburModule = null;
let kaplayModule = null;
let melonModule = null;
let phaser4Global = null;

const textureImages = await Promise.all(TEXTURE_URLS.map(loadImage));
const phaser3Global = window.Phaser;

initTable();
progressText.textContent = `0 / ${totalSamples()} samples`;
drawChart();
drawIdleStage();

runButton.addEventListener("click", async () => {
  if (running) return;
  running = true;
  runButton.disabled = true;
  clearResults();

  let completed = 0;
  const total = totalSamples();

  try {
    for (const renderer of renderers) {
      for (const count of countsForRenderer(renderer)) {
        updateStatus(`${renderer.name} · ${count} sprites`, true);
        progressText.textContent = `${completed} / ${total} samples`;

        const sprites = createSprites(count);
        const fps = await renderer.run(resetStageCanvas(), sprites);
        results[renderer.id].set(count, fps);

        completed++;
        progressText.textContent = `${completed} / ${total} samples`;
        updateTableCell(renderer.id, count, fps);
        drawChart();
        await waitForNextFrame();
      }
    }

    updateStatus("Complete", false);
  } catch (error) {
    console.error(error);
    updateStatus("Benchmark failed. Check the console.", false);
  } finally {
    running = false;
    runButton.disabled = false;
  }
});

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

function countsForRenderer(renderer) {
  return COUNTS.filter((count) => count <= renderer.maxCount);
}

function totalSamples() {
  return renderers.reduce((sum, renderer) => sum + countsForRenderer(renderer).length, 0);
}

function createSprites(count) {
  let seed = 0x2f6e2b1 + count;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);
  const rotation = new Float32Array(count);
  const spin = new Float32Array(count);
  const tint = new Uint32Array(count);
  const tintCss = new Array(count);
  const color = new Array(count);
  const textureIndex = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    x[i] = random() * WIDTH;
    y[i] = random() * HEIGHT;
    const angle = random() * Math.PI * 2;
    const speed = 55 + random() * 115;
    vx[i] = Math.cos(angle) * speed;
    vy[i] = Math.sin(angle) * speed;
    rotation[i] = random() * Math.PI * 2;
    spin[i] = (random() < 0.5 ? -1 : 1) * (0.8 + random() * 3.2);
    const r = 120 + Math.floor(random() * 136);
    const g = 120 + Math.floor(random() * 136);
    const b = 120 + Math.floor(random() * 136);
    tint[i] = (r << 16) | (g << 8) | b;
    tintCss[i] = `#${tint[i].toString(16).padStart(6, "0")}`;
    color[i] = new Color(r, g, b, 255);
    textureIndex[i] = Math.floor(random() * textureImages.length);
  }

  return { count, x, y, vx, vy, rotation, spin, tint, tintCss, color, textureIndex };
}

function updateSprites(sprites, delta) {
  const maxX = WIDTH - SPRITE_SIZE;
  const maxY = HEIGHT - SPRITE_SIZE;

  for (let i = 0; i < sprites.count; i++) {
    let x = sprites.x[i] + sprites.vx[i] * delta;
    let y = sprites.y[i] + sprites.vy[i] * delta;

    if (x <= 0) {
      x = 0;
      sprites.vx[i] = Math.abs(sprites.vx[i]);
    } else if (x >= maxX) {
      x = maxX;
      sprites.vx[i] = -Math.abs(sprites.vx[i]);
    }

    if (y <= 0) {
      y = 0;
      sprites.vy[i] = Math.abs(sprites.vy[i]);
    } else if (y >= maxY) {
      y = maxY;
      sprites.vy[i] = -Math.abs(sprites.vy[i]);
    }

    sprites.x[i] = x;
    sprites.y[i] = y;
    sprites.rotation[i] += sprites.spin[i] * delta;
  }
}

function sampleLoop(draw) {
  return new Promise((resolve) => {
    let warmupStart = 0;
    let sampleStart = 0;
    let previous = 0;
    let frames = 0;

    const step = (now) => {
      if (!previous) {
        previous = now;
        warmupStart = now;
      }

      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      draw(delta);

      if (now - warmupStart < WARMUP_MS) {
        requestAnimationFrame(step);
        return;
      }

      if (!sampleStart) {
        sampleStart = now;
        frames = 1;
      } else {
        frames++;
      }

      const elapsed = now - sampleStart;
      if (elapsed >= SAMPLE_MS) {
        resolve((frames * 1000) / elapsed);
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}

async function runRapid(canvas, sprites) {
  const rapid = new Rapid({
    canvas,
    logicWidth: WIDTH,
    logicHeight: HEIGHT,
    physicsWidth: WIDTH,
    physicsHeight: HEIGHT,
    backgroundColor: new Color(247, 253, 255),
    antialias: false,
    roundPixels: false,
    scaleMode: CanvasScaleMode.Viewport,
    textureFilter: TextureFilterMode.NEAREST,
  });
  const textures = textureImages.map((image) => rapid.texture.create(image));

  const drawOptions = { texture: textures[0], x: 0, y: 0, rotation: 0, origin: 0.5, color: null };

  const fps = await sampleLoop((delta) => {
    updateSprites(sprites, delta);
    rapid.clear();
    for (let i = 0; i < sprites.count; i++) {
      drawOptions.texture = textures[sprites.textureIndex[i]];
      drawOptions.x = sprites.x[i];
      drawOptions.y = sprites.y[i];
      drawOptions.rotation = sprites.rotation[i];
      drawOptions.color = sprites.color[i];
      rapid.drawSprite(drawOptions);
    }
    rapid.flush();
  });

  for (const texture of textures) {
    rapid.texture.destroy(texture, true);
  }
  return fps;
}

async function runCanvas2D(canvas, sprites) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  return sampleLoop((delta) => {
    updateSprites(sprites, delta);

    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < sprites.count; i++) {
      const image = textureImages[sprites.textureIndex[i]];
      const w = image.width;
      const h = image.height;
      const hw = w * 0.5;
      const hh = h * 0.5;
      const cos = Math.cos(sprites.rotation[i]);
      const sin = Math.sin(sprites.rotation[i]);

      ctx.save();
      //ctx.fillStyle = sprites.tintCss[i];
      ctx.setTransform(cos, sin, -sin, cos, sprites.x[i], sprites.y[i]);
      //ctx.fillRect(-hw, -hh, w, h);
      //ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(image, -hw, -hh, w, h);
      //ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}

async function runPixi(canvas, sprites) {
  const app = await createPixiApp(canvas);
  const PIXI = window.PIXI;
  const textures = textureImages.map((image) => window.PIXI.Texture.from(image));

  const container = new PIXI.Container();
  app.stage.addChild(container);

  for (let i = 0; i < sprites.count; i++) {
    const item = new PIXI.Sprite(textures[sprites.textureIndex[i]]);
    item.anchor.set(0.5);
    item.position.set(sprites.x[i], sprites.y[i]);
    item.rotation = sprites.rotation[i];
    item.tint = sprites.tint[i];
    container.addChild(item);
  }

  const pixiSprites = container.children;
  const fps = await sampleLoop((delta) => {
    updateSprites(sprites, delta);
    for (let i = 0; i < sprites.count; i++) {
      const item = pixiSprites[i];
      item.x = sprites.x[i];
      item.y = sprites.y[i];
      item.rotation = sprites.rotation[i];
    }
    app.renderer.render(app.stage);
  });

  app.destroy(false, { children: true, texture: true, textureSource: true, baseTexture: true });
  return fps;
}

async function createPixiApp(canvas) {
  const PIXI = window.PIXI;
  if (!PIXI) throw new Error("PixiJS did not load.");

  if (PIXI.Application.prototype.init) {
    const app = new PIXI.Application();
    await app.init({
      canvas,
      width: WIDTH,
      height: HEIGHT,
      background: "#f7fdff",
      antialias: false,
      autoDensity: false,
      resolution: 1,
      autoStart: false,
    });
    app.ticker.stop();
    return app;
  }

  const app = new PIXI.Application({
    view: canvas,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0xf7fdff,
    antialias: false,
    resolution: 1,
    autoStart: false,
  });
  app.ticker.stop();
  return app;
}

async function runPhaser3(canvas, sprites) {
  return runPhaser(canvas, sprites, phaser3Global);
}

async function runPhaser4(canvas, sprites) {
  return runPhaser(canvas, sprites, await loadPhaser4());
}

async function runPhaser(canvas, sprites, Phaser) {
  if (!Phaser) throw new Error("Phaser did not load.");

  let ready;
  const readyPromise = new Promise((resolve) => {
    ready = resolve;
  });

  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    canvas,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: "#f7fdff",
    transparent: false,
    banner: false,
    fps: { target: 240, forceSetTimeOut: false },
    scene: {
      create() {
        textureImages.forEach((image, index) => {
          this.textures.addImage(`bench-sprite-${index}`, image);
        });
        for (let i = 0; i < sprites.count; i++) {
          const item = this.add.image(sprites.x[i], sprites.y[i], `bench-sprite-${sprites.textureIndex[i]}`);
          item.setOrigin(0.5);
          item.rotation = sprites.rotation[i];
          item.setTint?.(sprites.tint[i]);
        }
        ready();
      },
      update(_time, deltaMs) {
        updateSprites(sprites, Math.min(deltaMs / 1000, 0.05));
        const children = this.children.list;
        for (let i = 0; i < sprites.count; i++) {
          const item = children[i];
          item.x = sprites.x[i];
          item.y = sprites.y[i];
          item.rotation = sprites.rotation[i];
        }
      },
    },
  });

  await readyPromise;
  const fps = await sampleExternalLoop();
  game.destroy(false);
  return fps;
}

async function runExcalibur(canvas, sprites) {
  const ex = await loadExcalibur();
  const engine = new ex.Engine({
    canvasElement: canvas,
    width: WIDTH,
    height: HEIGHT,
    displayMode: ex.DisplayMode.Fixed,
    backgroundColor: ex.Color.fromHex("#f7fdff"),
    suppressPlayButton: true,
    antialiasing: false,
  });

  const imageSources = TEXTURE_URLS.map((url) => new ex.ImageSource(url));
  await Promise.all(imageSources.map((source) => source.load()));

  const renderSprites = new Array(sprites.count);
  for (let i = 0; i < sprites.count; i++) {
    renderSprites[i] = imageSources[sprites.textureIndex[i]].toSprite({
      tint: ex.Color.fromHex(sprites.tintCss[i]),
    });
  }

  engine.currentScene.on("preupdate", (event) => {
    updateSprites(sprites, Math.min(event.elapsed / 1000, 0.05));
  });

  const halfSize = SPRITE_SIZE / 2;
  engine.currentScene.on("postdraw", (event) => {
    const ctx = event.ctx;

    for (let i = 0; i < sprites.count; i++) {
      ctx.save();
      ctx.translate(sprites.x[i], sprites.y[i]);
      ctx.rotate(sprites.rotation[i]);

      renderSprites[i].draw(ctx, -halfSize, -halfSize);

      ctx.restore();
    }
  });

  await engine.start();
  const fps = await sampleExternalLoop();
  engine.stop();
  engine.dispose?.();
  return fps;
}

async function runKaplay(canvas, sprites) {
  const kaplay = await loadKaplay();
  const k = kaplay({
    canvas,
    width: WIDTH,
    height: HEIGHT,
    background: "#f7fdff",
    global: false,
    buttons: {},
    maxFPS: 240,
  });

  await Promise.all(TEXTURE_URLS.map((url, index) => k.loadSprite(`bench-sprite-${index}`, url)));
  const objects = new Array(sprites.count);

  for (let i = 0; i < sprites.count; i++) {
    objects[i] = k.add([
      k.sprite(`bench-sprite-${sprites.textureIndex[i]}`),
      k.pos(sprites.x[i], sprites.y[i]),
      k.anchor("center"),
      k.rotate((sprites.rotation[i] * 180) / Math.PI),
      k.color(
        (sprites.tint[i] >> 16) & 255,
        (sprites.tint[i] >> 8) & 255,
        sprites.tint[i] & 255,
      ),
    ]);
  }

  k.onUpdate(() => {
    updateSprites(sprites, Math.min(k.dt(), 0.05));
    for (let i = 0; i < sprites.count; i++) {
      const object = objects[i];
      object.pos.x = sprites.x[i];
      object.pos.y = sprites.y[i];
      object.angle = (sprites.rotation[i] * 180) / Math.PI;
    }
  });

  const fps = await sampleExternalLoop();
  k.quit();
  return fps;
}

async function loadExcalibur() {
  excaliburModule ??= import(/* @vite-ignore */ EXCALIBUR_URL);
  return excaliburModule;
}

async function loadPhaser4() {
  if (phaser4Global) return phaser4Global;
  await loadScript(PHASER4_URL);
  phaser4Global = window.Phaser;
  return phaser4Global;
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.append(script);
  });
}

async function loadKaplay() {
  kaplayModule ??= import(/* @vite-ignore */ KAPLAY_URL).then((module) => module.default);
  return kaplayModule;
}

async function loadMelonJS() {
  melonModule ??= import(/* @vite-ignore */ MELONJS_URL);
  return melonModule;
}

function sampleExternalLoop() {
  return new Promise((resolve) => {
    let warmupStart = 0;
    let sampleStart = 0;
    let frames = 0;

    const step = (now) => {
      if (!warmupStart) warmupStart = now;

      if (now - warmupStart < WARMUP_MS) {
        requestAnimationFrame(step);
        return;
      }

      if (!sampleStart) {
        sampleStart = now;
        frames = 1;
      } else {
        frames++;
      }

      const elapsed = now - sampleStart;
      if (elapsed >= SAMPLE_MS) {
        resolve((frames * 1000) / elapsed);
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}

function resetStageCanvas() {
  const currentStage = document.querySelector("#stage") ?? stage;
  const clone = currentStage.cloneNode(false);
  currentStage.replaceWith(clone);
  clone.width = WIDTH;
  clone.height = HEIGHT;
  clone.id = "stage";
  clone.setAttribute("aria-label", "Benchmark render target");
  stage = clone;
  return clone;
}

function initTable() {
  resultsBody.innerHTML = "";
  for (const renderer of renderers) {
    const row = document.createElement("tr");
    row.dataset.renderer = renderer.id;
    row.innerHTML = `
      <th scope="row">
        <span class="renderer-name"><span class="renderer-swatch" style="background:${renderer.color}"></span>${renderer.name}</span>
      </th>
      ${COUNTS.map((count) => `<td data-count="${count}">${count <= renderer.maxCount ? "-" : "skip"}</td>`).join("")}
    `;
    resultsBody.append(row);
  }
}

function clearResults() {
  for (const values of Object.values(results)) values.clear();
  for (const renderer of renderers) {
    for (const count of COUNTS) {
      const cell = resultsBody.querySelector(`tr[data-renderer="${renderer.id}"] td[data-count="${count}"]`);
      if (cell) cell.textContent = count <= renderer.maxCount ? "-" : "skip";
    }
  }
  const total = renderers.reduce((sum, renderer) => sum + countsForRenderer(renderer).length, 0);
  progressText.textContent = `0 / ${total} samples`;
  drawChart();
}

function updateTableCell(rendererId, count, fps) {
  const cell = resultsBody.querySelector(`tr[data-renderer="${rendererId}"] td[data-count="${count}"]`);
  if (cell) cell.textContent = fps.toFixed(1);
}

function drawChart() {
  const ctx = chart.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = chart.clientWidth || chart.width;
  const cssHeight = chart.clientHeight || chart.height;
  chart.width = Math.round(cssWidth * dpr);
  chart.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = cssWidth;
  const height = cssHeight;
  const pad = { left: 58, right: 24, top: 24, bottom: 74 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const allFps = renderers.flatMap((renderer) => [...results[renderer.id].values()]);
  const maxFps = Math.max(60, Math.ceil((Math.max(...allFps, 0) + 10) / 10) * 10);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f7fdff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d7ecdf";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#5a6877";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 5; i++) {
    const value = (maxFps / 5) * i;
    const y = pad.top + plotH - (value / maxFps) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(value)), pad.left - 10, y);
  }

  ctx.fillStyle = "#5a6877";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < COUNTS.length; i++) {
    const x = pad.left + (i / (COUNTS.length - 1)) * plotW;
    ctx.save();
    ctx.translate(x, pad.top + plotH + 16);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = "right";
    ctx.fillText(formatCount(COUNTS[i]), 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(16, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("FPS", 0, 0);
  ctx.restore();

  ctx.fillText("Sprite Count", pad.left + plotW / 2, height - 20);

  const sortedRenderers = [...renderers].sort((a, b) => {
    if (a.id === "rapid") return 1;
    if (b.id === "rapid") return -1;
    return 0;
  });

  for (const renderer of sortedRenderers) {
    const points = COUNTS
      .filter((count) => results[renderer.id].has(count))
      .map((count) => ({
        x: pad.left + (COUNTS.indexOf(count) / (COUNTS.length - 1)) * plotW,
        y: pad.top + plotH - (results[renderer.id].get(count) / maxFps) * plotH,
      }));

    if (!points.length) continue;

    ctx.strokeStyle = renderer.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    ctx.fillStyle = renderer.color;
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawLegend(ctx, width, renderers);
}

function drawLegend(ctx, width, items) {
  
  ctx.textBaseline = "middle";
  let x = width - 24;
  const y = 24;

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const textWidth = ctx.measureText(item.name).width;
    x -= textWidth + 26;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y - 5, 14, 10);
    ctx.font = `${item.id == "rapid" ? "1000" : "500"} 12px system-ui, sans-serif`;
    ctx.fillStyle = "#243142";
    ctx.textAlign = "left";
    ctx.fillText(item.name, x + 20, y);
    x -= 16;
  }
}

function formatCount(count) {
  if (count >= 1000) return `${count / 1000}k`;
  return String(count);
}

function drawIdleStage() {
  const ctx = stage.getContext("2d");
  ctx.fillStyle = "#f7fdff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#243142";
  ctx.font = "900 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Run Benchmark", WIDTH / 2, HEIGHT / 2);
}

function updateStatus(text, active) {
  statusText.textContent = text;
  statusText.classList.toggle("is-running", active);
}

function waitForNextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
