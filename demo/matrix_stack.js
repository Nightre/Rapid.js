import { Color, Rapid } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})
const cat = await rapid.textures.textureFromUrl("./cat.png")
const plane = await rapid.textures.textureFromUrl("./plane.png")

//           R    G  B  A
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
    rapid.renderSprite(cat, 0, 0, red)
}
let time = 0

const render = () => {
    time += 0.1
    rapid.startRender()

    drawMatrixStackDemo()
    drawGraphicDemo()

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