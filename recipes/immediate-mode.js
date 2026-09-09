/** Minimal usage: the callback structure is the scene graph. */
export function demo(rapid, texture) {
    renderImmediate(rapid, scene =>
        scene.group({ x: 100, y: 50 }, scene => {
            scene.sprite({ texture, x: 20 })
            scene.sprite({ texture, y: 30 })
        })
    )
}

/** Minimal immediate-mode scene: rebuild the hierarchy every frame. */
export class ImmediateScene {
    constructor(rapid) { this.rapid = rapid }

    group(transform, draw, width = 0, height = 0) {
        if (transform.visible === false) return
        const stack = this.rapid.matrixStack
        const matrix = stack.save()
        try {
            stack.applyTransform(transform, width, height)
            draw(this, matrix)
        } finally {
            stack.restore()
        }
    }

    sprite(options) { this.rapid.drawSprite(options) }

    render(draw) {
        this.rapid.clear()
        try {
            draw(this)
        }
        finally {
            this.rapid.matrixStack.restoreAll()
        }
        this.rapid.flush()
    }
}

export function renderImmediate(rapid, draw) {
    new ImmediateScene(rapid).render(draw)
}
