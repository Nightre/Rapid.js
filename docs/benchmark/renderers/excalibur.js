async function run(runtime) {
    const {
        canvas,
        width,
        height,
        spriteSize,
        background,
        textureUrls,
        sampleExternalLoop,
        updateSprites,
        loadModule,
        createSprites,
    } = runtime;
    const ex = await loadModule("https://esm.sh/excalibur");
    const createColor = (red, green, blue) => new ex.Color(red, green, blue);
    const sprites = createSprites(createColor);
    const engine = new ex.Engine({
        canvasElement: canvas,
        width,
        height,
        displayMode: ex.DisplayMode.Fixed,
        backgroundColor: ex.Color.fromHex(background),
        suppressPlayButton: true,
        antialiasing: false,
    });
    const imageSources = textureUrls.map((url) => new ex.ImageSource(url));
    await Promise.all(imageSources.map((source) => source.load()));

    const renderSprites = new Array(sprites.count);
    for (let i = 0; i < sprites.count; i++) {
        renderSprites[i] = imageSources[sprites.textureIndex[i]].toSprite({
            tint: sprites.color[i],
        });
    }

    engine.currentScene.on("preupdate", (event) => {
        updateSprites(sprites, Math.min(event.elapsed / 1000, 0.05));
    });

    const halfSize = spriteSize * 0.5;
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

    try {
        await engine.start();
        return await sampleExternalLoop((frameCompleted) => {
            engine.on("postframe", frameCompleted);
            return () => engine.off("postframe", frameCompleted);
        });
    } finally {
        engine.stop();
        engine.dispose?.();
    }
}
