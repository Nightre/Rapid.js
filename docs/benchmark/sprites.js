export function createSprites(count, options) {
    const {
        width,
        height,
        spriteSize,
        textureCount,
        multiTexture,
        createColor,
    } = options;
    const random = createRandom(0x2f6e2b1 + count);
    const halfSize = spriteSize * 0.5;
    const travelWidth = Math.max(0, width - spriteSize);
    const travelHeight = Math.max(0, height - spriteSize);

    const sprites = {
        count,
        x: new Float32Array(count),
        y: new Float32Array(count),
        vx: new Float32Array(count),
        vy: new Float32Array(count),
        rotation: new Float32Array(count),
        spin: new Float32Array(count),
        color: new Array(count),
        textureIndex: new Uint8Array(count),
    };

    for (let i = 0; i < count; i++) {
        sprites.x[i] = halfSize + random() * travelWidth;
        sprites.y[i] = halfSize + random() * travelHeight;

        const angle = random() * Math.PI * 2;
        const speed = 55 + random() * 115;
        sprites.vx[i] = Math.cos(angle) * speed;
        sprites.vy[i] = Math.sin(angle) * speed;
        sprites.rotation[i] = random() * Math.PI * 2;
        sprites.spin[i] = (random() < 0.5 ? -1 : 1) * (0.8 + random() * 3.2);

        const red = 120 + Math.floor(random() * 136);
        const green = 120 + Math.floor(random() * 136);
        const blue = 120 + Math.floor(random() * 136);
        sprites.color[i] = createColor(red, green, blue);
        sprites.textureIndex[i] = multiTexture
            ? Math.floor(random() * textureCount)
            : 0;
    }

    return sprites;
}

export function updateSprites(sprites, delta, { width, height, spriteSize }) {
    const minX = spriteSize * 0.5;
    const minY = spriteSize * 0.5;
    const maxX = width - minX;
    const maxY = height - minY;

    for (let i = 0; i < sprites.count; i++) {
        let x = sprites.x[i] + sprites.vx[i] * delta;
        let y = sprites.y[i] + sprites.vy[i] * delta;

        if (x <= minX) {
            x = minX;
            sprites.vx[i] = Math.abs(sprites.vx[i]);
        } else if (x >= maxX) {
            x = maxX;
            sprites.vx[i] = -Math.abs(sprites.vx[i]);
        }

        if (y <= minY) {
            y = minY;
            sprites.vy[i] = Math.abs(sprites.vy[i]);
        } else if (y >= maxY) {
            y = maxY;
            sprites.vy[i] = -Math.abs(sprites.vy[i]);
        }

        sprites.x[i] = x;
        sprites.y[i] = y;
        sprites.rotation[i] += sprites.spin[i] * delta;
    }
}

export function updatePixiParticles(
    sprites,
    renderSprites,
    delta,
    { width, height, spriteSize },
) {
    const minX = spriteSize * 0.5;
    const minY = spriteSize * 0.5;
    const maxX = width - minX;
    const maxY = height - minY;

    for (let i = 0; i < sprites.count; i++) {
        const particle = renderSprites[i];
        let x = particle.x + sprites.vx[i] * delta;
        let y = particle.y + sprites.vy[i] * delta;

        if (x <= minX) {
            x = minX;
            sprites.vx[i] = Math.abs(sprites.vx[i]);
        } else if (x >= maxX) {
            x = maxX;
            sprites.vx[i] = -Math.abs(sprites.vx[i]);
        }

        if (y <= minY) {
            y = minY;
            sprites.vy[i] = Math.abs(sprites.vy[i]);
        } else if (y >= maxY) {
            y = maxY;
            sprites.vy[i] = -Math.abs(sprites.vy[i]);
        }

        particle.x = x;
        particle.y = y;
        particle.rotation += sprites.spin[i] * delta;
    }
}

export function updatePhaserParticles(
    sprites,
    layer,
    member,
    delta,
    { width, height, spriteSize },
) {
    const minX = spriteSize * 0.5;
    const minY = spriteSize * 0.5;
    const maxX = width - minX;
    const maxY = height - minY;

    for (let i = 0; i < sprites.count; i++) {
        let x = sprites.x[i] + sprites.vx[i] * delta;
        let y = sprites.y[i] + sprites.vy[i] * delta;

        if (x <= minX) {
            x = minX;
            sprites.vx[i] = Math.abs(sprites.vx[i]);
        } else if (x >= maxX) {
            x = maxX;
            sprites.vx[i] = -Math.abs(sprites.vx[i]);
        }

        if (y <= minY) {
            y = minY;
            sprites.vy[i] = Math.abs(sprites.vy[i]);
        } else if (y >= maxY) {
            y = maxY;
            sprites.vy[i] = -Math.abs(sprites.vy[i]);
        }

        const rotation = sprites.rotation[i] + sprites.spin[i] * delta;
        const tint = sprites.color[i].color;
        sprites.x[i] = x;
        sprites.y[i] = y;
        sprites.rotation[i] = rotation;
        member.x = x;
        member.y = y;
        member.rotation = rotation;
        member.tintTopLeft = tint;
        member.tintTopRight = tint;
        member.tintBottomLeft = tint;
        member.tintBottomRight = tint;
        layer.editMember(i, member);
    }
}

function createRandom(initialSeed) {
    let seed = initialSeed;
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
    };
}
