import { Color, Rapid, Vec2 } from "../../dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

let time = 0;

const cat = await rapid.texture.textureFromUrl("./assets/cat.png");

function animate() {
    time += 0.1;
    const s = Math.sin(time);
    rapid.startRender();
    rapid.renderSprite({
        texture: cat,
        color: Color.Yellow,
        position: new Vec2(30, 30),
        rotation: s * 0.5,
        beforRestore: () => {
            rapid.renderSprite({
                texture: cat, 
                color: Color.Yellow, 
                position: new Vec2(10, 10), 
                scale: s * 0.5 + 1,
                beforRestore: () => {
                    
                    rapid.renderSprite({ 
                        texture: cat, 
                        color: Color.Yellow, 
                        position: new Vec2(10, 10), 
                    });

                    const localPos = rapid.matrixStack.globalToLocal(new Vec2(100, 50))
                    
                    rapid.renderSprite({ 
                        texture: cat, 
                        color: Color.Red, 
                        position: localPos, 
                    });
                }
            });
        }
    });
    
    rapid.renderSprite({
        texture: cat,
        color: Color.Green,
        position: new Vec2(80, 30),
        rotation: s * 0.8,
        restoreTransform: false
    });

    rapid.renderSprite({
        texture: cat,
        color: Color.Green,
        position: new Vec2(50, 50),
        scale: 1 + s * 0.5,
        restoreTransform: false,
    });

    rapid.renderSprite({
        texture: cat,
        color: Color.Green,
        position: new Vec2(30, 30),
    });

    rapid.renderSprite({
        texture: cat,
        color: Color.Green,
        position: new Vec2(60, 30),
    });

    rapid.restore();

    rapid.renderSprite({
        texture: cat,
        color: Color.Green,
        position: new Vec2(30, 0),
    });

    rapid.restore();

    rapid.renderSprite({
        texture: cat,
        color: Color.Green,
        position: new Vec2(0, 0),
        rotation: s * 0.5,
    });

    requestAnimationFrame(animate);
}



animate(); 