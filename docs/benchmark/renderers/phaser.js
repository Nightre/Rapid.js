async function run(runtime) {
    const {
        canvas,
        mode,
        width,
        height,
        background,
        textureImages,
        sampleExternalLoop,
        updateSprites,
        loadGlobalScript,
        createSprites,
    } = runtime;
    const Phaser = await loadGlobalScript(
        "https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js",
        "Phaser",
    );
    const createColor = (red, green, blue) => (
        new Phaser.Display.Color(red, green, blue)
    );
    const sprites = createSprites(createColor);

    let ready;
    const readyPromise = new Promise((resolve) => {
        ready = resolve;
    });
    const game = new Phaser.Game({
        type: Phaser.WEBGL,
        canvas,
        width,
        height,
        backgroundColor: background,
        transparent: false,
        banner: false,
        fps: { target: 240, forceSetTimeOut: false },
        scene: {
            create() {
                if (mode === "single") {
                    if (!Phaser.GameObjects?.SpriteGPULayer) {
                        throw new Error("This Phaser build does not provide SpriteGPULayer.");
                    }

                    this.textures.addImage("bench-sprite-single", textureImages[0]);
                    const layer = new Phaser.GameObjects.SpriteGPULayer(
                        this,
                        "bench-sprite-single",
                        sprites.count,
                    );
                    this.add.existing(layer);

                    for (let i = 0; i < sprites.count; i++) {
                        layer.addMember({
                            x: sprites.x[i],
                            y: sprites.y[i],
                            originX: 0.5,
                            originY: 0.5,
                            rotation: sprites.rotation[i],
                            scaleX: 1,
                            scaleY: 1,
                            tint: sprites.color[i].color,
                            alpha: 1,
                        });
                    }
                    this.benchmarkLayer = layer;
                } else {
                    textureImages.forEach((image, index) => {
                        this.textures.addImage(`bench-sprite-${index}`, image);
                    });
                    for (let i = 0; i < sprites.count; i++) {
                        const sprite = this.add.image(
                            sprites.x[i],
                            sprites.y[i],
                            `bench-sprite-${sprites.textureIndex[i]}`,
                        );
                        sprite.setOrigin(0.5);
                        sprite.rotation = sprites.rotation[i];
                        sprite.setTint?.(sprites.color[i].color);
                    }
                }
                ready();
            },
            update(_time, deltaMs) {
                updateSprites(sprites, Math.min(deltaMs / 1000, 0.05));

                if (this.benchmarkLayer) {
                    for (let i = 0; i < sprites.count; i++) {
                        this.benchmarkLayer.editMember(i, {
                            x: sprites.x[i],
                            y: sprites.y[i],
                            originX: 0.5,
                            originY: 0.5,
                            rotation: sprites.rotation[i],
                            scaleX: 1,
                            scaleY: 1,
                            tintTopLeft: sprites.color[i].color,
                            tintTopRight: sprites.color[i].color,
                            tintBottomLeft: sprites.color[i].color,
                            tintBottomRight: sprites.color[i].color,
                            alpha: 1,
                        });
                    }
                    return;
                }

                for (let i = 0; i < sprites.count; i++) {
                    const sprite = this.children.list[i];
                    sprite.x = sprites.x[i];
                    sprite.y = sprites.y[i];
                    sprite.rotation = sprites.rotation[i];
                }
            },
        },
    });

    try {
        await readyPromise;
        return await sampleExternalLoop((frameCompleted) => {
            game.events.on("postrender", frameCompleted);
            return () => game.events.off("postrender", frameCompleted);
        });
    } finally {
        game.destroy(false);
    }
}
