import { ObjectNode, ObjectTree, SpriteNode } from "../game-object.js"

/** Minimal usage, matching Pixi's stage/container style. */
export function demo(rapid, texture) {
    const app = new Application(rapid)
    const world = app.stage.addChild(new Container())
    const player = world.addChild(new Sprite(texture))
    world.x = 100
    player.x = 20
    app.render()
    return player
}

class DisplayObject extends ObjectNode {
    get x() { return this.position.x }
    set x(value) { this.position.x = value }
    get y() { return this.position.y }
    set y(value) { this.position.y = value }
    addChild(...children) {
        for (const child of children) this.add(child)
        return children[0]
    }
    removeChild(child) { return this.remove(child) }
}

export class Container extends DisplayObject { }

export class Sprite extends SpriteNode {
    get x() { return this.position.x }
    set x(value) { this.position.x = value }
    get y() { return this.position.y }
    set y(value) { this.position.y = value }
}

/** Minimal Pixi-style facade over the game-object recipe. */
export class Application {
    tree = new ObjectTree()
    stage = this.tree.add(new Container())
    constructor(rapid) { this.rapid = rapid }
    render() { this.tree.render(this.rapid) }
}
