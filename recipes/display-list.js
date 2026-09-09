import { Vec2 } from "../src/math"

/** Minimal usage: flat entries can still inherit transforms. */
export function demo(rapid, texture) {
    const list = new DisplayList()
    const world = list.add(() => { }, { position: new Vec2(100, 50) })
    list.addSprite(texture, { parent: world, position: new Vec2(20, 0) })
    list.render(rapid)
}

/** Minimal flat display list; parent links provide transform hierarchy. */
export class DisplayList {
    items = []

    add(draw, options = {}) {
        const item = Object.assign({
            parent: null,
            position: new Vec2(0),
            rotation: 0,
            scale: new Vec2(1),
            origin: new Vec2(0),
            width: 0, height: 0,
            visible: true, zIndex: 0,
        }, options, { draw, order: this.items.length, matrix: null })
        this.items.push(item)
        return item
    }

    addSprite(texture, options = {}) {
        return this.add(
            (rapid, matrix) => rapid.drawSprite({
                texture, color: options.color, customMatrix: matrix,
            }),
            { width: texture.rawWidth, height: texture.rawHeight, ...options },
        )
    }

    remove(item) {
        const i = this.items.indexOf(item)
        if (i < 0) return false
        for (const child of this.items) {
            if (child.parent === item) {
                child.parent = item.parent
            }
        }
        this.items.splice(i, 1)
        return true
    }

    render(rapid) {
        rapid.clear()
        const drawList = []
        const collect = item => {
            if (!item.visible) return
            const stack = rapid.matrixStack
            item.matrix = stack.save()
            try {
                stack.applyTransform(item, item.width, item.height)
                drawList.push(item)
                for (const child of this.items) {
                    if (child.parent === item) collect(child)
                }
            } finally {
                stack.restore()
            }
        }

        for (const item of this.items) {
            if (!item.parent) collect(item)
        }
        drawList.sort((a, b) => a.zIndex - b.zIndex || a.order - b.order)
        for (const item of drawList) {
            item.draw(rapid, item.matrix.world)
        }
        rapid.flush()
    }
}
