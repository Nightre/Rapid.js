import { Color, Rapid, Vec2 } from "/Rapid.js/dist/rapid.js"


const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("E6F0FF")
})

const cat = await rapid.texture.textureFromUrl("./assets/cat.png")
const plane = await rapid.texture.textureFromUrl("./assets/plane.png")

const spriteCountDom = document.getElementById("sprite-count")

const sprites = []

let count = 0
class Sprite {
    constructor() {
        this.position = new Vec2(100 * Math.random(), 100 * Math.random())
        
        this.speedY = 10 * Math.random()
        this.speedX = 10 * Math.random()
        
        this.texture = Math.random() > 0.5 ? cat : plane
        this.color = new Color(
            200 + Math.random() * 55,
            200 + Math.random() * 55,
            200 + Math.random() * 55,
        )
        
        this.bounce = Math.random() * 15 + 15
        
        count++
        spriteCountDom.innerHTML = `sprite: ${count}`
    }
    
    
    render() {
        this.position.x += this.speedX
        this.position.y += this.speedY
        
        this.speedY += 1
        
        if (this.position.y > 500 - 32) {
            this.speedY = -this.bounce
        }
        
        if (this.position.x > 500 - 32) {
            this.speedX = -5
        } else if (this.position.x < 0) {
            this.speedX = 5
        }

        rapid.renderSprite({
            texture: this.texture,
            position: this.position,
            color: this.color,
        })
    }
}


const addSprite = () => {
    sprites.push(new Sprite())
}

for (let index = 0; index < 500; index++) {
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

const render = () => {
    if (add) {
        for (let index = 0; index < 50; index++) {
            addSprite()
        }
    }
    
    time += 0.01
    
    rapid.startRender()
    
    for (let index = 0; index < sprites.length; index++) {
        const element = sprites[index]
        element.render()
    }
    
    rapid.endRender()
}



var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);


function animate() {
    stats.begin();
    render()
    stats.end();
    requestAnimationFrame(animate);
}

animate()