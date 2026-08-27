const scripts = new Map();
const modules = new Map();

export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image), { once: true });
        image.addEventListener("error", () => {
            reject(new Error(`Failed to load ${url}.`));
        }, { once: true });
        image.src = url;
    });
}

export async function loadGlobalScript(url, globalName) {
    if (window[globalName]) return window[globalName];

    let pending = scripts.get(url);
    if (!pending) {
        pending = appendScript(url).catch((error) => {
            scripts.delete(url);
            throw error;
        });
        scripts.set(url, pending);
    }

    await pending;
    const value = window[globalName];
    if (!value) throw new Error(`${globalName} did not register after loading ${url}.`);
    return value;
}

export function loadModule(url) {
    let pending = modules.get(url);
    if (!pending) {
        pending = import(/* @vite-ignore */ url).catch((error) => {
            modules.delete(url);
            throw error;
        });
        modules.set(url, pending);
    }
    return pending;
}

function appendScript(url) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
            if (existing.dataset.loaded === "true") resolve();
            else {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", reject, { once: true });
            }
            return;
        }

        const script = document.createElement("script");
        script.src = url;
        script.addEventListener("load", () => {
            script.dataset.loaded = "true";
            resolve();
        }, { once: true });
        script.addEventListener("error", () => {
            reject(new Error(`Failed to load ${url}.`));
        }, { once: true });
        document.head.append(script);
    });
}
