import { averageMetric, getMetric, isPositiveNumber } from "./metrics.js";

export function drawBenchmarkChart(canvas, options, output = {}) {
    const {
        counts,
        renderers,
        results,
        getName,
        formatCount,
        background,
        metric = "fps",
    } = options;
    const metricConfig = getMetric(metric);
    const ctx = canvas.getContext("2d");
    const isExport = Number.isFinite(output.width) && Number.isFinite(output.height);
    const dpr = isExport ? 1 : window.devicePixelRatio || 1;
    const width = isExport ? output.width : canvas.clientWidth || canvas.width;
    const height = isExport ? output.height : canvas.clientHeight || canvas.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const unit = Math.max(0.62, Math.min(3, Math.min(width / 1280, height / 640)));
    const requestedFontSize = Number(output.fontSize);
    const fontSize = isExport && Number.isFinite(requestedFontSize) && requestedFontSize > 0
        ? requestedFontSize
        : 14 * unit;
    const legend = layoutLegend(ctx, width, renderers, getName, unit, fontSize);
    const pad = {
        left: Math.max(82 * unit, 5.5 * fontSize),
        right: 28 * unit,
        top: 30 * unit + legend.height,
        bottom: Math.max(92 * unit, 5.6 * fontSize),
    };
    const plotWidth = Math.max(1, width - pad.left - pad.right);
    const plotHeight = Math.max(1, height - pad.top - pad.bottom);
    const values = renderers.flatMap((renderer) => counts
        .map((count) => averageMetric(results[renderer.id].get(count), metric))
        .filter(isPositiveNumber));
    const yScale = createLinearScale(values, metricConfig.fallbackMax);
    const xScale = createLogPosition(counts[0], counts.at(-1));

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx, {
        width,
        height,
        unit,
        fontSize,
        pad,
        plotWidth,
        plotHeight,
        yScale,
        xScale,
        counts,
        formatCount,
        metricConfig,
    });
    drawLines(ctx, {
        unit,
        pad,
        plotWidth,
        plotHeight,
        yScale,
        xScale,
        counts,
        renderers,
        results,
        metric,
    });
    drawLegend(ctx, legend, fontSize);
}

function drawGrid(ctx, options) {
    const {
        width,
        height,
        unit,
        fontSize,
        pad,
        plotWidth,
        plotHeight,
        yScale,
        xScale,
        counts,
        formatCount,
        metricConfig,
    } = options;
    ctx.lineWidth = Math.max(1, unit);
    ctx.fillStyle = "#5a6877";
    ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (const value of yScale.ticks) {
        const y = pad.top + plotHeight - yScale.position(value) * plotHeight;
        ctx.strokeStyle = "#d7ecdf";
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(width - pad.right, y);
        ctx.stroke();
        ctx.fillText(formatAxisValue(value), pad.left - Math.max(12 * unit, 0.8 * fontSize), y);
    }

    const labelIndices = getVisibleLabelIndices(
        counts,
        (value) => pad.left + xScale.position(value) * plotWidth,
        Math.max(62 * unit, 4.4 * fontSize),
    );
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let index = 0; index < counts.length; index++) {
        if (!labelIndices.has(index)) continue;
        const count = counts[index];
        const x = pad.left + xScale.position(count) * plotWidth;
        ctx.strokeStyle = "#d7ecdf";
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + plotHeight);
        ctx.stroke();

        ctx.save();
        ctx.translate(x, pad.top + plotHeight + Math.max(14 * unit, fontSize));
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "right";
        ctx.fillText(formatCount(count), 0, 0);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(Math.max(18 * unit, 1.3 * fontSize), pad.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.fillText(metricConfig.axisLabel, 0, 0);
    ctx.restore();
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
        "Sprite Count (log scale)",
        pad.left + plotWidth / 2,
        height - Math.max(16 * unit, fontSize),
    );
}

