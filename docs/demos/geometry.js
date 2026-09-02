import { Color, Vec2 } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid) {
    const texture = await rapid.texture.load("./image/polygon-texture.png");
    rapid.clear();

    rapid.drawGraphic({
        points: Vec2.FromArray([[60, 110], [140, 110], [100, 40]]),
        color: new Color(52, 152, 219),
    });

    rapid.drawGraphic({
        points: Vec2.FromArray([[190, 45], [290, 45], [290, 110], [190, 110]]),
        color: new Color(46, 204, 113),
        drawMode: rapid.gl.TRIANGLE_FAN,
    });

    const pentagon = [];
    const pentagonUV = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle);
        const y = Math.sin(angle);

        pentagon.push([390 + x * 40, 78 + y * 40]);
        pentagonUV.push([(x + 1) * 0.5, (y + 1) * 0.5]);
    }
    
    rapid.drawGraphic({
        points: Vec2.FromArray(pentagon),
        uv: Vec2.FromArray(pentagonUV),
        texture: texture,
        drawMode: rapid.gl.TRIANGLE_FAN,
    });

    rapid.drawGraphic({
        points: Vec2.FromArray([[60, 250], [140, 250], [100, 180]]),
        color: [
            new Color(231, 76, 60),
            new Color(241, 196, 15),
            new Color(52, 152, 219),
        ],
    });

    rapid.drawRect({
        x: 190,
        y: 185,
        width: 100,
        height: 65,
        color: new Color(52, 73, 94),
    });

    rapid.drawCircle({ x: 360, y: 215, radius: 34, color: new Color(230, 126, 34) });
    rapid.drawCircle({
        x: 430,
        y: 215,
        radius: 34,
        segments: 6,
        color: new Color(41, 128, 185),
    });

    rapid.flush();
}
