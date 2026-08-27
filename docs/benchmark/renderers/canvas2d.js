async function run(runtime) {
    const {
        canvas,
        width,
        height,
        background,
        textureImages,
        sampleLoop,
        updateSprites,
        createSprites,
    } = runtime;
    const createColor = (red, green, blue) => `rgb(${red} ${green} ${blue})`;
    const sprites = createSprites(createColor);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    return sampleLoop((delta) => {
        updateSprites(sprites, delta);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < sprites.count; i++) {
            const image = textureImages[sprites.textureIndex[i]];
            const cos = Math.cos(sprites.rotation[i]);
            const sin = Math.sin(sprites.rotation[i]);
            ctx.save();
            ctx.setTransform(cos, sin, -sin, cos, sprites.x[i], sprites.y[i]);
            ctx.drawImage(image, -image.width * 0.5, -image.height * 0.5);
            ctx.restore();
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
}
