import { Color, Rapid, Vec2 } from "../../dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

let time = 0;

const grass = await rapid.texture.textureFromUrl("./assets/stone.jpeg");

const graphicPoints = Vec2.FromArray([
    [0, 50],
    [120, 20],
    [130, 100],
    [50, 90],
    [0, 70],
]);

const graphicColors = [
    Color.Blue, Color.Red, Color.Yellow, Color.Green, Color.Blue
];

const graphic2Points = Vec2.FromArray([
    [0, 0],
    [100, 0],
    [125, 50],
    [100, 100],
    [50, 125],
    [0, 100],
]);

const graphic2UV = Vec2.FromArray([
    [0, 0],
    [1, 0],
    [1, 0.5],
    [1, 1],
    [0.5, 1],
    [0, 1],
]);


function animate() {
    time += 0.1;
    
    const s = Math.sin(time);
    graphicPoints[3].y = s * 10 + 100;
    graphic2Points[3].x = s * 10 + 100;
    graphic2Points[5].y = s * 10 + 100;

    rapid.startRender();

    rapid.renderGraphic({ 
        offset: new Vec2(50, 50), 
        points: graphicPoints, 
        color: graphicColors 
    });

    rapid.renderGraphic({ 
        offset: new Vec2(200, 50), 
        points: graphic2Points, 
        uv: graphic2UV, 
        texture: grass 
    });

    rapid.renderCircle({ 
        offset: new Vec2(50, 200), 
        radius: 30, 
        color: Color.Red 
    });

    rapid.renderRect({ 
        offset: new Vec2(100, 200), 
        width: 30, 
        height: 50, 
        color: Color.Yellow 
    });

    rapid.endRender();

    requestAnimationFrame(animate);
}

animate(); 