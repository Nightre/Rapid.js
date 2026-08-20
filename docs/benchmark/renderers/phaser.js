const PHASER_URL = "https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js";

let phaserGlobal = null;

export const phaserRenderer = {
    id: "phaser",
    name: "Phaser",
    singleName: "Phaser (SpriteGPULayer)",
    color: "#ffb703",
    run: runPhaser,
    snippets: {
        multi: `textureImages.forEach((image, index) => {
    this.textures.addImage(\`bench-sprite-\${index}\`, image);
});

for (let i = 0; i < sprites.count; i++) {
    const item = this.add.image(
        sprites.x[i],
        sprites.y[i],
        \`bench-sprite-\${sprites.textureIndex[i]}\`,
    );
    item.setOrigin(0);
    item.rotation = sprites.rotation[i];
    item.setTint?.(sprites.tint[i]);
}

update(_time, deltaMs) {
    updateSprites(sprites, Math.min(deltaMs / 1000, 0.05));
    const items = this.children.list;
    for (let i = 0; i < sprites.count; i++) {
        items[i].x = sprites.x[i];
        items[i].y = sprites.y[i];
        items[i].rotation = sprites.rotation[i];
    }
}`,
        single: `this.textures.addImage("bench-sprite-single", textureImages[0]);

const gpuLayer = new Phaser.GameObjects.SpriteGPULayer(
    this,
    "bench-sprite-single",
    sprites.count,
);
this.add.existing(gpuLayer);

for (let i = 0; i < sprites.count; i++) {
    gpuLayer.addMember({
        x: sprites.x[i],
        y: sprites.y[i],
        originX: 0,
        originY: 0,
        rotation: sprites.rotation[i],
        scaleX: 1,
        scaleY: 1,
        tint: sprites.tint[i],
        alpha: 1,
    });
}

update(_time, deltaMs) {
    updateSprites(sprites, Math.min(deltaMs / 1000, 0.05));
    for (let i = 0; i < sprites.count; i++) {
        gpuLayer.editMember(i, {
            x: sprites.x[i],
            y: sprites.y[i],
            rotation: sprites.rotation[i],
            originX: 0.5,
            originY: 0.5,
            scaleX: 1,
            scaleY: 1,
            tintTopLeft: sprites.tint[i],
            tintTopRight: sprites.tint[i],
            tintBottomLeft: sprites.tint[i],
            tintBottomRight: sprites.tint[i],
            alpha: 1
        });
    }
}`,
    },
};

async function runPhaser(context, canvas, sprites) {
    const Phaser = await loadPhaser();

    let ready;
    const readyPromise = new Promise((resolve) => {
        ready = resolve;
    });

    const game = new Phaser.Game({
        type: Phaser.WEBGL,
        canvas,
        width: context.width,
        height: context.height,
        backgroundColor: "#f7fdff",
        transparent: false,
        banner: false,
        fps: { target: 240, forceSetTimeOut: false },
        scene: {
            create() {
                if (!context.isMultiTextureMode() && Phaser.GameObjects?.SpriteGPULayer) {
                    this.textures.addImage("bench-sprite-single", context.textureImages[0]);

                    const gpuLayer = new Phaser.GameObjects.SpriteGPULayer(this, "bench-sprite-single", sprites.count);
                    this.add.existing(gpuLayer);

                    for (let i = 0; i < sprites.count; i++) {
                        gpuLayer.addMember({
                            x: sprites.x[i],
                            y: sprites.y[i],
                            originX: 0,
                            originY: 0,
                            rotation: sprites.rotation[i],
                            scaleX: 1,
                            scaleY: 1,
                            tint: sprites.tint[i],
                            alpha: 1,
                        });
                    }

                    this.gpuLayer = gpuLayer;
                } else if (!context.isMultiTextureMode()) {
                    this.textures.addImage("bench-sprite-single", context.textureImages[0]);
                    for (let i = 0; i < sprites.count; i++) {
                        const item = this.add.image(sprites.x[i], sprites.y[i], "bench-sprite-single");
                        item.setOrigin(0);
                        item.rotation = sprites.rotation[i];
                        item.setTint?.(sprites.tint[i]);
                    }
                } else {
                    context.textureImages.forEach((image, index) => {
                        this.textures.addImage(`bench-sprite-${index}`, image);
                    });
                    for (let i = 0; i < sprites.count; i++) {
                        const item = this.add.image(sprites.x[i], sprites.y[i], `bench-sprite-${sprites.textureIndex[i]}`);
                        item.setOrigin(0);
                        item.rotation = sprites.rotation[i];
                        item.setTint?.(sprites.tint[i]);
                    }
                }
                ready();
            },
            update(_time, deltaMs) {
                context.updateSprites(sprites, Math.min(deltaMs / 1000, 0.05));

                const children = this.children.list;
                const gpuLayer = this.gpuLayer;

                if (gpuLayer) {
                    for (let i = 0; i < sprites.count; i++) {
                        gpuLayer.editMember(i, {
                            x: sprites.x[i],
                            y: sprites.y[i],
                            rotation: sprites.rotation[i],
                            originX: 0,
                            originY: 0,
                            scaleX: 1,
                            scaleY: 1,
                            tintTopLeft: sprites.tint[i],
                            tintTopRight: sprites.tint[i],
                            tintBottomLeft: sprites.tint[i],
                            tintBottomRight: sprites.tint[i],
                            alpha: 1
                        });
                    }
                } else {
                    const actualChildren = children[0]?.list || children;
                    for (let i = 0; i < sprites.count; i++) {
                        const item = actualChildren[i];
                        if (item) {
                            item.x = sprites.x[i];
                            item.y = sprites.y[i];
                            item.rotation = sprites.rotation[i];
                        }
                    }
                }
            },
        },
    });

    await readyPromise;
    const fps = await context.sampleExternalLoop();
    game.destroy(false);
    return fps;
}

async function loadPhaser() {
    if (phaserGlobal) return phaserGlobal;
    await loadScript(PHASER_URL);
    phaserGlobal = window.Phaser;
    return phaserGlobal;
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.append(script);
    });
}
