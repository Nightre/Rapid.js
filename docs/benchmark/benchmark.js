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
import { validateMeasurement } from "./metrics.js";
import { createSampler } from "./sampler.js";
import {
    createSprites,
    updatePhaserParticles,
    updatePixiParticles,
    updateSprites,
} from "./sprites.js";
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
const updateBenchmarkPixiSpritesDirectly = (sprites, renderSprites, delta) => {
    updatePixiParticles(sprites, renderSprites, delta, BENCHMARK);
};
const updateBenchmarkPhaserSprites = (sprites, layer, member, delta) => {
    updatePhaserParticles(sprites, layer, member, delta, BENCHMARK);
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
    const repeatCount = view.getRepeatCount();
    const controller = new AbortController();
    const { signal } = controller;
    let total = activeRenderers.length * mode.counts.length * repeatCount;
    let completed = 0;
    const lastCountIndices = Object.fromEntries(
        activeRenderers.map((renderer) => [renderer.id, mode.counts.length - 1]),
    );

    running = true;
    activeRunController = controller;
    view.setControlsDisabled(true);
    resetResults();

    try {
        for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex++) {
            const repeat = repeatIndex + 1;
            for (const renderer of rotate(activeRenderers, repeatIndex)) {
                view.updateStatus(
                    `Run ${repeat} / ${repeatCount} · loading ${getRendererName(renderer, mode.key)} source`,
                    true,
                );
                const executable = await abortable(loadRenderer(renderer), signal);

                for (let countIndex = 0; countIndex <= lastCountIndices[renderer.id]; countIndex++) {
                    throwIfAborted(signal);
                    const count = mode.counts[countIndex];
                    view.showRendererCode({
                        renderer,
                        count,
                        source: executable.source,
                        mode,
                        getName: getRendererName,
                        formatCount,
                        repeat,
                        repeatCount,
                    });
                    view.updateStatus(
                        `Run ${repeat} / ${repeatCount} · ${getRendererName(renderer, mode.key)} · ${formatCount(count)} sprites`,
                        true,
                    );
                    view.updateProgress(completed, total, repeat, repeatCount);

                    const measurement = validateMeasurement(await abortable(
                        executable.run(createRendererRuntime(
                            mode.key,
                            view.resetStageCanvas(BENCHMARK),
                            count,
                            signal,
                        )),
                        signal,
                    ));
                    throwIfAborted(signal);

                    const samples = getSamples(renderer.id, count);
                    samples.push(measurement);
                    completed++;
                    view.updateProgress(completed, total, repeat, repeatCount);
                    view.updateTableCell(renderer.id, count, samples);
                    drawChart();
                    await nextFrame(signal);

                    if (repeatIndex === 0 && measurement.fps < 10) {
                        const skippedCounts = lastCountIndices[renderer.id] - countIndex;
                        lastCountIndices[renderer.id] = countIndex;
                        total -= skippedCounts * repeatCount;
                        view.updateProgress(completed, total, repeat, repeatCount);
                        view.updateStatus(
                            `${getRendererName(renderer, mode.key)} capped at ${formatCount(count)} sprites (FPS < 10); this range will be repeated ${repeatCount}×`,
                            false,
                        );
                        break;
                    }
                }
            }
        }

        const runLabel = repeatCount === 1 ? "1 run" : `${repeatCount} runs`;
        view.updateStatus(`Complete · mean of ${runLabel}`, false);
        view.showComplete(repeatCount);
        view.setCodeMeta(`Complete · mean of ${runLabel}`);
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
        updatePixiParticles: updateBenchmarkPixiSpritesDirectly,
        updatePhaserParticles: updateBenchmarkPhaserSprites,
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
    const activeRenderers = getActiveRenderers();
    for (const values of Object.values(results)) values.clear();
    view.renderResultsTable({
        mode: currentMode,
        renderers: activeRenderers,
        getName: getRendererName,
        formatCount,
        results,
    });
    view.updateProgress(
        0,
        activeRenderers.length * currentMode.counts.length * view.getRepeatCount(),
    );
    view.setChartTitle(currentMode);
    drawChart();
}

function rotate(items, offset) {
    if (items.length < 2) return items;
    const pivot = offset % items.length;
    return pivot === 0
        ? items
        : [...items.slice(pivot), ...items.slice(0, pivot)];
}

function getSamples(rendererId, count) {
    const rendererResults = results[rendererId];
    let samples = rendererResults.get(count);
    if (!samples) {
        samples = [];
        rendererResults.set(count, samples);
    }
    return samples;
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
    const message = "The page was detected switching to the background. Switching to the background causes benchmark data inaccuracies; the test has ended, and the results have been cleared.";
    activeRunController?.abort(createAbortError(message));
    resetResults();
    view.showRendererCode();
    view.drawIdleStage(BENCHMARK);
    view.updateStatus("Stopped: page switched to background; results cleared.", false);
    view.setCodeMeta("Stopped");
    view.showAlert(message);
}

function formatCount(count) {
    if (count >= 1000000) return `${formatCompactValue(count / 1000000)}m`;
    if (count >= 1000) return `${formatCompactValue(count / 1000)}k`;
    return String(count);
}

function formatCompactValue(value) {
    if (value >= 100) return value.toFixed(0);
    if (value >= 10) return value.toFixed(1).replace(/\.0$/, "");
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
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
