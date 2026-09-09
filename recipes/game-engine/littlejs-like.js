import { ObjectTree, SpriteNode } from "../game-object.js"

/** Minimal usage. */
export function demo(rapid, texture) {
    const game = new LittleJSLike(rapid)
    const ship = game.add(new EngineObject({ x: 100, y: 50 }, texture))
    ship.addChild(new EngineObject({ x: 20, y: 0 }, texture))
    game.frame(1 / 60)
    return ship
}

export class EngineObject extends SpriteNode {
    constructor(pos, texture) {
        super(texture)
        this.position = pos
    }
    addChild(child) {
        return this.add(child)
    }
    update(_dt) { }
}

/** Minimal LittleJS-style EngineObject facade. */
export class LittleJSLike {
    objects = new ObjectTree()
    constructor(rapid) {
        this.rapid = rapid
    }
    add(object) {
        return this.objects.add(object)
    }
    frame(dt) {
        this.objects.update(dt)
        this.objects.render(this.rapid)
    }
}
