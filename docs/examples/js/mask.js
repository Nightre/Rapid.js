import { Color, Rapid, Vec2, MaskType } from "../../dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

const cat = await rapid.texture.textureFromUrl("./assets/cat.png")
const plane = await rapid.texture.textureFromUrl("./assets/plane.png")

let time = 0
const render = () => {
    time += 0.01

    rapid.startRender()
    rapid.matrixStack.scale(5, 5)

    rapid.drawMask(maskType, () => {
        rapid.renderGraphic({
            points: [
                new Vec2(0, 0),
                new Vec2(10, Math.sin(time) * 10),
                new Vec2(0, 10),
            ],
            color: Color.Blue,
            offsetX: 10,
            offsetY: 40
        })
    })

    rapid.renderSprite({
        texture: cat,
        offsetX: 0,
        offsetY: 20
    })
    rapid.clearMask()
    rapid.renderSprite({
        texture: plane,
        offsetX: 0,
        offsetY: 0
    })

    rapid.endRender()
}


function animate() {
    render()
    requestAnimationFrame(animate);
}



requestAnimationFrame(animate);



let maskType = MaskType.Include



document.getElementById("include").addEventListener("change", (e) => {
    maskType = e.target.checked ? MaskType.Include : MaskType.Exclude
})
