import { highlightCodeBlock } from "../highlight.js";
import { drawBenchmarkChart } from "./chart.js";

const elements = getElements([
    "stage",
    "chart",
    "status-text",
    "progress-text",
    "run-benchmark",
    "results-head",
    "results-body",
    "texture-mode",
    "chart-title",
    "renderer-code",
    "code-title",
    "code-note",
    "code-meta",
]);

let stage = elements.stage;
const stageParent = stage.parentElement;
let chartOptions = null;
let resizeFrame = 0;

window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
        if (chartOptions) drawBenchmarkChart(elements.chart, chartOptions);
    });
});

export function getSelectedModeKey() {
    return elements["texture-mode"].value;
}

export function onModeChange(listener) {
    elements["texture-mode"].addEventListener("change", (event) => {
        listener(event.target.value);
    });
}

export function onRunBenchmark(listener) {
    elements["run-benchmark"].addEventListener("click", listener);
}

export function onVisibilityChange(listener) {
    document.addEventListener("visibilitychange", () => {
        listener(document.hidden);
    });
}

export function showAlert(message) {
    window.alert(message);
}

export function setControlsDisabled(disabled) {
    elements["run-benchmark"].disabled = disabled;
    elements["texture-mode"].disabled = disabled;
}

export function renderResultsTable({ mode, renderers, getName, formatCount }) {
    elements["results-head"].innerHTML = [
        "<th>Renderer</th>",
        ...mode.counts.map((count) => `<th>${formatCount(count)}</th>`),
    ].join("");
    elements["results-body"].replaceChildren();

    for (const renderer of renderers) {
        const row = document.createElement("tr");
        row.dataset.renderer = renderer.id;
        row.innerHTML = `
            <th scope="row">
                <span class="renderer-name">
                    <span class="renderer-swatch" style="background:${renderer.color}"></span>
                    ${getName(renderer, mode.key)}
                </span>
            </th>
            ${mode.counts.map((count) => `<td data-count="${count}">-</td>`).join("")}
        `;
        elements["results-body"].append(row);
    }
}

export function updateTableCell(rendererId, count, fps) {
    const cell = elements["results-body"].querySelector(
        `tr[data-renderer="${rendererId}"] td[data-count="${count}"]`,
    );
    if (cell) cell.textContent = fps.toFixed(1);
}

export function showRendererCode({
    renderer,
    count,
    source,
    mode,
    getName,
    formatCount,
} = {}) {
    if (!renderer) {
        elements["code-title"].textContent = "Renderer Code";
        elements["code-note"].textContent = "The exact renderer source appears here while the benchmark runs.";
        elements["code-meta"].textContent = "Idle";
        setRendererCode(`Choose a texture mode, then run the benchmark.

Each renderer source file is loaded as text, displayed here, and executed with new Function().
There is no separate display-only snippet.`);
        return;
    }

    elements["code-title"].textContent = `${getName(renderer, mode.key)} Code`;
    elements["code-note"].textContent = `${mode.label} path · ${formatCount(count)} sprites`;
    elements["code-meta"].textContent = "Running";
    setRendererCode(source);
}

export function setCodeMeta(text) {
    elements["code-meta"].textContent = text;
}

export function drawResultsChart(options) {
    chartOptions = options;
    drawBenchmarkChart(elements.chart, options);
}

export function setChartTitle(mode) {
    elements["chart-title"].textContent = `FPS Chart (${mode.label})`;
}

export function resetStageCanvas({ width, height }) {
    const currentStage = document.getElementById("stage") ?? stage;
    const clone = currentStage.cloneNode(false);
    clone.width = width;
    clone.height = height;
    clone.id = "stage";
    clone.setAttribute("aria-label", "Benchmark render target");

    if (currentStage.isConnected) currentStage.replaceWith(clone);
    else stageParent.append(clone);

    stage = clone;
    elements.stage = clone;
    return clone;
}

export function drawIdleStage({ width, height, background }) {
    const canvas = resetStageCanvas({ width, height });
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#243142";
    ctx.font = "900 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Run Benchmark", width / 2, height / 2);
}

export function updateStatus(text, active) {
    elements["status-text"].textContent = text;
    elements["status-text"].classList.toggle("is-running", active);
}

export function updateProgress(completed, total) {
    elements["progress-text"].textContent = `${completed} / ${total} samples`;
}

function setRendererCode(source) {
    const code = elements["renderer-code"];
    delete code.dataset.highlighted;
    code.textContent = source;
    code.className = "language-javascript";
    highlightCodeBlock(code);
}

function getElements(ids) {
    return Object.fromEntries(ids.map((id) => {
        const element = document.getElementById(id);
        if (!element) throw new Error(`Missing benchmark element #${id}.`);
        return [id, element];
    }));
}
