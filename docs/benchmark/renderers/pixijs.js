export const pixiRenderer = {
    id: "pixijs",
    name: "PixiJS",
    singleName: "PixiJS (ParticleContainer)",
    color: "#00c49f",
    run: runPixi,
    snippets: {
        multi: `const container = new PIXI.Container();
app.stage.addChild(container);

for (let i = 0; i < sprites.count; i++) {
    const item = new PIXI.Sprite(textures[sprites.textureIndex[i]]);
    item.anchor.set(0.5);
    item.position.set(sprites.x[i], sprites.y[i]);
    item.rotation = sprites.rotation[i];
    item.tint = sprites.tint[i];
    container.addChild(item);
}

sampleLoop((delta) => {
    updateSprites(sprites, delta);
    for (let i = 0; i < sprites.count; i++) {
        container.children[i].position.set(sprites.x[i], sprites.y[i]);
        container.children[i].rotation = sprites.rotation[i];
    }
    app.renderer.render(app.stage);
});`,
        single: `const container = new PIXI.ParticleContainer({
    dynamicProperties: {
        position: true,
        rotation: true,
        scale: false,
        alpha: false,
        tint: true,
    },
});
app.stage.addChild(container);

const pixiSprites = [];
for (let i = 0; i < sprites.count; i++) {
    const particle = new PIXI.Particle({
        texture: textures[0],
        anchor: 0.5,
        x: sprites.x[i],
        y: sprites.y[i],
        rotation: sprites.rotation[i],
        tint: sprites.tint[i],
    });
    container.addParticle(particle);
    pixiSprites.push(particle);
}

sampleLoop((delta) => {
    updateSprites(sprites, delta);
    for (let i = 0; i < sprites.count; i++) {
        pixiSprites[i].x = sprites.x[i];
        pixiSprites[i].y = sprites.y[i];
        pixiSprites[i].rotation = sprites.rotation[i];
    }
    app.renderer.render(app.stage);
});`,
    },
};

async function runPixi(context, canvas, sprites) {
    const app = await createPixiApp(context, canvas);
    const PIXI = window.PIXI;
    const textures = context.textureImages.map((image) => PIXI.Texture.from(image));

    let container;
    let pixiSprites;

    if (!context.isMultiTextureMode() && PIXI.ParticleContainer) {
        container = new PIXI.ParticleContainer({
            dynamicProperties: {
                position: true,
                rotation: true,
                scale: false,
                alpha: false,
                tint: true,
            },
        });
        app.stage.addChild(container);

        pixiSprites = [];
        for (let i = 0; i < sprites.count; i++) {
            const particle = new PIXI.Particle({
                texture: textures[0],
                anchor: 0.5,
                x: sprites.x[i],
                y: sprites.y[i],
                rotation: sprites.rotation[i],
                tint: sprites.tint[i],
            });
            container.addParticle(particle);
            pixiSprites.push(particle);
        }
    } else {
        container = new PIXI.Container();
        app.stage.addChild(container);

        for (let i = 0; i < sprites.count; i++) {
            const item = new PIXI.Sprite(textures[sprites.textureIndex[i]]);
            item.anchor.set(0.5);
            item.position.set(sprites.x[i], sprites.y[i]);
            item.rotation = sprites.rotation[i];
            item.tint = sprites.tint[i];
            container.addChild(item);
        }
        pixiSprites = container.children;
    }

    const fps = await context.sampleLoop((delta) => {
        context.updateSprites(sprites, delta);
        for (let i = 0; i < sprites.count; i++) {
            const item = pixiSprites[i];
            item.x = sprites.x[i];
            item.y = sprites.y[i];
            item.rotation = sprites.rotation[i];
        }
        app.renderer.render(app.stage);
    });

    app.destroy(false, { children: true, texture: true, textureSource: true, baseTexture: true });
    return fps;
}

async function createPixiApp(context, canvas) {
    const PIXI = window.PIXI;
    if (!PIXI) throw new Error("PixiJS did not load.");

    if (PIXI.Application.prototype.init) {
        const app = new PIXI.Application();
        await app.init({
            canvas,
            width: context.width,
            height: context.height,
            background: "#f7fdff",
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
        width: context.width,
        height: context.height,
        backgroundColor: 0xf7fdff,
        antialias: false,
        resolution: 1,
        autoStart: false,
    });
    app.ticker.stop();
    return app;
}
