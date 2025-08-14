import { Rapid, Color, Vec2, ParticleShape } from "/Rapid.js/dist/rapid.js";

// 创建Rapid实例
const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("#000000")
});

const particleTexture = await rapid.texture.textureFromUrl("./assets/particle.png");
let mouse = new Vec2(255, 255);

let particle = rapid.createParticleEmitter({
    position: mouse,


    life: 3,
    texture: particleTexture,


    animation: {
        scale: {
            start: 1,
            end: 0.1,
        },
    
        rotation: {
            start: 0,
            end: Math.PI * 2,
        },
    
        color: {
            start: new Color(255, 165, 0, 255),
            end: new Color(255, 69, 0, 0),
        },
        velocity: {
            start: [new Vec2(-10, 0), new Vec2(10, 0)],
        },
        acceleration: {
            start: [new Vec2(-5, -50), new Vec2(5, -50)],
            end: new Vec2(0, -150),
        },
    },

    origin: new Vec2(0.5, 0.5),

    emitRate: 100,
    localSpace: true, // 使用全局坐标系

    emitShape: ParticleShape.CIRCLE,
    emitRadius: 30,
});
particle.start();

for (let index = 0; index < 30; index++) {
    particle.update(0.1);
}
// 主循环
function loop() {
    const deltaTime = rapid.startRender();

    particle.update(deltaTime);
    rapid.renderParticles(particle);
    rapid.endRender();

    requestAnimationFrame(loop);
}

// 启动主循环
loop();

rapid.canvas.addEventListener("mousemove", (ev) => {
    const rect = rapid.canvas.getBoundingClientRect()
    mouse.x = ev.clientX - rect.left
    mouse.y = ev.clientY - rect.top
})
