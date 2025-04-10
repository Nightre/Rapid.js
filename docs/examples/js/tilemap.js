import { Color, Rapid, TileSet, Vec2, MathUtils } from "/Rapid.js/dist/rapid.js";

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("87CEEB")
});

const generateTileMap = (rows, cols) =>
    Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () =>
            Math.floor(Math.random() * 4)
        )
    );

const tileMap = generateTileMap(100, 100);
const tileMap2 = Array.from({ length: 100 }, () =>
    Array.from({ length: 100 }, () => {
        if (Math.random() > 0.9) {
            return 4
        } else if (Math.random() > 0.9) {
            return 5
        } else {
            return -1
        }
    })
);

const map = new Vec2(-250, -250)
const grassTexture = await rapid.textures.textureFromUrl("./assets/grass-tile.png");
const treeTexture = await rapid.textures.textureFromUrl("./assets/tree.png");
const buildingTexture = await rapid.textures.textureFromUrl("./assets/building.png");
const catTexture = await rapid.textures.textureFromUrl("./assets/cat.png");
const ghost = await rapid.textures.textureFromUrl("./assets/ghost-squre.png");

const tileSet = new TileSet(32, 32)

const textures = (await rapid.textures.textureFromUrl("./assets/water-tile.png")).createSpritesHeet(32, 32);

tileSet.setTile(0, grassTexture)
tileSet.setTile(1, textures[0])
tileSet.setTile(2, textures[2])
tileSet.setTile(3, textures[3])

tileSet.setTile(4, {
    texture: treeTexture,
    origin: new Vec2(0.5, 1),
    ySortOffset: 16,
    x: -16,
    y: 16,
})

tileSet.setTile(5, {
    texture: buildingTexture,
    offsetY: 32,
    origin: new Vec2(0, 1),
    ySortOffset: 32
})


let time = 0
let ghostPos = new Vec2(0, 0)

let click = false
let mouse = new Vec2()

let scale = 1

function animate() {
    time += 0.01
    tileSet.setTile(1, time % 1 > 0.5 ? textures[0] : textures[1])
    rapid.startRender();
    //rapid.save()

    rapid.withTransform(() => {
        rapid.matrixStack.scale(scale)
        rapid.matrixStack.translate(map)

        const local = rapid.matrixStack.globalToLocal(mouse)
        const options = {
            ySortCallback: [
                {
                    ySort: local.y,
                    render: () => {
                        rapid.renderSprite({
                            texture: catTexture,
                            offsetX: local.x,
                            offsetY: local.y,
                            origin: new Vec2(0.5, 1),
                        })
                    }
                },
                {
                    ySort: ghostPos.y,
                    render: () => {
                        rapid.renderSprite({
                            texture: ghost,
                            offsetX: ghostPos.x,
                            offsetY: ghostPos.y,
                        })
                    }
                }
            ],
            tileSet: tileSet,
            error: 6,
            eachTile: (tileId, mapX, mapY) => {
                if (tileId == 4) {
                    return {
                        rotation: MathUtils.deg2rad((mapX % 2 == 0 ? 1 : -1) * Math.sin(time * 5) * 16 - 8),
                    }
                }
            }
        }
        if (click) {
            const tile = rapid.tileMap.localToMap(local, options)

            tileMap[tile.y][tile.x] = 2
            click = false

            ghostPos = rapid.tileMap.mapToLocal(tile, options)
        }

        rapid.renderTileMapLayer(tileMap, tileSet);
        rapid.renderTileMapLayer(tileMap2, options);
    })
    //rapid.restore()
    rapid.endRender();

    requestAnimationFrame(animate);
}

animate();

rapid.canvas.addEventListener("click", (ev) => {
    const rect = rapid.canvas.getBoundingClientRect()
    mouse.x = ev.clientX - rect.left
    mouse.y = ev.clientY - rect.top
    click = true
})

rapid.canvas.addEventListener("mousemove", (ev) => {
    const rect = rapid.canvas.getBoundingClientRect()
    mouse.x = ev.clientX - rect.left
    mouse.y = ev.clientY - rect.top
})

document.getElementById("x").addEventListener("input", (ev) => {
    map.x = -Number(ev.target.value)
})

document.getElementById("y").addEventListener("input", (ev) => {
    map.y = -Number(ev.target.value)
})

document.getElementById("scale").addEventListener("input", (ev) => {
    scale = Number(ev.target.value)
})