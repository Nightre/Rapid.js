import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default function (rapid, { loop }) {
    const displayWidth = 480;
    const displayHeight = 300;
    const minimumLogicWidth = 160;

    const canvasWidth = parseInt(rapid.canvas.style.width);
    const canvasHeight = parseInt(rapid.canvas.style.height);

    const title = rapid.texture.createTextTexture({
        text: "Text Resolution Test",
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
        fontWeight: "bold",
        fill: "#243142",
        align: "center",
    });

    const sample = rapid.texture.createTextTexture({
        text: "中文こにちは The quick brown fox 0123456789",
        fontFamily: "Arial, sans-serif",
        fontSize: 8,
        fill: "#102a43",
        align: "center",
    });

    const modeLabel = rapid.texture.createTextTexture({
        text: "",
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        fontWeight: "bold",
        fill: "#13795b",
        align: "center",
    });

    const readout = rapid.texture.createTextTexture({
        text: "",
        fontFamily: "monospace",
        fontSize: 9,
        fill: "#52606d",
        align: "center",
    });

    const easeInOut = (value) => (1 - Math.cos(value * Math.PI)) / 2;

    loop((time) => {
        const phase = time % 8;
        const resizingLogic = phase >= 4;
        const phaseProgress = (phase % 4) / 4;
        const pulse = easeInOut(phaseProgress < 0.5
            ? phaseProgress * 2
            : (1 - phaseProgress) * 2);

        const spriteScale = resizingLogic ? 1 : 1 + pulse * 7;
        const logicWidth = resizingLogic
            ? displayWidth - pulse * (displayWidth - minimumLogicWidth)
            : displayWidth;
        const logicHeight = logicWidth * displayHeight / displayWidth;

        // Clear first so resize's resolution change remains visible to text
        // textures drawn during this frame.
        rapid.clear();
        rapid.resize(logicWidth, logicHeight, canvasWidth, canvasHeight);

        const centerX = rapid.width / 2;
        const centerY = rapid.height / 2;

        modeLabel.text = resizingLogic
            ? "2 / 2  Smaller logical size → higher resolution"
            : "1 / 2  Scale up tiny 8px text";
        rapid.drawRect({
            x: 18,
            y: centerY - 34,
            width: rapid.width - 36,
            height: 68,
            color: Color.fromHex("#e8f5f1"),
        });

        rapid.drawSprite({
            texture: title,
            x: centerX,
            y: 28,
        });
        rapid.drawSprite({
            texture: modeLabel,
            x: centerX,
            y: 55,
        });
        rapid.drawSprite({
            texture: sample,
            x: centerX,
            y: centerY,
            scale: spriteScale,
        });

        // Drawing the sample updates its adaptive texture resolution, so the
        // readout below reports the value used by this exact frame.
        readout.text = [
            `scale ${spriteScale.toFixed(2)}x   logicalSize ${Math.round(logicWidth)} × ${Math.round(logicHeight)}`,
            `viewport ${rapid.viewport.resolution.toFixed(2)}x   text texture ${sample.resolution.toFixed(2)}x`,
        ].join("\n");
        rapid.drawSprite({
            texture: readout,
            x: centerX,
            y: rapid.height - 38,
        });

        rapid.flush();
    });

    return () => {
        rapid.resize(displayWidth, displayHeight, canvasWidth, canvasHeight);
        title.destroy();
        sample.destroy();
        modeLabel.destroy();
        readout.destroy();
    };
}
