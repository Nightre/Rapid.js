const NOISE_CDN = "https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm";
const TILE_SEAM_EPSILON = 0.0025; 

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { canvas, loop }) {
    const [{ createNoise2D }, tileset] = await Promise.all([
        import(/* @vite-ignore */ NOISE_CDN),
        rapid.texture.load("./image/tileset.png"),
    ]);
    const noise2D = createNoise2D();

    const TILE_SIZE = 32;
    const WORLD_TILES = 1_000_0;
    const HALF_WORLD = WORLD_TILES / 2;
    const WORLD_MIN = -HALF_WORLD * TILE_SIZE;
    const WORLD_MAX = HALF_WORLD * TILE_SIZE;
    const WATER_LINE = 8;

    // Pixel-space rectangles: 0 grass, 1 dirt, 2 brick, 3 water.
    // 1 gap
    const tileUV = [
        [0, 0, 32, 32],
        [32 + 1, 0, 64 + 1, 32],
        [0, 32 + 1, 32, 64 + 1],
        [32 + 1, 32 + 1, 64 + 1, 64 + 1],
    ];

    const surfaceAt = (column) => Math.floor(
        noise2D(column * 0.004, 4.2) * 36 +
        noise2D(column * 0.017, 19.7) * 10,
    );

    const tileAt = (column, row, surface) => {
        if (row === surface) return 0;
        if (row > surface) {
            const stone = row - surface > 4 && noise2D(column * 0.11, row * 0.11) > 0.38;
            return stone ? 2 : 1;
        }
        if (row >= WATER_LINE) return 3;
        return -1;
    };

    let capacity = 0;
    let count = 0;
    let x;
    let y;
    let u0;
    let v0;
    let u1;
    let v1;

    // Typed arrays only grow. Zooming or dragging reuses the existing buffers.
    const ensureCapacity = (required) => {
        if (required <= capacity) return;
        capacity = 2 ** Math.ceil(Math.log2(required));
        x = new Float32Array(capacity);
        y = new Float32Array(capacity);
        u0 = new Float32Array(capacity);
        v0 = new Float32Array(capacity);
        u1 = new Float32Array(capacity);
        v1 = new Float32Array(capacity);
    };

    const camera = {
        x: -rapid.width / (2 * 0.35),
        y: 0,
        zoom: 1,
    };

    const clampCamera = () => {
        camera.x = Math.max(WORLD_MIN, Math.min(
            camera.x,
            WORLD_MAX - rapid.width / camera.zoom,
        ));
        camera.y = Math.max(WORLD_MIN, Math.min(
            camera.y,
            WORLD_MAX - rapid.height / camera.zoom,
        ));
    };

    const rebuildVisibleTiles = () => {
        const firstColumn = Math.max(-HALF_WORLD, Math.floor(camera.x / TILE_SIZE) - 1);
        const lastColumn = Math.min(
            HALF_WORLD - 1,
            Math.ceil((camera.x + rapid.width / camera.zoom) / TILE_SIZE) + 1,
        );
        const firstRow = Math.max(-HALF_WORLD, Math.floor(camera.y / TILE_SIZE) - 1);
        const lastRow = Math.min(
            HALF_WORLD - 1,
            Math.ceil((camera.y + rapid.height / camera.zoom) / TILE_SIZE) + 1,
        );

        ensureCapacity((lastColumn - firstColumn + 1) * (lastRow - firstRow + 1));
        count = 0;

        for (let column = firstColumn; column <= lastColumn; column++) {
            const surface = surfaceAt(column);
            for (let row = firstRow; row <= lastRow; row++) {
                const tile = tileAt(column, row, surface);
                if (tile === -1) continue;

                const uv = tileUV[tile];
                x[count] = column * TILE_SIZE + TILE_SIZE / 2;
                y[count] = row * TILE_SIZE + TILE_SIZE / 2;
                u0[count] = uv[0] / tileset.width;
                v0[count] = uv[1] / tileset.height;
                u1[count] = uv[2] / tileset.width;
                v1[count] = uv[3] / tileset.height;
                count++;
            }
        }
    };

    let dragging = false;
    let pointerId = -1;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let viewDirty = true;

    const onPointerDown = (event) => {
        dragging = true;
        pointerId = event.pointerId;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        canvas.style.cursor = "grabbing";
        canvas.setPointerCapture(pointerId);
    };

    const onPointerMove = (event) => {
        if (!dragging || event.pointerId !== pointerId) return;
        camera.x -= (event.clientX - lastPointerX) / camera.zoom;
        camera.y -= (event.clientY - lastPointerY) / camera.zoom;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        clampCamera();
        viewDirty = true;
    };

    const onPointerUp = (event) => {
        if (event.pointerId !== pointerId) return;
        dragging = false;
        canvas.style.cursor = "grab";
        if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
        pointerId = -1;
    };

    const onWheel = (event) => {
        event.preventDefault();
        const bounds = canvas.getBoundingClientRect();
        const pointerX = (event.clientX - bounds.left) * rapid.width / bounds.width;
        const pointerY = (event.clientY - bounds.top) * rapid.height / bounds.height;
        const worldX = camera.x + pointerX / camera.zoom;
        const worldY = camera.y + pointerY / camera.zoom;

        camera.zoom = Math.max(0.03, Math.min(1.6,
            camera.zoom * Math.exp(-event.deltaY * 0.001),
        ));
        camera.x = Math.round(worldX - pointerX / camera.zoom);
        camera.y = Math.round(worldY - pointerY / camera.zoom);
        clampCamera();
        viewDirty = true;
    };

    const oldCursor = canvas.style.cursor;
    const oldTouchAction = canvas.style.touchAction;
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const label = rapid.texture.createTextTexture({
        text: "",
        fontSize: 12,
        fontWeight: "bold",
        fill: "#315368",
        align: "center",
    });

    loop(() => {
        if (!viewDirty) return;
        rebuildVisibleTiles();
        label.text = `${count.toLocaleString()} visible tiles (drag to move, scroll to zoom)`;

        rapid.clear();
        rapid.matrixStack.save();
        rapid.applyCamera({
            x: camera.x,
            y: camera.y,
            scale: 1 / camera.zoom,
        });
        rapid.drawParticles({
            texture: tileset,
            x,
            y,
            scaleX: 1 + TILE_SEAM_EPSILON,
            scaleY: 1 + TILE_SEAM_EPSILON,
            u0,
            v0,
            u1,
            v1,
            count,
            originX: 0.5,
            originY: 0.5,
        });
        rapid.matrixStack.restore();

        rapid.drawSprite({ texture: label, x: rapid.width / 2, y: 17, origin: 0.5 });
        rapid.drawSprite({ texture: tileset, x: 5, y: 5 });

        rapid.flush();
        viewDirty = false;
    });

    return () => {
        if (pointerId !== -1 && canvas.hasPointerCapture(pointerId)) {
            canvas.releasePointerCapture(pointerId);
        }
        canvas.style.cursor = oldCursor;
        canvas.style.touchAction = oldTouchAction;
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("wheel", onWheel);
    };
}