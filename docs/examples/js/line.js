import { Color, Rapid, Vec2, LineTextureMode, TextureWrapMode } from "/Rapid.js/dist/rapid.js"


const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})
const road = await rapid.texture.textureFromUrl("./assets/road.png", false, TextureWrapMode.REPEAT);
let lineMod = LineTextureMode.REPEAT;

const linePath = [
    new Vec2(0, 0),
    new Vec2(-10, 100),
    new Vec2(0, 200),
    new Vec2(0, 300),
    new Vec2(50, 350),
];

const linePath2 = [
    new Vec2(0, 0),
    new Vec2(100, 0),
    new Vec2(200, 50),
    new Vec2(100, 200),
    new Vec2(20, 100),
];

let linePath3 = [];
let time = 0;
let linePath4 = [];
animate();

function animate() {
    time += 0.01;
    
    rapid.startRender();
    
    linePath3 = Array.from({ length: 40 }, (_, i) => 
        new Vec2(i * 10, Math.sin(i * 0.2 + time) * 100)
    );
    linePath4 = Array.from({ length: 40 }, (_, i) => 
        new Vec2(i * 10, Math.sin(i * 0.2 + time) * 100)
    );
    
    rapid.renderLine({
        position: new Vec2(80, 40),
        points: linePath,
        width: 50,
        roundCap: true,

        color: new Color(0, 50, 50, 155),
    });
    
    rapid.renderLine({
        position: new Vec2(100, 50),
        points: linePath2,
        width: 50,
        color: new Color(255, 0, 255, 255),
        closed: true,
    });
    
    rapid.renderLine({
        position: new Vec2(30, 300),
        points: linePath3,
        width: 20,
        roundCap: true,

        color: new Color(0, 50, 50, 155),
    });

    rapid.renderLine({
        position: new Vec2(30, 200),
        points: linePath4,
        width: 30,

        texture: road,
        textureMode: lineMod,
    });

    rapid.endRender();
    
    requestAnimationFrame(animate);
}

document.getElementById("stretch").addEventListener("change", (e) => {
    lineMod = e.target.checked ? LineTextureMode.STRETCH : LineTextureMode.REPEAT;
});

