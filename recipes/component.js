import { Vec2 } from "../src/math"

/** Minimal usage: compose transform, rendering, and behaviour. */
export function demo(rapid, texture) {
    class Spin extends Component {
        update(dt) { this.node.rotation += dt }
    }
    const scene = new ComponentScene()
    const player = scene.add(new Node())
    player.use(new SpriteRenderer(texture))
    player.use(new Spin())
    scene.update(1 / 60)
    scene.render(rapid)
}

/** Minimal component-based scene graph. */
export class Component {
    enabled = true
    update(_dt) { }
}

export class SpriteRenderer extends Component {
    constructor(texture) {
        super()
        this.texture = texture
    }
    draw(rapid, matrix) {
        rapid.drawSprite({ texture: this.texture, customMatrix: matrix })
    }
}

export class Node {
    parent = null
    children = []
    components = []
    position = new Vec2(0)
    rotation = 0
    scale = new Vec2(1)
    origin = new Vec2(0)
    size = new Vec2(0)
    visible = true
    zIndex = 0

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

    use(component) {
        component.node = this
        this.components.push(component)
        if (component.texture && !this.size.x && !this.size.y) {
            this.size = { x: component.texture.rawWidth, y: component.texture.rawHeight }
        }
        return component
    }

    update(dt) {
        for (const c of this.components) {
            if (c.enabled) c.update(dt)
        }
        for (const child of this.children) child.update(dt)
    }

    collect(rapid, list) {
        if (!this.visible) return
        const stack = rapid.matrixStack
        const matrix = stack.save()
        try {
            stack.applyTransform(this, this.size.x, this.size.y)
            for (const c of this.components) {
                if (c.enabled && c.draw) {
                    list.push({ c, matrix: matrix.world, z: this.zIndex })
                }
            }
            for (const child of this.children) {
                child.collect(rapid, list)
            }
        } finally {
            stack.restore()
        }
    }
}

export class ComponentScene {
    root = new Node()
    drawList = []
    
    add(node) {
        return this.root.add(node)
    }

    update(dt) {
        this.root.update(dt)
    }

    render(rapid) {
        rapid.clear()
        this.drawList.length = 0
        for (const child of this.root.children) {
            child.collect(rapid, this.drawList)
        }
        this.drawList.sort((a, b) => a.z - b.z)
        for (const item of this.drawList) {
            item.c.draw(rapid, item.matrix)
        }
        rapid.flush()
    }
}
