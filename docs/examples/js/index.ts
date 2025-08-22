import { Camera, Color, Game, GameObject, ScaleRadio, Scene, Sprite, Vec2 } from "../../../src/index"
import { Tilemap, TileSet } from "../../../src/tilemap"

const game = new Game({
    canvas: document.getElementById("game") as HTMLCanvasElement,
    backgroundColor: Color.Blue(),
    scaleEnable: true,
    scaleRadio: ScaleRadio.EXPAND,
    width: 500,
    height: 500,
    antialias: true
})

const updateDisplaySize = () => {
    game.render.updateDisplaySize(
        document.documentElement.clientWidth,
        document.documentElement.clientHeight
    )
}

window.addEventListener('resize', updateDisplaySize)
updateDisplaySize()

//@ts-ignore
window.game = game

const texture = (await game.asset.loadImage("tiles", "./assets/tiles.png"))!
const tilemapSheet = texture.createSpritesheet(16, 16, 3, 1, 0, 1)
console.log(tilemapSheet)
const tileSet = new TileSet(16, 16)

tilemapSheet.forEach((texture, index) => {
    tileSet.setTile(index, texture)
})

class MainScene extends Scene {
    player: GameObject
    tilemap: GameObject

    public create(): void {
        this.tilemap = GameObject.create(game, {
            position: new Vec2(0, 0),
            components: [
                new Tilemap({
                    tileSet,
                })
            ]
        })

        this.tilemap.getComponent(Tilemap)?.setData([
            [1, 0, 2, 1, 2, 1, 0],
            [0, 1, 0, 1, 2, 1, 0],
            [2, 0, 1, 1, 2, 1, 0],
        ])


        this.player = GameObject.create(game, {
            position: new Vec2(0, 0),
            components: [
                new Sprite({
                    animations: {
                        "idle": {
                            frames: texture.createSpritesheet(16, 16, 2, 1),
                            fps: 4,
                            loop: true
                        },
                        "walk": {
                            frames: texture.createSpritesheet(16, 16, 4, 1, 2, 0),
                            fps: 8,
                            loop: true
                        }
                    },
                }),
            ],
        })
        this.player.getComponent(Sprite)?.play("idle")

        this.addChild(this.tilemap)
        this.addChild(this.player)

        const camera = GameObject.create(game, {
            scale: 0.6,
            components: [
                new Camera({
                    enable: true,
                }),
            ]
        })
        this.player.addChild(camera)

        this.player.camera = camera
        this.tilemap.camera = camera
    }
    onUpdate(deltaTime: number): void {
        const velocity = this.game.input.getVector("KeyA", "KeyD", "KeyW", "KeyS")
        const sprite = this.player.getComponent(Sprite)!

        this.player.position.addSelf(velocity.multiply(deltaTime * 50))
        if (velocity.length() > 0) {
            sprite.play("walk")
            if (Math.abs(velocity.x) > 0) {
                sprite.flipX = velocity.x < 0
            }
        } else {
            sprite.play("idle")
        }
    }
}

game.switchScene(new MainScene(game))