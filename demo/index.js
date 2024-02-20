import { Rapid } from "../dist/rapid.js"
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
        count ++
        spriteCountDom.innerHTML = `sprite: ${ count }`
    }
}
const addSprite = () => {
    sprites.push(new Sprite())
}

for (let index = 0; index < 50; index++) {
    addSprite()
}
let add = false
rapid.canvas.onmousedown = () => {
    add = true
}
rapid.canvas.onmouseup = () => {
    add = false
}
const render = ()=>{
    if (add) {
        for (let index = 0; index < 100; index++) {
            addSprite()
        }
    }
    rapid.startRender()
    //rapid.matrixStack.translate(0,0)
    // for (let index = 0; index < 8; index++) {
    //     //rapid.matrixStack.pushMat()
    //     rapid.renderSprite(cat, index*40, 0)
    //     //rapid.matrixStack.popMat()
    // }
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
        rapid.renderSprite(element.texture, element.x, element.y)
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