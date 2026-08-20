const EXCALIBUR_URL = "https://esm.sh/excalibur";

let excaliburModule = null;

export const excaliburRenderer = {
    id: "excalibur",
    name: "Excalibur",
    color: "#6291f0",
    run: runExcalibur,
    snippets: {
        multi: `const imageSources = TEXTURE_URLS.map((url) => new ex.ImageSource(url));
await Promise.all(imageSources.map((source) => source.load()));

const renderSprites = new Array(sprites.count);
for (let i = 0; i < sprites.count; i++) {
    renderSprites[i] = imageSources[sprites.textureIndex[i]].toSprite({
        tint: ex.Color.fromHex(sprites.tintCss[i]),
    });
}

engine.currentScene.on("preupdate", (event) => {
    updateSprites(sprites, Math.min(event.elapsed / 1000, 0.05));
});

engine.currentScene.on("postdraw", (event) => {
    const ctx = event.ctx;
    for (let i = 0; i < sprites.count; i++) {
        ctx.save();
        ctx.translate(sprites.x[i], sprites.y[i]);
        ctx.rotate(sprites.rotation[i]);
        renderSprites[i].draw(ctx, -32, -32);
        ctx.restore();
    }
});`,
    },
};

async function runExcalibur(context, canvas, sprites) {
    const ex = await loadExcalibur();
    const engine = new ex.Engine({
        canvasElement: canvas,
        width: context.width,
        height: context.height,
        displayMode: ex.DisplayMode.Fixed,
        backgroundColor: ex.Color.fromHex("#f7fdff"),
        suppressPlayButton: true,
        antialiasing: false,
    });

    const imageSources = context.textureUrls.map((url) => new ex.ImageSource(url));
    await Promise.all(imageSources.map((source) => source.load()));

    const renderSprites = new Array(sprites.count);
    for (let i = 0; i < sprites.count; i++) {
        renderSprites[i] = imageSources[sprites.textureIndex[i]].toSprite({
            tint: ex.Color.fromHex(sprites.tintCss[i]),
        });
    }

    engine.currentScene.on("preupdate", (event) => {
        context.updateSprites(sprites, Math.min(event.elapsed / 1000, 0.05));
    });

    const halfSize = context.spriteSize / 2;
    engine.currentScene.on("postdraw", (event) => {
        const ctx = event.ctx;

        for (let i = 0; i < sprites.count; i++) {
            ctx.save();
            ctx.translate(sprites.x[i], sprites.y[i]);
            ctx.rotate(sprites.rotation[i]);
            renderSprites[i].draw(ctx, -halfSize, -halfSize);
            ctx.restore();
        }
    });

    await engine.start();
    const fps = await context.sampleExternalLoop();
    engine.stop();
    engine.dispose?.();
    return fps;
}

async function loadExcalibur() {
    excaliburModule ??= import(/* @vite-ignore */ EXCALIBUR_URL);
    return excaliburModule;
}
