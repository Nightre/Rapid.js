import { Rapid } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game")
})
const cat = await rapid.texture.textureFromUrl("./cat.png")

const render = ()=>{
    rapid.startRender()
    rapid.matrixStack.translate(100,100)
    for (let index = 0; index < 50; index++) {
        //rapid.matrixStack.pushMat()
        rapid.renderSprite(cat, 0, 0)
        //rapid.matrixStack.popMat()
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