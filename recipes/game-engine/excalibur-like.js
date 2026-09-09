import { ComponentScene, Node, SpriteRenderer } from "../component.js"

/** Minimal usage. */
export function demo(rapid, texture) {
    const engine = new Engine(rapid)
    const actor = engine.add(new Actor({ x: 100, y: 50 }))
    actor.addComponent(new SpriteRenderer(texture))
    engine.frame(1 / 60)
    return actor
}

export class Actor extends Node {
    constructor(options = {}) {
        super()
        Object.assign(this.position, { x: options.x || 0, y: options.y || 0 })
    }

    addComponent(component) {
        return this.use(component)
    }
}

export class Scene {
    graph = new ComponentScene()
    add(actor) {
        return this.graph.add(actor)
    }

    update(dt) {
        this.graph.update(dt)
    }

    draw(rapid) {
        this.graph.render(rapid)
    }
}

/** Minimal Excalibur-style Actor/Scene facade. */
export class Engine {
    currentScene = new Scene()
    constructor(rapid) {
        this.rapid = rapid
    }
    
    add(actor) {
        return this.currentScene.add(actor)
    }

    frame(dt) {
        this.currentScene.update(dt)
        this.currentScene.draw(this.rapid)
    }
}
