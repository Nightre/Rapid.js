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

    const script = await pending;
    const value = window[globalName];
    if (!value) {
        scripts.delete(url);
        script.remove();
        throw new Error(`${globalName} did not register after loading ${url}.`);
    }
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
        let script = [...document.scripts].find((candidate) => candidate.src === url);
        if (script?.dataset.loaded === "true") {
            resolve(script);
            return;
        }

        const cleanup = () => {
            script.removeEventListener("load", loaded);
            script.removeEventListener("error", failed);
        };
        const loaded = () => {
            cleanup();
            script.dataset.loaded = "true";
            resolve(script);
        };
        const failed = () => {
            cleanup();
            script.remove();
            reject(new Error(`Failed to load ${url}.`));
        };

        if (!script) {
            script = document.createElement("script");
            script.src = url;
        }
        script.addEventListener("load", loaded, { once: true });
        script.addEventListener("error", failed, { once: true });
        if (!script.isConnected) document.head.append(script);
    });
}
