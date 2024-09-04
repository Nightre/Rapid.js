import { Color, Rapid } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})
const cat = await rapid.textures.textureFromUrl("./cat.png")
const plane = await rapid.textures.textureFromUrl("./plane.png")


const render = () => {
    rapid.startRender()
    rapid.matrixStack.scale(5, 5)

    rapid.startDrawMask()
    rapid.renderSprite(plane, 20, 20)
    rapid.endDrawMask()

    rapid.renderSprite(cat, 35, 20)

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