import { Color } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
    const ms = rapid.matrixStack;

    loop((time) => {
        rapid.clear();

        ms.save();
        
        // 1. Root (Shoulder): Move to center of the screen
        ms.translate(150, 150);
        // Rotate the shoulder back and forth
        ms.rotate(Math.sin(time) * 0.8);
        
        // Draw Upper Arm (extends along local X axis)
        rapid.drawRect({ 
            x: 0, y: -20, width: 100, height: 40, 
            color: new Color(231, 76, 60) 
        });

        // 2. Elbow
        ms.save();
        // Move 90px along local X to place the elbow joint
        ms.translate(90, 0); 
        // Rotate elbow relative to the upper arm
        ms.rotate(Math.sin(time * 1.5) * 1.2 + 0.5);
        
        // Draw Forearm
        rapid.drawRect({ 
            x: 0, y: -15, width: 80, height: 30, 
            color: new Color(46, 204, 113) 
        });

        // 3. Wrist
        ms.save();
        // Move 70px along local X to place the wrist
        ms.translate(70, 0);
        // Rotate hand relative to the forearm
        ms.rotate(Math.sin(time * 2.5) * 1.5);
        
        // Draw Hand
        rapid.drawRect({ 
            x: 0, y: -10, width: 40, height: 20, 
            color: new Color(52, 152, 219) 
        });

        // Restore stack in reverse order
        ms.restore(); // Pop wrist
        ms.restore(); // Pop elbow
        ms.restore(); // Pop shoulder

        rapid.flush();
    });
}
