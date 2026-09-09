import { Component, ComponentScene, Node, SpriteRenderer } from "../component.js"

/** Minimal usage, matching Kaplay's add([...]) composition style. */
export function demo(rapid, texture) {
    const k = new KaplayLike(rapid)
    const bean = k.add([
        sprite(texture),
        pos(k.center()),
        health(5),
        body(),
        area(),
    ])
    bean.velocity.x = 60
    k.frame(1 / 60)
    return bean
}

// Each factory returns a tiny installer accepted by add([...]).
export const sprite = texture => node => node.use(new SpriteRenderer(texture))
export const pos = (x, y) => node => {
    node.position = typeof x === "object" ? x : { x, y }
}
export const health = value => node => {
    node.health = value
    node.hurt = amount => node.health -= amount
}
export const area = () => node => {
    node.contains = (x, y) =>
        x >= node.position.x && y >= node.position.y &&
        x < node.position.x + node.size.x && y < node.position.y + node.size.y
}
export const body = () => node => {
    node.velocity = { x: 0, y: 0 }
    const physics = new Component()
    physics.update = dt => {
        node.position.x += node.velocity.x * dt
        node.position.y += node.velocity.y * dt
    }
    node.use(physics)
}

/** Minimal Kaplay-style facade over the component recipe. */
export class KaplayLike {
    scene = new ComponentScene()
    constructor(rapid) {
        this.rapid = rapid
    }

    center() {
        return {
            x: this.rapid.width / 2,
            y: this.rapid.height / 2
        }
    }

    add(parts) {
        const object = this.scene.add(new Node())
        for (const install of parts) {
            install(object)
        }
        return object
    }

    frame(dt) {
        this.scene.update(dt)
        this.scene.render(this.rapid)
    }
}
