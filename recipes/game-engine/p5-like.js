import { ImmediateScene } from "../immediate-mode.js"

/** Minimal usage. */
export function demo(rapid, texture) {
    new P5Like(rapid).draw(p => {
        p.push()
        p.translate(100, 50)
        p.rotate(0.1)
        p.image(texture, 20, 0)
        p.pop()
    })
}

/** Minimal p5-style stateful drawing facade. */
export class P5Like {
    constructor(rapid) {
        this.rapid = rapid
        this.scene = new ImmediateScene(rapid)
    }
    
    draw(callback) {
        this.scene.render(() => callback(this))
    }

    push() {
        return this.rapid.matrixStack.save()
    }

    pop() {
        this.rapid.matrixStack.restore()
    }

    translate(x, y) {
        this.rapid.matrixStack.translate(x, y)
    }

    rotate(angle) {
        this.rapid.matrixStack.rotate(angle)
    }

    scale(x, y = x) {
        this.rapid.matrixStack.scale(x, y)
    }

    image(texture, x = 0, y = 0) {
        this.rapid.drawSprite({ texture, x, y })
    }
}
