export const BENCHMARK = Object.freeze({
    width: 1280,
    height: 720,
    spriteSize: 64,
    background: "#f7fdff",
    warmupMs: 2000,
    sampleMs: 6000,
    externalTimeoutMs: 20000,
    textureUrls: Object.freeze([
        "../image/toycar.png",
        "../image/tree.png",
        "../image/knife.png",
        "../image/sprite.png",
        "../image/logo_title.png",
    ]),
});

export const MODES = Object.freeze({
    multi: Object.freeze({
        key: "multi",
        label: "Multi Texture",
        counts: createDoublingCounts(500, 400000),
    }),
    single: Object.freeze({
        key: "single",
        label: "Single Texture",
        counts: createDoublingCounts(20000, 1000000),
    }),
});

export function getMode(key) {
    return MODES[key] ?? MODES.multi;
}

function createDoublingCounts(start, target) {
    const counts = [start];
    while (counts.at(-1) < target) counts.push(counts.at(-1) * 2);

    const upper = counts.at(-1);
    const lower = counts.at(-2);
    if (lower && target - lower < upper - target) counts.pop();
    return Object.freeze(counts);
}
