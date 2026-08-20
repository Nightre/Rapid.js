import { CanvasScaleMode, Color, Rapid, TextureFilterMode } from "rapid-render";

export const rapidRenderer = {
    id: "rapid",
    name: "Rapid.js",
    singleName: "Rapid.js (DrawParticles)",
    color: "#ff0048",
    run: runRapid,
    snippets: {
        multi: `const textures = textureImages.map((image) => rapid.texture.create(image));
const drawOptions = { texture: textures[0], x: 0, y: 0, rotation: 0, color: null };

sampleLoop((delta) => {
    updateSprites(sprites, delta);
    rapid.clear();

    for (let i = 0; i < sprites.count; i++) {
        drawOptions.x = sprites.x[i];
        drawOptions.y = sprites.y[i];
        drawOptions.rotation = sprites.rotation[i];
        drawOptions.color = sprites.color[i];
        drawOptions.texture = textures[sprites.textureIndex[i]];
        rapid.drawSprite(drawOptions);
    }

    rapid.flush();
});`,
        single: `const rapidParticles = {
    x: new Float32Array(sprites.count),
    y: new Float32Array(sprites.count),
    rotation: new Float32Array(sprites.count),
    color: new Array(sprites.count),
};

const particleOptions = {
    texture: textures[0],
    x: rapidParticles.x,
    y: rapidParticles.y,
    rotation: rapidParticles.rotation,
    color: rapidParticles.color,
    count: sprites.count,
};

sampleLoop((delta) => {
    updateSprites(sprites, delta);

    for (let i = 0; i < sprites.count; i++) {
        rapidParticles.x[i] = sprites.x[i];
        rapidParticles.y[i] = sprites.y[i];
        rapidParticles.rotation[i] = sprites.rotation[i];
        rapidParticles.color[i] = sprites.color[i];
    }

    rapid.clear();
    rapid.drawParticles(particleOptions);
    rapid.flush();
});`,
    },
};

async function runRapid(context, canvas, sprites) {
    const rapid = new Rapid({
        canvas,
        logicWidth: context.width,
        logicHeight: context.height,
        physicsWidth: context.width,
        physicsHeight: context.height,
        backgroundColor: new Color(247, 253, 255),
        antialias: false,
        roundPixels: false,
        scaleMode: CanvasScaleMode.Viewport,
        textureFilter: TextureFilterMode.NEAREST,
    });
    const textures = context.textureImages.map((image) => rapid.texture.create(image));

    const drawOptions = { texture: textures[0], x: 0, y: 0, rotation: 0, origin: 0.5, color: null };

    const rapidParticles = {
        x: new Float32Array(sprites.count),
        y: new Float32Array(sprites.count),
        rotation: new Float32Array(sprites.count),
        color: new Array(sprites.count),
    };
    const particleOptions = {
        texture: textures[0],
        x: rapidParticles.x,
        y: rapidParticles.y,
        rotation: rapidParticles.rotation,
        color: rapidParticles.color,
        count: sprites.count,
    };

    const fps = await context.sampleLoop((delta) => {
        context.updateSprites(sprites, delta);
        rapid.clear();

        if (!context.isMultiTextureMode()) {
            for (let i = 0; i < sprites.count; i++) {
                rapidParticles.x[i] = sprites.x[i];
                rapidParticles.y[i] = sprites.y[i];
                rapidParticles.rotation[i] = sprites.rotation[i];
                rapidParticles.color[i] = sprites.color[i];
            }
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

    for (const texture of textures) {
        rapid.texture.destroy(texture, true);
    }
    return fps;
}
