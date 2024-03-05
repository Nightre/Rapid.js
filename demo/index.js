import { Color, Rapid } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})
const cat = await rapid.textures.textureFromUrl("./cat.png")
const plane = await rapid.textures.textureFromUrl("./plane.png")

const spriteCountDom = document.getElementById("sprite-count")
const sprites = []
let count = 0

class Sprite {
    constructor() {
        this.x = 100 * Math.random()
        this.y = 100 * Math.random()
        this.speedY = 10 * Math.random()
        this.speedX = 10 * Math.random()
        this.texture = Math.random() > 0.5 ? cat : plane
        count++
        spriteCountDom.innerHTML = `sprite: ${count}`
    }
}
const addSprite = () => {
    sprites.push(new Sprite())
}

for (let index = 0; index < 500; index++) {
    addSprite()
}
let add = false
let time = 0
rapid.canvas.onmousedown = () => {
    add = true
}
rapid.canvas.onmouseup = () => {
    add = false
}

const render = () => {
    if (add) {
        for (let index = 0; index < 50; index++) {
            addSprite()
        }
    }
    time += 0.01
    rapid.startRender()

    for (let index = 0; index < sprites.length; index++) {
        const element = sprites[index];
        element.x += element.speedX
        element.y += element.speedY
        element.speedY += 1
        if (element.y > 468) {
            element.speedY = -15 - Math.round(15 * Math.random())
        }
        if (element.x > 468) {
            element.speedX = -5
        } else if (element.x < 0) {
            element.speedX = 5
        }
        rapid.save()
        rapid.matrixStack.translate(element.x, element.y)
        rapid.renderSprite(element.texture)
        rapid.restore()
    }
    rapid.endRender()
}
// performance monitor
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
function animate() {
    stats.begin();
    render()
    stats.end();
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);