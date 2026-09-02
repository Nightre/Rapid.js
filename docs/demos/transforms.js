import { Color, Vec2 } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default async function (rapid, { loop }) {
    const [box, toycar] = await Promise.all([
        rapid.texture.load("./image/box.png"),
        rapid.texture.load("./image/toycar.png"),
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
        makeLabel("Transform options"),
        makeLabel("Matrix stack tree"),
        makeLabel("updateMatrixSubtree()"),
        makeLabel("Custom matrices"),
    ];
    const divider = new Color(205, 225, 235);

    loop((time) => {
        rapid.clear();

        rapid.drawLine({
            points: Vec2.FromArray([[8, 150], [472, 150]]),
            width: 1,
            color: divider,
        });
        rapid.drawLine({
            points: Vec2.FromArray([[240, 8], [240, 292]]),
            width: 1,
            color: divider,
        });
        rapid.drawSprite({ texture: labels[0], x: 120, y: 20, origin: 0.5 });
        rapid.drawSprite({ texture: labels[1], x: 360, y: 20, origin: 0.5 });
        rapid.drawSprite({ texture: labels[2], x: 120, y: 168, origin: 0.5 });
        rapid.drawSprite({ texture: labels[3], x: 360, y: 168, origin: 0.5 });

        //==== Transform options ====// 

        const transform = {
            rotation: time,
            scale: 0.75 + Math.sin(time * 2) * 0.18,
            x: 120,
            y: 88,
            // or
            // position: new Vec2(120, 88)
        }

        rapid.withTransform(() => {
            rapid.drawSprite({
                texture: box,
                origin: 0.5,

                // Alternatively, instead of using `withTransform`, use:
                // x: 120,
                // y: 88,
                // rotation: time,
                // scale: 0.75 + Math.sin(time * 2) * 0.18,
            });
        }, transform)

        //==== Matrix stack tree ====//

        const stack = rapid.matrixStack;
        stack.save(); // A

        stack.translate(315, 88);
        stack.rotate(Math.sin(time) * 0.55);

        // Alternatively, instead of using `stack.translate` and `stack.rotate`, use:
        // stack.applyTransform({ 
        //     position:new Vec2(315, 88),
        //     rotation: Math.sin(time) * 0.55
        // })

        rapid.drawRect({ x: 0, y: -9, width: 52, height: 18, color: new Color(231, 76, 60) });

        stack.save(); // B
        stack.translate(47, 0);
        stack.rotate(Math.sin(time * 1.5) * 0.9 + 0.35);
        rapid.drawRect({ x: 0, y: -7, width: 42, height: 14, color: new Color(46, 204, 113) });

        stack.save(); // C
        stack.translate(37, 0);
        stack.rotate(Math.sin(time * 2.4));
        rapid.drawRect({ x: 0, y: -5, width: 25, height: 10, color: new Color(52, 152, 219) });
        stack.restore(); // back to C
        stack.restore(); // back to B
        stack.restore(); // back to A

        //==== updateMatrixSubtree ====//

        const hub = stack.save(); // get now matrix
        stack.translate(105, 232);

        const orbit = stack.save(); // get now matrix
        stack.rotate(time); // Local transformation of an orbit
        stack.translate(48, 0); // Local transformation of an orbit

        const child = stack.save(); // get now matrix
        stack.rotate(time * 3);
        stack.translate(28, 0);

        stack.restore();
        stack.restore();
        stack.restore();

        // Use a previously stored matrix via `customMatrix` elsewhere (even if the matrix stack is already empty).
        rapid.drawCircle({ radius: 7, color: new Color(52, 73, 94), customMatrix: hub.world });
        rapid.drawCircle({ radius: 10, color: new Color(255, 143, 112), customMatrix: orbit.world });
        rapid.drawCircle({ radius: 10, color: new Color(255, 143, 112), customMatrix: child.world });
        
        // Modify the local matrix currently within the matrix stack (even if it has already been popped).
        rapid.matrix.identity(orbit.local);
        rapid.matrix.rotate(orbit.local, time + Math.PI/2); // Rotate it a little more.
        rapid.matrix.translate(orbit.local, 48, 0);
        // `updateMatrixSubtree` lets the modified `orbit.local` matrix affect all downstream matrices in its subtree.
        stack.updateMatrixSubtree(orbit);

        // The orbit's local matrix affects both the orbit's world matrix and the child's world matrix.
        // Render the circles affected by the local matrix (they are a brighter red).
        rapid.drawCircle({ radius: 10, color: Color.Red, customMatrix: orbit.world });
        rapid.drawCircle({ radius: 10, color: Color.Red, customMatrix: child.world });
        rapid.flush();

        //==== Custom matrices ====//

        for (let row = 0; row < 2; row++) {
            for (let column = 0; column < 3; column++) {
                const wave = Math.sin(time * 2 + (column + row) * 0.7);
                // If you wish, you don't have to use the matrix stack
                // you can manage your own matrices.
                const slot = rapid.matrix.alloc();
                rapid.matrix.identity(slot);
                rapid.matrix.translate(slot, 300 + column * 60, 215 + row * 55);
                rapid.matrix.rotate(slot, wave * 0.8);
                rapid.matrix.scale(slot, 0.42 + wave * 0.06, 0.42 + wave * 0.06);
                rapid.matrix.translate(slot, -32, -32);
                rapid.drawSprite({ texture: toycar, customMatrix: slot });
            }
        }

        rapid.flush();
    });
}
