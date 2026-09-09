import { Vec2 } from "../src/math"

/** Minimal usage: a sprite inherits its parent's position. */
export function demo(rapid, texture) {
    const scene = new ObjectTree()
    const parent = scene.add(new ObjectNode())
    parent.position.x = 100
    parent.add(new SpriteNode(texture)).position.x = 20
    scene.render(rapid)
}

/** Minimal scene graph using class inheritance. */
export class ObjectNode {
    parent = null
    children = []
    position = new Vec2(0)
    rotation = 0
    scale = new Vec2(1)
    origin = new Vec2(0)
    size = new Vec2(0)
    visible = true
    zIndex = 0
    matrix = null

    add(child) {
        child.parent?.remove(child)
        child.parent = this
        this.children.push(child)
        return child
    }

    remove(child) {
        const i = this.children.indexOf(child)
        if (i < 0) return false
        this.children.splice(i, 1)
        child.parent = null
        return true
    }

    update(_dt) { }
    draw(_rapid, _matrix) { }

    updateTree(dt) {
        this.update(dt)
        for (const child of this.children) child.updateTree(dt)
    }

    collect(rapid, list) {
        if (!this.visible) return
        const stack = rapid.matrixStack
        this.matrix = stack.save()
        try {
            stack.applyTransform(this, this.size.x, this.size.y)
            list.push(this)
            for (const child of this.children) child.collect(rapid, list)
        } finally { stack.restore() }
    }
}

export class SpriteNode extends ObjectNode {
    constructor(texture) {
        super()
        this.texture = texture
        this.size = { x: texture.rawWidth, y: texture.rawHeight }
    }

    draw(rapid, matrix) {
        rapid.drawSprite({ texture: this.texture, customMatrix: matrix })
    }
}

export class ObjectTree {
    root = new ObjectNode()
    drawList = []
    add(object) { return this.root.add(object) }
    update(dt) { for (const child of this.root.children) child.updateTree(dt) }

    render(rapid) {
        rapid.clear()
        this.drawList.length = 0
        for (const child of this.root.children) child.collect(rapid, this.drawList)
        this.drawList.sort((a, b) => a.zIndex - b.zIndex)
        for (const object of this.drawList) object.draw(rapid, object.matrix.world)
        rapid.flush()
    }
}
