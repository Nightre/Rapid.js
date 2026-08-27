export function drawBenchmarkChart(canvas, options) {
    const {
        counts,
        renderers,
        results,
        getName,
        formatCount,
        background,
    } = options;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { left: 70, right: 32, top: 36, bottom: 88 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const allFps = renderers.flatMap((renderer) => [...results[renderer.id].values()]);
    const maxFps = Math.max(60, Math.ceil((Math.max(...allFps, 0) + 10) / 10) * 10);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx, { width, height, pad, plotWidth, plotHeight, maxFps, counts, formatCount });
    drawLines(ctx, { pad, plotWidth, plotHeight, maxFps, counts, renderers, results });
    drawLegend(ctx, width, renderers, getName);
}

function drawGrid(ctx, options) {
    const { width, height, pad, plotWidth, plotHeight, maxFps, counts, formatCount } = options;
    ctx.strokeStyle = "#d7ecdf";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#5a6877";
    ctx.font = "800 15px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 5; i++) {
        const value = (maxFps / 5) * i;
        const y = pad.top + plotHeight - (value / maxFps) * plotHeight;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(width - pad.right, y);
        ctx.stroke();
        ctx.fillText(String(Math.round(value)), pad.left - 14, y);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < counts.length; i++) {
        const x = pad.left + (i / (counts.length - 1)) * plotWidth;
        ctx.save();
        ctx.translate(x, pad.top + plotHeight + 16);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "right";
        ctx.fillText(formatCount(counts[i]), 0, 0);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(16, pad.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = "900 16px system-ui, sans-serif";
    ctx.fillText("FPS", 0, 0);
    ctx.restore();
    ctx.fillText("Sprite Count", pad.left + plotWidth / 2, height - 20);
}

function drawLines(ctx, options) {
    const { pad, plotWidth, plotHeight, maxFps, counts, renderers, results } = options;
    const ordered = [...renderers].sort((a, b) => {
        if (a.id === "rapid") return 1;
        if (b.id === "rapid") return -1;
        return 0;
    });

    for (const renderer of ordered) {
        const points = counts
            .filter((count) => results[renderer.id].has(count))
            .map((count) => ({
                x: pad.left + (counts.indexOf(count) / (counts.length - 1)) * plotWidth,
                y: pad.top + plotHeight - (results[renderer.id].get(count) / maxFps) * plotHeight,
            }));
        if (!points.length) continue;

        ctx.strokeStyle = renderer.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        ctx.fillStyle = renderer.color;
        for (const point of points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawLegend(ctx, width, renderers, getName) {
    ctx.textBaseline = "middle";
    let x = width - 24;
    const y = 28;

    for (let i = renderers.length - 1; i >= 0; i--) {
        const renderer = renderers[i];
        const name = getName(renderer);
        ctx.font = `${renderer.id === "rapid" ? "1000" : "650"} 15px system-ui, sans-serif`;
        const textWidth = ctx.measureText(name).width;
        x -= textWidth + 32;
        ctx.fillStyle = renderer.color;
        ctx.fillRect(x, y - 7, 18, 14);
        ctx.fillStyle = "#243142";
        ctx.textAlign = "left";
        ctx.fillText(name, x + 25, y);
        x -= 20;
    }
}
