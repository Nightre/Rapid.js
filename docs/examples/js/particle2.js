import { Rapid, Color, Vec2, ParticleShape } from "/Rapid.js/dist/rapid.js";

// 创建Rapid实例
const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("#000000")
});

const particleTexture = await rapid.textures.textureFromUrl("./assets/particle2.png");
const particleTexture2 = await rapid.textures.textureFromUrl("./assets/particle3.png");
let mouse = new Vec2(255, 255);

let particle = rapid.createParticleEmitter({
    position: mouse,

    life: 2,
    texture: [particleTexture2, particleTexture],

    origin: new Vec2(0.5, 0.5),

    emitRate: 100,
    localSpace: false, // 使用全局坐标系

    animation: {
        speed: {
            start: 100,
            end: 200,
        },
        scale: {
            start: 2,
            end: 0.1,
        },
        rotation: [0, Math.PI * 2]
    },

    origin: new Vec2(0.5, 0.5),
});
particle.start();

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
