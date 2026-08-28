import { highlightCodeBlock } from "../highlight.js";
import { drawBenchmarkChart } from "./chart.js";
import { averageMetric, getMetric } from "./metrics.js";

const elements = getElements([
    "stage",
    "chart",
    "status-text",
    "progress-text",
    "run-benchmark",
    "results-head",
    "results-body",
    "texture-mode",
    "repeat-count",
    "chart-metric",
    "chart-title",
    "chart-note",
    "export-width",
    "export-height",
    "export-font-size",
    "export-chart",
    "renderer-code",
    "code-title",
    "code-note",
    "code-meta",
]);

let stage = elements.stage;
const stageParent = stage.parentElement;
let chartOptions = null;
let chartMode = null;
let tableResults = null;
let resizeFrame = 0;
let displayedSource = null;

window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
        if (chartOptions) drawChart();
    });
});

elements["export-chart"].addEventListener("click", exportChart);
elements["chart-metric"].addEventListener("change", () => {
    updateChartPresentation();
    if (chartOptions) drawChart();
    if (tableResults) renderResultValues(tableResults);
});

export function getSelectedModeKey() {
    return elements["texture-mode"].value;
}

export function getRepeatCount() {
    const parsed = Number.parseInt(elements["repeat-count"].value, 10);
    const repeatCount = Math.min(20, Math.max(1, Number.isFinite(parsed) ? parsed : 1));
    elements["repeat-count"].value = String(repeatCount);
    return repeatCount;
}

export function getSelectedMetric() {
    return getMetric(elements["chart-metric"].value).key;
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
    elements["repeat-count"].disabled = disabled;
}

export function renderResultsTable({ mode, renderers, getName, formatCount, results }) {
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

    tableResults = { mode, renderers, results };
}

export function updateTableCell(rendererId, count, samples) {
    const cell = elements["results-body"].querySelector(
        `tr[data-renderer="${rendererId}"] td[data-count="${count}"]`,
    );
    if (cell) setCellValue(cell, samples);
}

export function renderResultValues(options = tableResults) {
    if (!options) return;
    tableResults = options;
    for (const renderer of options.renderers) {
        for (const count of options.mode.counts) {
            updateTableCell(renderer.id, count, options.results[renderer.id].get(count));
        }
    }
}

export function showRendererCode({
    renderer,
    count,
    source,
    mode,
    getName,
    formatCount,
    repeat,
    repeatCount,
} = {}) {
    if (!renderer) {
        elements["code-title"].textContent = "Renderer Code";
        elements["code-note"].textContent = "The exact renderer source appears here while the benchmark runs.";
        elements["code-meta"].textContent = "Idle";
        setRendererCode(`Choose a texture mode, set the repeat count, then run the benchmark.

Each renderer source file is loaded as text, displayed here, and executed with new Function().
There is no separate display-only snippet.`);
        return;
    }

    elements["code-title"].textContent = `${getName(renderer, mode.key)} Code`;
    elements["code-note"].textContent = `${mode.label} path · ${formatCount(count)} sprites`;
    elements["code-meta"].textContent = repeatCount > 1
        ? `Run ${repeat} / ${repeatCount}`
        : "Running";
    setRendererCode(source);
}

export function setCodeMeta(text) {
    elements["code-meta"].textContent = text;
}

export function drawResultsChart(options) {
    chartOptions = options;
    drawChart();
}

export function setChartTitle(mode) {
    chartMode = mode;
    updateChartPresentation();
}

export function resetStageCanvas({ width, height }, pixelRatio = 1) {
    const currentStage = document.getElementById("stage") ?? stage;
    const clone = currentStage.cloneNode(false);
    clone.width = Math.round(width * pixelRatio);
    clone.height = Math.round(height * pixelRatio);
    clone.style.width = `${width}px`;
    clone.style.height = `${height}px`;
    clone.style.imageRendering = "pixelated";
    clone.id = "stage";
    clone.setAttribute("aria-label", `${width} by ${height} benchmark render target`);

    if (currentStage.isConnected) currentStage.replaceWith(clone);
    else stageParent.append(clone);

    stage = clone;
    elements.stage = clone;
    return clone;
}

export function drawIdleStage({ width, height, background }) {
    const pixelRatio = window.devicePixelRatio || 1;
    const canvas = resetStageCanvas({ width, height }, pixelRatio);
    const ctx = canvas.getContext("2d");
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#243142";
    ctx.font = "900 42px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Run Benchmark · ${width} × ${height}`, width / 2, height / 2);
}

export function updateStatus(text, active) {
    elements["status-text"].textContent = text;
    elements["status-text"].classList.toggle("is-running", active);
}

export function updateProgress(completed, total, repeat, repeatCount) {
    const repeatText = repeatCount > 1 && repeat
        ? ` · run ${repeat} / ${repeatCount}`
        : "";
    elements["progress-text"].textContent = `${completed} / ${total} samples${repeatText}`;
}

export function showComplete(repeatCount) {
    const suffix = repeatCount === 1 ? "1 run" : `${repeatCount} runs`;
    elements["progress-text"].textContent = `Complete · mean of ${suffix}`;
}

function drawChart() {
    drawBenchmarkChart(elements.chart, createCurrentChartOptions());
}

async function exportChart() {
    if (!chartOptions) return;

    const metric = getMetric(getSelectedMetric());
    const width = readExportDimension("export-width", 640, 8192);
    const height = readExportDimension("export-height", 360, 8192);
    const fontSize = readExportDimension("export-font-size", 8, 96);
    const canvas = document.createElement("canvas");
    const button = elements["export-chart"];
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Exporting…";

    try {
        drawBenchmarkChart(
            canvas,
            createCurrentChartOptions(metric.key),
            { width, height, fontSize },
        );
        const blob = await canvasToBlob(canvas);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rapid-benchmark-${chartMode?.key ?? "chart"}-${metric.key}-${width}x${height}.png`;
        link.hidden = true;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
        showAlert(`Chart export failed: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = previousText;
    }
}

function updateChartPresentation() {
    const metric = getMetric(getSelectedMetric());
    elements["chart-title"].textContent = chartMode
        ? `${metric.label} Chart (${chartMode.label})`
        : `${metric.label} Chart`;
    elements["chart-note"].textContent = metric.note;
    elements.chart.setAttribute(
        "aria-label",
        `${metric.label} benchmark chart using a logarithmic x-axis and linear y-axis`,
    );
}

function createCurrentChartOptions(metric = getSelectedMetric()) {
    return {
        ...chartOptions,
        metric,
    };
}

function setCellValue(cell, samples) {
    const metric = getSelectedMetric();
    const average = averageMetric(samples, metric);
    if (average === null) {
        cell.textContent = "-";
        cell.removeAttribute("title");
        return;
    }

    const digits = average >= 100 ? 0 : 1;
    cell.textContent = `${average.toFixed(digits)} ${getMetric(metric).unit}`;
    cell.title = `Mean of ${samples.length} ${samples.length === 1 ? "run" : "runs"}`;
}

function readExportDimension(id, minimum, maximum) {
    const input = elements[id];
    const parsed = Number.parseInt(input.value, 10);
    const value = Math.min(maximum, Math.max(minimum, Number.isFinite(parsed) ? parsed : minimum));
    input.value = String(value);
    return value;
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("The browser did not create a PNG file."));
        }, "image/png");
    });
}

function setRendererCode(source) {
    if (source === displayedSource) return;
    displayedSource = source;
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
