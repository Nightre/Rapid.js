import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
    const toycar = await rapid.texture.load("./image/toycar.png");

    const scene = rapid.texture.createRenderTexture({ width: 160, height: 160 });
    let nextPaintTime = 0;

    loop((time) => {
        if (time >= nextPaintTime) {
            nextPaintTime = time + 0.1;

            rapid.drawToRenderTexture(scene, () => {
                rapid.drawSprite({
                    texture: toycar,
                    x: scene.width * Math.random(),
                    y: scene.height * Math.random(),
                    rotation: Math.random() * Math.PI * 2,
                    scale: 0.7,
                    origin: 0.5,
                });
            }, null); // Setting this to `null` means the render texture will not be cleared; 
            // if clearing is required, please pass in a color
            // which will be used as the background color for the clear operation.
        }

        rapid.clear();

        rapid.drawSprite({ texture: scene, x: 130, y: 150, origin: 0.5 });

        rapid.drawSprite({
            texture: scene,
            x: 320,
            y: 150,
            rotation: -time * 0.5,
            scale: 0.55 + 0.15 * Math.sin(time * 2),
            origin: 0.5,
            color: new Color(255, 210, 190),
        });

        rapid.flush();
    });
}
