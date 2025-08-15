import { Color, Rapid, Vec2, MaskType, BlendMode } from "../../dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

const cat = await rapid.texture.textureFromUrl("./assets/cat.png")
const light = await rapid.texture.textureFromUrl("./assets/light.png")

let time = 0


const occlusion = [
    [new Vec2(0, 0), new Vec2(50, 0), new Vec2(100, 0), new Vec2(100, 50), new Vec2(100, 100), new Vec2(50, 100), new Vec2(0, 100), new Vec2(0, 50)],
    [new Vec2(200, 100), new Vec2(220, 100), new Vec2(240, 100), new Vec2(250, 110), new Vec2(250, 130), new Vec2(250, 150), new Vec2(230, 150), new Vec2(200, 150), new Vec2(200, 130)],
    [new Vec2(300, 50), new Vec2(320, 45), new Vec2(340, 47), new Vec2(350, 50), new Vec2(345, 70), new Vec2(335, 85), new Vec2(325, 100), new Vec2(315, 85), new Vec2(305, 70)],
    [new Vec2(100, 300), new Vec2(120, 280), new Vec2(150, 250), new Vec2(180, 280), new Vec2(200, 300), new Vec2(180, 320), new Vec2(150, 350), new Vec2(120, 320)],
    [new Vec2(350, 400), new Vec2(370, 395), new Vec2(400, 400), new Vec2(405, 420), new Vec2(400, 450), new Vec2(380, 455), new Vec2(350, 450), new Vec2(335, 435), new Vec2(325, 425), new Vec2(335, 410)],
    [new Vec2(50, 200), new Vec2(70, 180), new Vec2(90, 170), new Vec2(110, 180), new Vec2(120, 200), new Vec2(110, 220), new Vec2(90, 230), new Vec2(70, 220), new Vec2(50, 210)],
    [new Vec2(400, 150), new Vec2(420, 140), new Vec2(440, 145), new Vec2(450, 160), new Vec2(445, 180), new Vec2(430, 190), new Vec2(410, 185), new Vec2(400, 170), new Vec2(395, 160)],
    [new Vec2(300, 300), new Vec2(350, 200), new Vec2(300, 150), new Vec2(250, 200), new Vec2(200, 200)]
]
const lightColor = new Color(0, 0, 0, 200)

const render = () => {
    time += 0.01

    rapid.startRender()
    const playerPos = new Vec2(mouseX, mouseY)

    if (maskType === MaskType.Include) renderOcclusion(playerPos)

    rapid.drawLightShadowMask({occlusion, lightSource: playerPos, type: maskType})

    if (maskType === MaskType.Include) {
        rapid.renderCircle({
            position: playerPos,
            radius: 800,
            color: lightColor,
        })
    }
    else {
        rapid.renderSprite({
            texture: light,
            position: playerPos,
            origin: new Vec2(0.5, 0.5),
            color: Color.Yellow,
        })
    }
    rapid.clearMask()

    rapid.renderSprite({
        texture: cat,
        position: playerPos,
        origin: new Vec2(0.5, 0.5),
    })

    if (maskType === MaskType.Exclude) renderOcclusion()

    rapid.endRender(playerPos)
}

const renderOcclusion = () => {
    occlusion.forEach(polygon => {
        rapid.renderGraphic({
            points: polygon,
            color: Color.Red,
        })
    })
}

function animate() {
    render()
    requestAnimationFrame(animate);
}



requestAnimationFrame(animate);

let mouseX = 0
let mouseY = 0

document.addEventListener('mousemove', (e) => {
    const rect = rapid.canvas.getBoundingClientRect()
    mouseX = e.clientX - rect.left
    mouseY = e.clientY - rect.top
})


let maskType = MaskType.Include

document.getElementById("include").addEventListener("change", (e) => {
    maskType = e.target.checked ? MaskType.Include : MaskType.Exclude
})
