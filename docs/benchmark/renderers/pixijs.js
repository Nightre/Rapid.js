async function run(runtime) {
    const {
        canvas,
        mode,
        width,
        height,
        background,
        textureImages,
        sampleLoop,
        updateSprites,
        updatePixiParticles,
        loadGlobalScript,
        createSprites,
    } = runtime;
    const PIXI = await loadGlobalScript(
        "https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js",
        "PIXI",
    );
    const createColor = (red, green, blue) => (
        new PIXI.Color({ r: red, g: green, b: blue })
    );
    const sprites = createSprites(createColor);
    const app = await createApplication(PIXI, canvas, width, height, background);
    const textures = textureImages.map((image) => PIXI.Texture.from(image));
    for (const texture of textures) texture.source.scaleMode = "nearest";
    let container;
    let renderSprites;

    if (mode === "single") {
        container = new PIXI.ParticleContainer({
            dynamicProperties: {
                position: true, // Update positions each frame
                rotation: true, // Update rotations each frame
            },
        });
        app.stage.addChild(container);
        renderSprites = new Array(sprites.count);

        for (let i = 0; i < sprites.count; i++) {
            const particle = new PIXI.Particle({
                texture: textures[0],
                anchorX: 0.5,
                anchorY: 0.5,
                x: sprites.x[i],
                y: sprites.y[i],
                rotation: sprites.rotation[i],
                tint: sprites.color[i],
            });
            container.addParticle(particle);
            renderSprites[i] = particle;
        }
    } else {
        container = new PIXI.Container();
        app.stage.addChild(container);

        for (let i = 0; i < sprites.count; i++) {
            const sprite = new PIXI.Sprite(textures[sprites.textureIndex[i]]);
            sprite.anchor.set(0.5);
            sprite.position.set(sprites.x[i], sprites.y[i]);
            sprite.rotation = sprites.rotation[i];
            sprite.tint = sprites.color[i];
            container.addChild(sprite);
        }
        renderSprites = container.children;
    }

    try {
        return await sampleLoop((delta) => {
            if (mode === "single") {
                updatePixiParticles(sprites, renderSprites, delta); // defined in sprites.js
            } else {
                updateSprites(sprites, delta); // defined in sprites.js
                for (let i = 0; i < sprites.count; i++) {
                    const sprite = renderSprites[i];
                    sprite.x = sprites.x[i];
                    sprite.y = sprites.y[i];
                    sprite.rotation = sprites.rotation[i];
                }
            }
            app.renderer.render(app.stage);
        });
    } finally {
        app.destroy(false, { children: true, texture: true, textureSource: true });
    }
}

async function createApplication(PIXI, canvas, width, height, background) {
    if (PIXI.Application.prototype.init) {
        const app = new PIXI.Application();
        await app.init({
            canvas,
            width,
            height,
            background,
            antialias: false,
            autoDensity: false,
            resolution: 1,
            autoStart: false,
        });
        app.ticker.stop();
        return app;
    }

    const app = new PIXI.Application({
        view: canvas,
        width,
        height,
        backgroundColor: Number.parseInt(background.slice(1), 16),
        antialias: false,
        resolution: 1,
        autoStart: false,
    });
    app.ticker.stop();
    return app;
}
