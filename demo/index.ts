import { Rapid } from "../src/index"
let rapid = new Rapid({
    canvas: document.getElementById("game") as HTMLCanvasElement
})
const cat = await rapid.texture.textureFromUrl("./cat.png")

const render = ()=>{
    rapid.startRender()
    for (let index = 0; index < 5; index++) {
        rapid.renderSprite(cat, 100, 100)
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