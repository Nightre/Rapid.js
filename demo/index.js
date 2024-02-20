import { Color, Rapid } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game")
})
const cat = await rapid.texture.textureFromUrl("./cat.png")
const plane = await rapid.texture.textureFromUrl("./plane.png")

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

for (let index = 0; index < 2; index++) {
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
//                    R    G  B  A
const red = new Color(255, 0, 0, 255)
const blue = new Color(0, 0, 255, 255)
const yellow = new Color(255, 255, 0, 255)
const green = new Color(0, 255, 0, 255)

const drawGraphicDemo = () => {
    rapid.startGraphicDraw()
    const s = Math.sin(time)
    rapid.addGraphicVertex(50 + s * 50, 100, red)
    rapid.addGraphicVertex(200, 50, blue)
    rapid.addGraphicVertex(200 + s * 100, 200, yellow)
    rapid.addGraphicVertex(100, 300 + s * 100, green)
    rapid.addGraphicVertex(50, 300, green)
    rapid.endGraphicDraw()
}

const drawMatrixStackDemo = () => {
    const s = Math.sin(time)
    rapid.matrixStack.translate(150, 50)
    rapid.save() // save matrixStack
    rapid.matrixStack.rotate(s * 0.5 + 0.1)
    rapid.renderSprite(cat, 0, 0, yellow)
    rapid.matrixStack.translate(32, 32)
    rapid.renderSprite(cat, 0, 0, green)
    rapid.matrixStack.translate(32, 32)
    rapid.save() // save matrixStack
    rapid.renderSprite(plane)

    rapid.matrixStack.translate(32, 32)
    rapid.matrixStack.rotate(s)
    rapid.matrixStack.scale(2 + 1 * s)

    rapid.renderSprite(cat)
    rapid.matrixStack.translate(32, 32)
    rapid.renderSprite(plane)
    rapid.restore()
    rapid.matrixStack.translate(50, 50)
    rapid.renderSprite(plane)
    rapid.restore()
    rapid.matrixStack.translate(50, 50)
    rapid.renderSprite(cat,0,0,red)
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
        if (element.y > 600) {
            element.speedY = -15 - Math.round(15 * Math.random())
        }
        if (element.x > 600) {
            element.speedX = -5
        } else if (element.x < 0) {
            element.speedX = 5
        }
        rapid.save()
        rapid.matrixStack.translate(element.x, element.y)
        rapid.renderSprite(element.texture)
        rapid.restore()

        if (index == 3000) {
            drawGraphicDemo()
        }
    }
    if (sprites.length < 3000) {
        drawGraphicDemo()
    }
    drawMatrixStackDemo()

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