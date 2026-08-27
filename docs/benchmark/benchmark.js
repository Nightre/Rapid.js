import {
    CanvasScaleMode,
    Color,
    Rapid,
    TextureFilterMode,
} from "rapid-render";
import { BENCHMARK, getMode } from "./config.js";
import {
    getRendererName,
    loadRenderer,
    renderers,
    supportsMode,
} from "./renderer-loader.js";
import { loadGlobalScript, loadImage, loadModule } from "./resources.js";
import { createSampler } from "./sampler.js";
import { createSprites, updateSprites } from "./sprites.js";
import * as view from "./view.js";

let currentMode = getMode(view.getSelectedModeKey());
let running = false;

const results = Object.fromEntries(
    renderers.map((renderer) => [renderer.id, new Map()]),
);
const sampler = createSampler({
    warmupMs: BENCHMARK.warmupMs,
    sampleMs: BENCHMARK.sampleMs,
    externalTimeoutMs: BENCHMARK.externalTimeoutMs,
});
const textureImages = await Promise.all(BENCHMARK.textureUrls.map(loadImage));
const updateBenchmarkSprites = (sprites, delta) => {
    updateSprites(sprites, delta, BENCHMARK);
};
const libraries = Object.freeze({
    CanvasScaleMode,
    Color,
    Rapid,
    TextureFilterMode,
});
let activeRunController = null;

resetResults();
view.showRendererCode();
view.drawIdleStage(BENCHMARK);

view.onModeChange((modeKey) => {
    currentMode = getMode(modeKey);
    resetResults();
    view.showRendererCode();
    view.drawIdleStage(BENCHMARK);
});

view.onRunBenchmark(runBenchmark);
view.onVisibilityChange((hidden) => {
    if (hidden && running) interruptBackgroundRun();
});

async function runBenchmark() {
    if (running) return;

    const mode = currentMode;
    const activeRenderers = getActiveRenderers(mode.key);
    const controller = new AbortController();
    const { signal } = controller;
    let total = activeRenderers.length * mode.counts.length;
    let completed = 0;

    running = true;
    activeRunController = controller;
    view.setControlsDisabled(true);
    resetResults();

    try {
        for (const renderer of activeRenderers) {
            view.updateStatus(`Loading ${getRendererName(renderer, mode.key)} source`, true);
            const executable = await abortable(loadRenderer(renderer), signal);

            for (let countIndex = 0; countIndex < mode.counts.length; countIndex++) {
                throwIfAborted(signal);
                const count = mode.counts[countIndex];
                view.showRendererCode({
                    renderer,
                    count,
                    source: executable.source,
                    mode,
                    getName: getRendererName,
                    formatCount,
                });
                view.updateStatus(
                    `${getRendererName(renderer, mode.key)} · ${formatCount(count)} sprites`,
                    true,
                );
                view.updateProgress(completed, total);

                const fps = await abortable(
                    executable.run(createRendererRuntime(
                        mode.key,
                        view.resetStageCanvas(BENCHMARK),
                        count,
                        signal,
                    )),
                    signal,
                );
                throwIfAborted(signal);

                results[renderer.id].set(count, fps);
                completed++;
                view.updateProgress(completed, total);
                view.updateTableCell(renderer.id, count, fps);
                drawChart();
                await nextFrame(signal);

                if (fps < 10) {
                    total -= mode.counts.length - countIndex - 1;
                    view.updateProgress(completed, total);
                    view.updateStatus(
                        `${getRendererName(renderer, mode.key)} stopped at ${formatCount(count)} sprites (FPS < 10)`,
                        false,
                    );
                    break;
                }
            }
        }

        view.updateStatus("Complete", false);
        view.setCodeMeta("Complete");
    } catch (error) {
        if (!isAbortError(error)) {
            console.error(error);
            view.updateStatus(`Benchmark failed: ${error.message}`, false);
            view.setCodeMeta("Error");
        }
    } finally {
        if (activeRunController === controller) activeRunController = null;
        running = false;
        view.setControlsDisabled(false);
    }
}

function createRendererRuntime(mode, canvas, count, signal) {
    return Object.freeze({
        canvas,
        mode,
        width: BENCHMARK.width,
        height: BENCHMARK.height,
        spriteSize: BENCHMARK.spriteSize,
        background: BENCHMARK.background,
        textureImages,
        textureUrls: BENCHMARK.textureUrls,
        sampleLoop: (draw) => sampler.sampleLoop(draw, { signal }),
        sampleExternalLoop: (subscribe) => sampler.sampleExternalLoop(
            subscribe,
            { signal },
        ),
        updateSprites: updateBenchmarkSprites,
        loadGlobalScript,
        loadModule,
        libraries,
        createSprites: (createColor) => createSprites(count, {
            ...BENCHMARK,
            textureCount: textureImages.length,
            multiTexture: mode === "multi",
            createColor,
        }),
    });
}

function getActiveRenderers(mode = currentMode.key) {
    return renderers.filter((renderer) => supportsMode(renderer, mode));
}

function resetResults() {
    for (const values of Object.values(results)) values.clear();
    view.renderResultsTable({
        mode: currentMode,
        renderers: getActiveRenderers(),
        getName: getRendererName,
        formatCount,
    });
    view.updateProgress(0, getActiveRenderers().length * currentMode.counts.length);
    view.setChartTitle(currentMode);
    drawChart();
}

function drawChart() {
    view.drawResultsChart({
        counts: currentMode.counts,
        renderers: getActiveRenderers(),
        results,
        getName: (renderer) => getRendererName(renderer, currentMode.key),
        formatCount,
        background: BENCHMARK.background,
    });
}

function interruptBackgroundRun() {
    const message = "检测到页面切换到后台。切换后台会导致 Benchmark 数据有误，本次测试已结束，结果已清空。";
    activeRunController?.abort(createAbortError(message));
    resetResults();
    view.showRendererCode();
    view.drawIdleStage(BENCHMARK);
    view.updateStatus("Stopped: page switched to background; results cleared.", false);
    view.setCodeMeta("Stopped");
    view.showAlert(message);
}

function formatCount(count) {
    if (count >= 1000000) return `${count / 1000000}m`;
    if (count >= 1000) return `${count / 1000}k`;
    return String(count);
}

function nextFrame(signal) {
    return abortable(
        new Promise((resolve) => requestAnimationFrame(resolve)),
        signal,
    );
}

function abortable(promise, signal) {
    if (signal.aborted) return Promise.reject(getAbortReason(signal));

    return new Promise((resolve, reject) => {
        const abort = () => {
            signal.removeEventListener("abort", abort);
            reject(getAbortReason(signal));
        };
        signal.addEventListener("abort", abort, { once: true });
        Promise.resolve(promise).then(
            (value) => {
                signal.removeEventListener("abort", abort);
                resolve(value);
            },
            (error) => {
                signal.removeEventListener("abort", abort);
                reject(error);
            },
        );
    });
}

function throwIfAborted(signal) {
    if (signal.aborted) throw getAbortReason(signal);
}

function getAbortReason(signal) {
    if (signal.reason instanceof Error) return signal.reason;
    return createAbortError(signal.reason || "Benchmark aborted.");
}

function createAbortError(message) {
    const error = new Error(message);
    error.name = "AbortError";
    return error;
}

function isAbortError(error) {
    return error?.name === "AbortError";
}
