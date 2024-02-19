import { Rapid } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game")
})
const cat = await rapid.texture.textureFromUrl("./cat.png")
const plane = await rapid.texture.textureFromUrl("./plane.png")


const render = ()=>{
    rapid.startRender()
    rapid.matrixStack.translate(100,100)
    // for (let index = 0; index < 8; index++) {
    //     //rapid.matrixStack.pushMat()
    //     rapid.renderSprite(cat, index*40, 0)
    //     //rapid.matrixStack.popMat()
    // }
    rapid.renderSprite(cat, 0, 0)
    rapid.matrixStack.translate(100,100)

    rapid.renderSprite(cat, 50, 0)
    rapid.renderSprite(plane, 100, 0)
    rapid.matrixStack.translate(100,100)

    rapid.renderSprite(plane, 10, 50)

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
    //requestAnimationFrame(animate);
}
requestAnimationFrame(animate);