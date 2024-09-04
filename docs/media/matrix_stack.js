import { CapTyps, Color, JoinTyps, Rapid, Vec2 } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})
const cat = await rapid.textures.textureFromUrl("./cat.png")
const plane = await rapid.textures.textureFromUrl("./plane.png")
const grass = await rapid.textures.textureFromUrl("./grass.png")

const text = rapid.textures.createText({ text: "Hello!", fontSize: 30 })
//           R    G  B  A
const red = new Color(255, 0, 0, 255)
const blue = new Color(0, 0, 255, 255)
const yellow = new Color(255, 255, 0, 255)
const green = new Color(0, 255, 0, 255)
const lineColor = new Color(0, 255, 0, 155)
const linePath = [new Vec2(0, 0), new Vec2(0, 50), new Vec2(120, 100), new Vec2(120, 200)]

const graphicPoints = Vec2.FormArray([
    [0, 50],
    [120, 20],
    [130, 100],
    [50, 90],
    [0, 70],
])
const graphicColor = [
    blue, red, yellow, green, blue
]

const graphic2Points = Vec2.FormArray([
    [0, 0],
    [100, 0],
    [125, 50],
    [100, 100],
    [50, 125],
    [0, 100],
])

const graphic2UV = Vec2.FormArray([
    [0, 0],
    [1, 0],
    [1, 0.5],
    [1, 1],
    [0.5, 1],
    [0, 1],
])


const drawGraphicDemo = () => {
    const s = Math.sin(time)
    linePath[1].x = s * 20
    graphicPoints[3].y = s * 10 + 100
    graphic2Points[3].x = s * 10 + 100
    graphic2Points[5].y = s * 10 + 100


    rapid.renderGraphic(50, 0, { points: graphicPoints, color: graphicColor })
    rapid.renderGraphic(200, 0, { points: graphic2Points, uv: graphic2UV, texture: grass })
    rapid.renderCircle(50, 200, 30, yellow)
    rapid.renderRect(100, 200, 30, 50, yellow)

    rapid.renderLine(100, 100, {
        points: linePath,
        width: 50,
        cap: CapTyps.ROUND,
        join: JoinTyps.ROUND,
        color: lineColor
    })
}
const drawMatrixStackDemo = () => {
    const s = Math.sin(time)

    rapid.save() // save matrixStack
    rapid.matrixStack.translate(150, 50)
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
    rapid.renderSprite(text, 200, 0)
    rapid.restore()

    text.setText("time:" + Math.round(time))
}
let time = 0

const render = () => {
    time += 0.1

    rapid.startRender()

    drawGraphicDemo()
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