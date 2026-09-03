const definitions = [

    {
        id: "rapid",
        name: "Rapid.js",
        singleName: "Rapid.js (DrawParticles)",
        color: "#ff0048",
        file: "rapid.js",
        modes: ["multi", "single"],
    },
    {
        id: "pixijs",
        name: "PixiJS v8",
        singleName: "PixiJS (ParticleContainer)",
        color: "#00c49f",
        file: "pixijs.js",
        modes: ["multi", "single"],
    },
    {
        id: "phaser",
        name: "Phaser 4",
        singleName: "Phaser (SpriteGPULayer)",
        color: "#ffb703",
        file: "phaser.js",
        modes: ["multi", "single"],
    },
    {
        id: "excalibur",
        name: "Excalibur",
        color: "#6291f0",
        file: "excalibur.js",
        modes: ["multi"],
    },
    {
        id: "canvas",
        name: "Canvas 2D",
        color: "#6c757d",
        file: "canvas2d.js",
        modes: ["multi"],
    },
];

export const renderers = Object.freeze(
    definitions.map((definition) => Object.freeze({
        ...definition,
        modes: Object.freeze([...definition.modes]),
    })),
);

const executableCache = new Map();

export function supportsMode(renderer, mode) {
    return renderer.modes.includes(mode);
}

export function getRendererName(renderer, mode) {
    return mode === "single" && renderer.singleName
        ? renderer.singleName
        : renderer.name;
}

export function loadRenderer(renderer) {
    let pending = executableCache.get(renderer.id);
    if (!pending) {
        pending = fetchAndCompile(renderer).catch((error) => {
            executableCache.delete(renderer.id);
            throw error;
        });
        executableCache.set(renderer.id, pending);
    }
    return pending;
}

async function fetchAndCompile(renderer) {
    const url = new URL(`./renderers/${renderer.file}`, window.location.href);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${renderer.name} source (${response.status}).`);
    }

    const source = (await response.text()).trim();
    const createRunner = new Function(
        `"use strict";\n${source}\nreturn run;\n//# sourceURL=${url.href}`,
    );
    const run = createRunner();

    if (typeof run !== "function") {
        throw new TypeError(`${renderer.file} must declare a function named run.`);
    }

    return Object.freeze({ source, run });
}