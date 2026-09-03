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
        libraries,
        createSprites,
    } = runtime;
    const { CanvasScaleMode, Color, Rapid, TextureFilterMode } = libraries;

    const createColor = (red, green, blue) => {
        const color = new Color(red, green, blue, 255);
        return mode === "single" ? color.uint32 : color;
    };
    
    const sprites = createSprites(createColor);
    const rapid = new Rapid({
        canvas,
        logicWidth: width,
        logicHeight: height,
        physicsWidth: width,
        physicsHeight: height,
        backgroundColor: Color.fromHex(background),
        antialias: false,
        roundPixels: false,
        scaleMode: CanvasScaleMode.Viewport,
        textureFilter: TextureFilterMode.NEAREST,
    });
    const textures = textureImages.map((image) => rapid.texture.create(image));

    try {
        if (mode === "single") {
            const particleOptions = {
                texture: textures[0],
                x: sprites.x,
                y: sprites.y,
                rotation: sprites.rotation,
                color: sprites.color,
                count: sprites.count,
                originX: 0.5,
                originY: 0.5,
            };

            return await sampleLoop((delta) => {
                updateSprites(sprites, delta);
                rapid.clear();
                rapid.drawParticles(particleOptions);
                rapid.flush();
            });
        }

        const drawOptions = {
            texture: textures[0],
            x: 0,
            y: 0,
            rotation: 0,
            origin: 0.5,
            color: null,
        };

        return await sampleLoop((delta) => {
            updateSprites(sprites, delta);
            rapid.clear();
            for (let i = 0; i < sprites.count; i++) {
                drawOptions.texture = textures[sprites.textureIndex[i]];
                drawOptions.x = sprites.x[i];
                drawOptions.y = sprites.y[i];
                drawOptions.rotation = sprites.rotation[i];
                drawOptions.color = sprites.color[i];
                rapid.drawSprite(drawOptions);
            }
            rapid.flush();
        });
    } finally {
        for (const texture of textures) rapid.texture.destroy(texture, true);
    }
}
