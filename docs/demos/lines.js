import { Color, LineTextureMode, TextureWrapMode, Vec2 } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
    const ribbon = await rapid.texture.load("./image/line-texture.png", {
        wrap: TextureWrapMode.REPEAT,
    });

    loop((time) => {
        rapid.clear();

        rapid.drawLine({
            points: Vec2.FromArray([[30, 45], [200, 45]]),
            width: 6,
            color: new Color(52, 152, 219),
        });

        rapid.drawLine({
            points: Vec2.FromArray([[30, 85], [200, 85]]),
            width: 6,
            roundCap: true,
            color: new Color(52, 152, 219),
        });

        rapid.drawLine({
            points: Vec2.FromArray([
                [250, 85],
                [300, 30],
                [350, 85],
                [400, 30],
                [450, 85],
            ]),
            width: 6,
            color: new Color(46, 204, 113),
        });

        const wave = [];
        for (let x = 20; x <= 460; x += 6) {
            wave.push([x, 150 + Math.sin(x * 0.03 + time * 2) * 24]);
        }
        rapid.drawLine({
            points: Vec2.FromArray(wave),
            width: 32,
            texture: ribbon,
            textureMode: LineTextureMode.REPEAT,
        });

        const star = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + time;
            const radius = i % 2 === 0 ? 46 : 20;
            star.push([120 + Math.cos(angle) * radius, 230 + Math.sin(angle) * radius]);
        }
        rapid.drawLine({
            points: Vec2.FromArray(star),
            width: 10 + Math.sin(time * 3) * 5,
            closed: true,
            color: new Color(230, 126, 34),
        });

        const ring = [];
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            ring.push([370 + Math.cos(angle) * 42, 225 + Math.sin(angle) * 42]);
        }
        rapid.drawLine({
            points: Vec2.FromArray(ring),
            width: 8,
            closed: true,
            color: new Color(52, 73, 94),
        });

        rapid.flush();
    });
}
