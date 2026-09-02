import { Color, Vec2 } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { canvas, loop }) {
    const food = await rapid.texture.load("./image/food.png");

    let pointer = new Vec2(240, 150);

    const onPointerMove = (event) => {
        const bounds = canvas.getBoundingClientRect();
        const css = new Vec2(
            event.clientX - bounds.left,
            event.clientY - bounds.top,
        );
        // use this:
        pointer = rapid.cssToLogic(css);
    };

    canvas.addEventListener("pointermove", onPointerMove);

    loop(() => {
        rapid.clear();

        rapid.drawLine({
            points: Vec2.FromArray([
                [0, pointer.y],
                [rapid.width, pointer.y]
            ]),
            width: 1,
            color: new Color(180, 205, 220),
        });
        rapid.drawLine({
            points: Vec2.FromArray([
                [pointer.x, 0],
                [pointer.x, rapid.height]
            ]),
            width: 1,
            color: new Color(180, 205, 220),
        });

        rapid.drawSprite({ texture: food, x: pointer.x, y: pointer.y, origin: 0.5 });

        const readout = rapid.texture.createTextTexture({
            text: `${Math.round(pointer.x)}, ${Math.round(pointer.y)}`,
            fontSize: 16,
            fill: "#243142",
        });
        rapid.drawSprite({ texture: readout, x: 12, y: 12 });

        rapid.flush();
    });

    return () => canvas.removeEventListener("pointermove", onPointerMove);
}
