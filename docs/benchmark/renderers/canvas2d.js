export const canvasRenderer = {
    id: "canvas",
    name: "Canvas 2D",
    color: "#6c757d",
    run: runCanvas2D,
    snippets: {
        multi: `const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

sampleLoop((delta) => {
    updateSprites(sprites, delta);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

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
});`,
    },
};

async function runCanvas2D(context, canvas, sprites) {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    return context.sampleLoop((delta) => {
        context.updateSprites(sprites, delta);

        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(0, 0, context.width, context.height);

        for (let i = 0; i < sprites.count; i++) {
            const image = context.isMultiTextureMode()
                ? context.textureImages[sprites.textureIndex[i]]
                : context.textureImages[0];
            const w = image.width;
            const h = image.height;
            const cos = Math.cos(sprites.rotation[i]);
            const sin = Math.sin(sprites.rotation[i]);

            ctx.save();
            ctx.setTransform(cos, sin, -sin, cos, sprites.x[i], sprites.y[i]);
            ctx.drawImage(image, -w * 0.5, -h * 0.5, w, h);
            ctx.restore();
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
}
