import { DisplayList } from "../display-list.js"

/** Minimal usage. */
export function demo(rapid, texture) {
    const scene = new Scene(rapid)
    const world = scene.add.container(100, 50)
    const player = scene.add.image(20, 0, texture)
    world.add(player)
    scene.render()
    return player
}

const withXY = item => Object.defineProperties(item, {
    x: { 
        get: () => item.position.x,
        set: value => item.position.x = value 
    },
    y: { 
        get: () => item.position.y,
        set: value => item.position.y = value
    },
})

/** Minimal Phaser-style Scene facade backed by a display list. */
export class Scene {
    displayList = new DisplayList()
    constructor(rapid) {
        this.rapid = rapid
        this.add = {
            image: (x, y, texture) => withXY(this.displayList.addSprite(texture, {
                position: { x, y },
            })),
            container: (x, y) => {
                const item = withXY(this.displayList.add(() => {}, {
                    position: { x, y },
                }))
                item.add = child => child.parent = item
                return item
            },
        }
    }
    render() { this.displayList.render(this.rapid) }
}
