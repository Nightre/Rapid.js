export const BENCHMARK = Object.freeze({
    width: 640,
    height: 360,
    spriteSize: 64,
    background: "#f7fdff",
    warmupMs: 2000,
    sampleMs: 3000,
    externalTimeoutMs: 15000,
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
        counts: Object.freeze([
            500, 1000, 3000, 5000, 10000, 20000, 30000, 40000, 50000,
            60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000,
            200000, 400000,
        ]),
    }),
    single: Object.freeze({
        key: "single",
        label: "Single Texture",
        counts: Object.freeze([
            10000, 50000, 100000, 150000, 200000, 250000, 300000,
            400000, 500000, 1000000,
        ]),
    }),
});

export function getMode(key) {
    return MODES[key] ?? MODES.multi;
}
