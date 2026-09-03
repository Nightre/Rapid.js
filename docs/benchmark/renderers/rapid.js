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
    const createColor = (red, green, blue) => new Color(red, green, blue, 255);
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
    let particleOptions;
    let drawOptions;

    if (mode === "single") {
        particleOptions = {
            texture: textures[0],
            x: sprites.x,
            y: sprites.y,
            rotation: sprites.rotation,
            color: sprites.color,

            originX: 0.5,
            originY: 0.5,
        };
    } else {
        drawOptions = {
            texture: textures[0],
            x: 0,
            y: 0,
            rotation: 0,
            origin: 0.5,
            color: null,
        };
    }

    try {
        return await sampleLoop((delta) => {
            updateSprites(sprites, delta); // defined in sprites.js
            rapid.clear();
            if (mode === "single") {
                rapid.drawParticles(particleOptions);
            } else {
                for (let i = 0; i < sprites.count; i++) {
                    drawOptions.texture = textures[sprites.textureIndex[i]];
                    drawOptions.x = sprites.x[i];
                    drawOptions.y = sprites.y[i];
                    drawOptions.rotation = sprites.rotation[i];
                    drawOptions.color = sprites.color[i];
                    rapid.drawSprite(drawOptions);
                }
            }
            rapid.flush();
        });
    } finally {
        for (const texture of textures) rapid.texture.destroy(texture, true);
    }
}
