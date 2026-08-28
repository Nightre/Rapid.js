const METRICS = Object.freeze({
    fps: Object.freeze({
        key: "fps",
        label: "FPS",
        note: "Higher FPS is better · Log X-axis",
        unit: "FPS",
        axisLabel: "FPS",
        fallbackMax: 240,
    }),
    p99: Object.freeze({
        key: "p99",
        label: "P99 Frame Time",
        note: "Lower is better · Log X-axis",
        unit: "ms",
        axisLabel: "P99 frame time (ms)",
        fallbackMax: 100,
    }),
});

export function getMetric(key) {
    return METRICS[key] ?? METRICS.fps;
}

export function averageMetric(samples, metric) {
    if (!samples?.length) return null;
    const values = samples
        .map((sample) => sample?.[metric])
        .filter(isPositiveNumber);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function validateMeasurement(measurement) {
    for (const metric of ["fps", "p99"]) {
        if (!isPositiveNumber(measurement?.[metric])) {
            throw new TypeError(`Renderer returned an invalid ${metric.toUpperCase()} measurement.`);
        }
    }
    return measurement;
}

export function isPositiveNumber(value) {
    return Number.isFinite(value) && value > 0;
}
