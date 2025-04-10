import { Color, Rapid, Vec2 } from "/dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

let time = 0;

let text = rapid.textures.createText({ fontSize: 30 });

let text2 = rapid.textures.createText({ 
    text: "Hello World \n안녕하세요 세계\nこんにちは世界\nПривет мир\nHallo Welt", 
    fontSize: 24 
});

function animate() {
    time += 0.1;
    
    rapid.startRender();
    
    text.setText("你好世界 Time:" + Math.round(time));
    
    rapid.renderSprite({ texture: text, position: new Vec2(100, 100) });
    rapid.renderSprite({ texture: text2, position: new Vec2(100, 130) });
    
    rapid.endRender();
    
    requestAnimationFrame(animate);
}



animate(); 