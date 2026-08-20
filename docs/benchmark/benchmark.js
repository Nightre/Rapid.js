import { Color } from "rapid-render";
import { highlightCodeBlock } from "../highlight.js";
import { renderers } from "./renderers/index.js";

const WIDTH = 640;
const HEIGHT = 360;
const SPRITE_SIZE = 64;
const COUNTS = [
    500, 1000, 3000, 5000, 10000, 20000, 30000, 40000, 50000, 60000,
    70000, 80000, 90000, 100000, 125000, 150000, 175000, 200000, 400000,
];
const SINGLE_TEXTURE_COUNTS = [10000, 50000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 1000000];
const TEXTURE_URLS = ["../image/toycar.png", "../image/tree.png", "../image/knife.png", "../image/sprite.png", "../image/logo_title.png"];
const WARMUP_MS = 2000;
const SAMPLE_MS = 3000;
const SINGLE_TEXTURE_SKIP = new Set(["excalibur", "canvas"]);

let stage = document.querySelector("#stage");
const chart = document.querySelector("#chart");
const statusText = document.querySelector("#status-text");
const progressText = document.querySelector("#progress-text");
const runButton = document.querySelector("#run-benchmark");
const resultsHead = document.querySelector("#results-head");
const resultsBody = document.querySelector("#results-body");
const textureModeSelect = document.querySelector("#texture-mode");
const chartTitle = document.querySelector("#chart-title");
const rendererCode = document.querySelector("#renderer-code");
const codeTitle = document.querySelector("#code-title");
const codeNote = document.querySelector("#code-note");
const codeMeta = document.querySelector("#code-meta");

let isMultiTextureMode = true;
let running = false;

const results = Object.fromEntries(renderers.map((renderer) => [renderer.id, new Map()]));
const textureImages = await Promise.all(TEXTURE_URLS.map(loadImage));
const rendererContext = {
    width: WIDTH,
    height: HEIGHT,
    spriteSize: SPRITE_SIZE,
    textureImages,
    textureUrls: TEXTURE_URLS,
    isMultiTextureMode: () => isMultiTextureMode,
    sampleLoop,
    sampleExternalLoop,
    updateSprites,
};

renderResultsTable();
progressText.textContent = `0 / ${totalSamples()} samples`;
showRendererCode(null);
drawChart();
drawIdleStage();
updateChartTitle();

textureModeSelect.addEventListener("change", (event) => {
    isMultiTextureMode = event.target.value === "multi";
    updateChartTitle();
    renderResultsTable();
    showRendererCode(null);
    if (Object.values(results).some((map) => map.size > 0)) clearResults();
});

