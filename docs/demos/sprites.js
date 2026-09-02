import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
    const [sprite, toycar, tree, sheet] = await Promise.all([
        rapid.texture.load("./image/sprite.png"),
        rapid.texture.load("./image/toycar.png"),
        rapid.texture.load("./image/tree.png"),
        rapid.texture.load("./image/sprite-sheet.png"),
    ]);

    const FPS = 10;
    const frames = sheet.splitGrid(64, 64)

    const makeLabel = (text, fontSize = 14) =>
        rapid.texture.createTextTexture({
            text,
            fontSize,
            fontWeight: "bold",
            fill: "#526272",
            align: "center",
        });

    const labels = [
        makeLabel("Sprites"),
        makeLabel("Animation"),
        makeLabel("Sheet frame"),
    ];
    const stripLabel = makeLabel("Sprite sheet sub-textures", 13);
    const sourceLabel = rapid.texture.createTextTexture({
        text: "cat spritesheet from: https://last-tick.itch.io/animated-pixel-cats-64x64",
        fontSize: 10,
        fill: "#7b8794",
        align: "center",
    });
    
    const x = [80, 240, 400];

    loop((time) => {
        const current = Math.floor(time * FPS) % frames.length;

        rapid.clear();

        for (let i = 0; i < labels.length; i++) {
            rapid.drawSprite({
                texture: labels[i],
                x: x[i],
                y: 26,
                origin: 0.5,
            });
        }

        //==== Sprites ====//

        rapid.drawSprite({ texture: tree, x: x[0] - 45, y: 100, scale: 0.65, origin: 0.5, flipX: true });
        rapid.drawSprite({ texture: toycar, x: x[0], y: 100, scale: 0.65, origin: 0.5 });
        rapid.drawSprite({ texture: sprite, x: x[0] + 45, y: 100, scale: 0.65, origin: 0.5 });

        //==== Animation ====//

        rapid.drawSprite({
            texture: toycar,
            x: x[1],
            y: 100,
            rotation: time * 1.5,
            scale: 0.8 + Math.sin(time * 2) * 0.15,
            origin: 0.5,
        });

        //==== Sheet frame ====//

        rapid.drawSprite({
            texture: frames[current],
            x: x[2],
            y: 100,
            scale: 1.35,
            origin: 0.5,
        });

        rapid.drawSprite({ texture: stripLabel, x: 240, y: 178, origin: 0.5 });

        for (let i = 0; i < frames.length; i++) {
            rapid.drawSprite({
                texture: frames[i],
                x: 44 + i * 56,
                y: 242,
                scale: 0.65,
                origin: 0.5,
                color: i === current ? Color.White : Color.Gray
            });
        }

        rapid.drawSprite({ texture: sourceLabel, x: 240, y: 282, origin: 0.5 });

        rapid.flush();
    });
}
