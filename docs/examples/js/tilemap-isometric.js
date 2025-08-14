import { Color, Rapid, TileSet, Vec2, TilemapShape } from "/Rapid.js/dist/rapid.js";


const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("87CEEB")
});

const generateTileMap = (rows, cols) =>
    Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () =>
            Math.floor(Math.random() * 3)
        )
    );

const tileMap = generateTileMap(100, 100);
const tileMap2 = Array.from({ length: 100 }, () =>
    Array.from({ length: 100 }, () => {
        if (Math.random() > 0.9) {
            return 4
        } else {
            return -1
        }
    })
);

const map = new Vec2(-250, -250)

const tileTexture = await rapid.texture.textureFromUrl("./assets/iso.png");
const ghost = await rapid.texture.textureFromUrl("./assets/ghost-iso.png");
const catTexture = await rapid.texture.textureFromUrl("./assets/cat.png");

const tileSet = new TileSet(64, 32)
const textures = tileTexture.createSpritesheet(64, 32);
const building = tileTexture.clone().setClipRegion(64, 32, 64, 96)

tileSet.setTile(0, textures[0])
tileSet.setTile(1, textures[1])
tileSet.setTile(2, textures[2])
tileSet.setTile(3, textures[4])

tileSet.setTile(4, {
    texture: building,
    offsetY: 32,
    origin: new Vec2(0, 1),
    ySortOffset: 16
})

let time = 0

let ghostPos = new Vec2(0, 0)

let scale = 1

let click = false
let mouse = new Vec2()


function animate() {
    time += 0.01

    rapid.startRender();


    rapid.withTransform(() => {
        rapid.matrixStack.scale(scale)
        rapid.matrixStack.translate(map)

        const local = rapid.matrixStack.globalToLocal(mouse)

        const options = {
            tileSet,
            shape: TilemapShape.ISOMETRIC,
        }
        const options2 = {
            tileSet,
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
            shape: TilemapShape.ISOMETRIC,

            errorY: 5
        }

        if (click) {
            const tile = rapid.tileMap.localToMap(local, options)
            tileMap[tile.y][tile.x] = 3
            click = false
            ghostPos = rapid.tileMap.mapToLocal(tile, options)
        }

        rapid.renderTileMapLayer(tileMap, options);
        rapid.renderTileMapLayer(tileMap2, options2);
    })

    rapid.endRender();

    requestAnimationFrame(animate);
}

animate()

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