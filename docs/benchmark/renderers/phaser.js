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
        updatePhaserParticles,
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

    let resolveReady;
    let rejectReady;
    const readyPromise = new Promise((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
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
                try {
                    populateScene(this, Phaser, mode, textureImages, sprites);
                    resolveReady();
                } catch (error) {
                    rejectReady(error);
                }
            },
            update(_time, deltaMs) {
                const delta = Math.min(deltaMs / 1000, 0.05);

                if (this.benchmarkLayer) {
                    updatePhaserParticles(
                        sprites,
                        this.benchmarkLayer,
                        this.benchmarkMemberUpdate,
                        delta,
                    ); // defined in sprites.js
                } else {
                    updateSprites(sprites, delta); // defined in sprites.js
                    for (let i = 0; i < sprites.count; i++) {
                        const sprite = this.children.list[i];
                        sprite.x = sprites.x[i];
                        sprite.y = sprites.y[i];
                        sprite.rotation = sprites.rotation[i];
                    }
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

function populateScene(scene, Phaser, mode, textureImages, sprites) {
    if (mode === "single") {
        if (!Phaser.GameObjects?.SpriteGPULayer) {
            throw new Error("This Phaser build does not provide SpriteGPULayer.");
        }

        scene.textures.addImage("bench-sprite-single", textureImages[0]);
        scene.textures
            .get("bench-sprite-single")
        const layer = new Phaser.GameObjects.SpriteGPULayer(
            scene,
            "bench-sprite-single",
            sprites.count,
        );
        scene.add.existing(layer);

        const member = createGpuMember({ tint: 0xffffff });
        for (let i = 0; i < sprites.count; i++) {
            member.x = sprites.x[i];
            member.y = sprites.y[i];
            member.rotation = sprites.rotation[i];
            member.tint = sprites.color[i].color;
            layer.addMember(member);
        }
        scene.benchmarkLayer = layer;
        scene.benchmarkMemberUpdate = createGpuMember({
            tintTopLeft: 0xffffff,
            tintTopRight: 0xffffff,
            tintBottomLeft: 0xffffff,
            tintBottomRight: 0xffffff,
        });
        return;
    }

    textureImages.forEach((image, index) => {
        const key = `bench-sprite-${index}`;
        scene.textures.addImage(key, image);
        scene.textures
            .get(key)
    });
    for (let i = 0; i < sprites.count; i++) {
        const sprite = scene.add.image(
            sprites.x[i],
            sprites.y[i],
            `bench-sprite-${sprites.textureIndex[i]}`,
        );
        sprite.setOrigin(0.5);
        sprite.rotation = sprites.rotation[i];
        sprite.setTint?.(sprites.color[i].color);
    }
}

function createGpuMember(properties) {
    return {
        x: 0,
        y: 0,
        originX: 0.5,
        originY: 0.5,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        ...properties,
    };
}
