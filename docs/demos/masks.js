import { MaskType } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid) {
    const [house, maskTexture] = await Promise.all([
        rapid.texture.load("./image/house.png"),
        rapid.texture.load("./image/mask-texture.png"),
    ]);

    const makeLabel = (text) =>
        rapid.texture.createTextTexture({
            text,
            fontSize: 14,
            fontWeight: "bold",
            fill: "#526272",
            align: "center",
        });

    const labels = [
        makeLabel("Texture mask"),
        makeLabel("EQUAL"),
        makeLabel("NOT_EQUAL"),
    ];
    const x = [80, 240, 400];

    rapid.clear();

    for (let i = 0; i < labels.length; i++) {
        rapid.drawSprite({ texture: labels[i], x: x[i], y: 26, origin: 0.5 });
    }

    //==== Texture mask with withMask ====//

    rapid.withMask(
        () => rapid.drawMaskImage({ texture: maskTexture, x: x[0], y: 150, scale: 1.5, origin: 0.5 }),
        () => rapid.drawSprite({ texture: house, x: x[0], y: 150, origin: 0.5 }),
    );

    //==== MaskType.EQUAL with withMask ====//

    rapid.withMask(
        () => rapid.drawCircle({ x: x[1], y: 150, radius: 38 }),
        () => rapid.drawSprite({ texture: house, x: x[1], y: 150, origin: 0.5 }),
        MaskType.EQUAL,
    );

    //==== MaskType.NOT_EQUAL with manual mask control ====//

    rapid.clearMask();
    rapid.startDrawMask();
    rapid.drawCircle({ x: x[2], y: 150, radius: 38 });
    rapid.endDrawMask();

    rapid.enterMask(MaskType.NOT_EQUAL);
    rapid.drawSprite({ texture: house, x: x[2], y: 150, origin: 0.5 });
    rapid.exitMask();

    rapid.flush();
}