function drawLines(ctx, options) {
    const {
        unit,
        pad,
        plotWidth,
        plotHeight,
        yScale,
        xScale,
        counts,
        renderers,
        results,
        metric,
    } = options;
    const ordered = [...renderers].sort((a, b) => {
        if (a.id === "rapid") return 1;
        if (b.id === "rapid") return -1;
        return 0;
    });

    for (const renderer of ordered) {
        const points = counts
            .map((count) => ({
                count,
                value: averageMetric(results[renderer.id].get(count), metric),
            }))
            .filter((point) => isPositiveNumber(point.value))
            .map((point) => ({
                x: pad.left + xScale.position(point.count) * plotWidth,
                y: pad.top + plotHeight - yScale.position(point.value) * plotHeight,
            }));
        if (!points.length) continue;

        ctx.strokeStyle = renderer.color;
        ctx.lineWidth = 5.5 * unit;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        ctx.fillStyle = renderer.color;
        for (const point of points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4.5 * unit, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function layoutLegend(ctx, width, renderers, getName, unit, fontSize) {
    const items = [];
    const left = 24 * unit;
    const right = width - 24 * unit;
    const rowHeight = Math.max(24 * unit, 1.7 * fontSize);
    const firstRowY = Math.max(18 * unit, fontSize);
    let x = left;
    let row = 0;

    for (const renderer of renderers) {
        const name = getName(renderer);
        ctx.font = `${renderer.id === "rapid" ? "1000" : "650"} ${fontSize}px system-ui, sans-serif`;
        const itemWidth = ctx.measureText(name).width + 3.5 * fontSize;
        if (x > left && x + itemWidth > right) {
            row++;
            x = left;
        }
        items.push({ renderer, name, x, y: firstRowY + row * rowHeight });
        x += itemWidth;
    }

    return { items, height: (row + 1) * rowHeight };
}

function drawLegend(ctx, legend, fontSize) {
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    for (const { renderer, name, x, y } of legend.items) {
        ctx.fillStyle = renderer.color;
        ctx.fillRect(x, y - 0.43 * fontSize, 1.3 * fontSize, 0.86 * fontSize);
        ctx.fillStyle = "#243142";
        ctx.font = `${renderer.id === "rapid" ? "1000" : "650"} ${fontSize}px system-ui, sans-serif`;
        ctx.fillText(name, x + 1.8 * fontSize, y);
    }
}

function createLinearScale(rawValues, fallbackMax) {
    const values = rawValues.filter(isPositiveNumber);
    const rawMax = values.length ? Math.max(...values) * 1.08 : fallbackMax;
    const step = createLinearStep(rawMax / 5);
    const max = Math.max(step, Math.ceil(rawMax / step) * step);
    const ticks = Array.from(
        { length: Math.round(max / step) + 1 },
        (_value, index) => index * step,
    );

    return {
        ticks,
        position(value) {
            return Math.min(max, Math.max(0, value)) / max;
        },
    };
}

function createLinearStep(value) {
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    let factor = 10;
    if (normalized <= 1) factor = 1;
    else if (normalized <= 2) factor = 2;
    else if (normalized <= 2.5) factor = 2.5;
    else if (normalized <= 5) factor = 5;
    return factor * magnitude;
}

function createLogPosition(min, max) {
    const logMin = Math.log10(min);
    const logRange = Math.max(Number.EPSILON, Math.log10(max) - logMin);
    return {
        position(value) {
            const bounded = Math.min(max, Math.max(min, value));
            return (Math.log10(bounded) - logMin) / logRange;
        },
    };
}

function getVisibleLabelIndices(values, getX, minimumSpacing) {
    const visible = new Set([0]);
    let lastX = getX(values[0]);
    for (let index = 1; index < values.length - 1; index++) {
        const x = getX(values[index]);
        if (x - lastX >= minimumSpacing) {
            visible.add(index);
            lastX = x;
        }
    }
    const finalIndex = values.length - 1;
    if (finalIndex > 0) {
        const finalX = getX(values[finalIndex]);
        const previousIndex = [...visible].at(-1);
        if (previousIndex > 0 && finalX - getX(values[previousIndex]) < minimumSpacing) {
            visible.delete(previousIndex);
        }
        visible.add(finalIndex);
    }
    return visible;
}

function formatAxisValue(value) {
    if (value === 0) return "0";
    if (value >= 1000000) return `${value / 1000000}m`;
    if (value >= 1000) return `${value / 1000}k`;
    if (value >= 1) return Number.isInteger(value) ? String(value) : value.toFixed(1);
    return String(Number(value.toPrecision(3)));
}