runButton.addEventListener("click", async () => {
    if (running) return;
    running = true;
    runButton.disabled = true;
    clearResults();

    let completed = 0;
    const total = totalSamples();

    try {
        for (const renderer of renderers) {
            if (shouldSkipRenderer(renderer)) continue;

            for (const count of countsForRenderer()) {
                showRendererCode(renderer, count);
                updateStatus(`${getRendererName(renderer)} · ${formatCount(count)} sprites`, true);
                progressText.textContent = `${completed} / ${total} samples`;

                const sprites = createSprites(count);
                const fps = await renderer.run(rendererContext, resetStageCanvas(), sprites);
                results[renderer.id].set(count, fps);

                completed++;
                progressText.textContent = `${completed} / ${total} samples`;
                updateTableCell(renderer.id, count, fps);
                drawChart();
                await waitForNextFrame();

                if (fps < 10) {
                    updateStatus(`${getRendererName(renderer)} stopped at ${formatCount(count)} sprites (FPS < 10)`, false);
                    break;
                }
            }
        }

        updateStatus("Complete", false);
        codeMeta.textContent = "Complete";
    } catch (error) {
        console.error(error);
        updateStatus("Benchmark failed. Check the console.", false);
        codeMeta.textContent = "Error";
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

function countsForRenderer() {
    return isMultiTextureMode ? COUNTS : SINGLE_TEXTURE_COUNTS;
}

function totalSamples() {
    return renderers.reduce((sum, renderer) => {
        if (shouldSkipRenderer(renderer)) return sum;
        return sum + countsForRenderer().length;
    }, 0);
}

function activeRenderers() {
    return renderers.filter((renderer) => !shouldSkipRenderer(renderer));
}

function shouldSkipRenderer(renderer) {
    return !isMultiTextureMode && SINGLE_TEXTURE_SKIP.has(renderer.id);
}

function getModeKey() {
    return isMultiTextureMode ? "multi" : "single";
}

function getModeLabel() {
    return isMultiTextureMode ? "Multi Texture" : "Single Texture";
}

function getRendererName(renderer) {
    return !isMultiTextureMode && renderer.singleName ? renderer.singleName : renderer.name;
}

function showRendererCode(renderer, count) {
    if (!renderer) {
        codeTitle.textContent = "Renderer Code";
        codeNote.textContent = "The active renderer snippet appears here while the benchmark runs.";
        codeMeta.textContent = "Idle";
        setRendererCode(`Choose a texture mode, then run the benchmark.

The page will show the exact renderer path being measured:

- Rapid.js drawSprite / drawParticles
- PixiJS Sprite / ParticleContainer
- Phaser Image / SpriteGPULayer
- Excalibur postdraw sprites
- Canvas 2D drawImage`);
        return;
    }

    const mode = getModeKey();
    const snippets = renderer.snippets ?? {};
    codeTitle.textContent = `${getRendererName(renderer)} Code`;
    codeNote.textContent = `${getModeLabel()} path${count ? ` · ${formatCount(count)} sprites` : ""}`;
    codeMeta.textContent = "Running";
    setRendererCode(snippets[mode] ?? snippets.multi ?? "// No code snippet is available for this renderer path.");
}

function setRendererCode(source) {
    delete rendererCode.dataset.highlighted;
    rendererCode.textContent = source;
    rendererCode.className = "language-javascript";
    highlightCodeBlock(rendererCode);
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
        textureIndex[i] = isMultiTextureMode ? Math.floor(random() * textureImages.length) : 0;
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

function renderResultsTable() {
    const currentCounts = countsForRenderer();
    resultsHead.innerHTML = ["<th>Renderer</th>", ...currentCounts.map((count) => `<th>${formatCount(count)}</th>`)].join("");
    resultsBody.innerHTML = "";

    for (const renderer of activeRenderers()) {
        const row = document.createElement("tr");
        row.dataset.renderer = renderer.id;
        row.innerHTML = `
      <th scope="row">
        <span class="renderer-name"><span class="renderer-swatch" style="background:${renderer.color}"></span>${getRendererName(renderer)}</span>
      </th>
      ${currentCounts.map((count) => `<td data-count="${count}">-</td>`).join("")}
    `;
        resultsBody.append(row);
    }
}

function clearResults() {
    for (const values of Object.values(results)) values.clear();
    renderResultsTable();
    progressText.textContent = `0 / ${totalSamples()} samples`;
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

    const pad = { left: 70, right: 32, top: 36, bottom: 88 };
    const plotW = cssWidth - pad.left - pad.right;
    const plotH = cssHeight - pad.top - pad.bottom;
    const currentCounts = countsForRenderer();
    const visibleRenderers = activeRenderers();
    const allFps = visibleRenderers.flatMap((renderer) => [...results[renderer.id].values()]);
    const maxFps = Math.max(60, Math.ceil((Math.max(...allFps, 0) + 10) / 10) * 10);

    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    drawChartGrid(ctx, cssWidth, cssHeight, pad, plotW, plotH, maxFps, currentCounts);
    drawChartLines(ctx, pad, plotW, plotH, maxFps, currentCounts, visibleRenderers);
    drawLegend(ctx, cssWidth, visibleRenderers);
}

function drawChartGrid(ctx, width, height, pad, plotW, plotH, maxFps, currentCounts) {
    ctx.strokeStyle = "#d7ecdf";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#5a6877";
    ctx.font = "800 15px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 5; i++) {
        const value = (maxFps / 5) * i;
        const y = pad.top + plotH - (value / maxFps) * plotH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(width - pad.right, y);
        ctx.stroke();
        ctx.fillText(String(Math.round(value)), pad.left - 14, y);
    }

    ctx.fillStyle = "#5a6877";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "800 15px system-ui, sans-serif";
    for (let i = 0; i < currentCounts.length; i++) {
        const x = pad.left + (i / (currentCounts.length - 1)) * plotW;
        ctx.save();
        ctx.translate(x, pad.top + plotH + 16);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "right";
        ctx.fillText(formatCount(currentCounts[i]), 0, 0);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = "900 16px system-ui, sans-serif";
    ctx.fillText("FPS", 0, 0);
    ctx.restore();
    ctx.font = "900 16px system-ui, sans-serif";
    ctx.fillText("Sprite Count", pad.left + plotW / 2, height - 20);
}

function drawChartLines(ctx, pad, plotW, plotH, maxFps, currentCounts, visibleRenderers) {
    const sortedRenderers = [...visibleRenderers].sort((a, b) => {
        if (a.id === "rapid") return 1;
        if (b.id === "rapid") return -1;
        return 0;
    });

    for (const renderer of sortedRenderers) {
        const points = currentCounts
            .filter((count) => results[renderer.id].has(count))
            .map((count) => ({
                x: pad.left + (currentCounts.indexOf(count) / (currentCounts.length - 1)) * plotW,
                y: pad.top + plotH - (results[renderer.id].get(count) / maxFps) * plotH,
            }));

        if (!points.length) continue;

        ctx.strokeStyle = renderer.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        ctx.fillStyle = renderer.color;
        for (const point of points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawLegend(ctx, width, items) {
    ctx.textBaseline = "middle";
    let x = width - 24;
    const y = 28;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const displayName = getRendererName(item);
        ctx.font = `${item.id === "rapid" ? "1000" : "650"} 15px system-ui, sans-serif`;
        const textWidth = ctx.measureText(displayName).width;
        x -= textWidth + 32;
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y - 7, 18, 14);
        ctx.fillStyle = "#243142";
        ctx.textAlign = "left";
        ctx.fillText(displayName, x + 25, y);
        x -= 20;
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

function updateChartTitle() {
    chartTitle.textContent = `FPS Chart (${getModeLabel()})`;
}

function updateStatus(text, active) {
    statusText.textContent = text;
    statusText.classList.toggle("is-running", active);
}

function waitForNextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
