import { demoOrder, demos, mountDemo, renderDemoCode } from "./demos.js";

const chartColors = { rapid: "#ff3b67", pixi: "#16b89c", phaser: "#ffb20f", excalibur: "#6b97ec", canvas: "#68747d" };
const packageData = [
  ["rapid", "Rapid.js", 61.9, "61.9 kB"],
  ["phaser", "Phaser", 1380, "1.38 MB"],
  ["pixi", "PixiJS", 798, "798 kB"],
  ["excalibur", "Excalibur", 574, "574 kB"],
];
const multiData = {
  labels: ["500", "1k", "3k", "5k", "10k", "20k", "30k", "40k", "50k", "60k", "70k", "80k", "90k", "100k", "125k", "150k", "175k", "200k", "400k"],
  series: [
    ["Rapid.js", "rapid", [165.3, 164.7, 165.3, 165.3, 165.3, 165.3, 165.3, 139.3, 111.1, 92.3, 80.8, 71.0, 63.2, 57.1, 44.7, 37.7, 31.7, 28.3, 13.9]],
    ["PixiJS", "pixi", [164.7, 165.0, 164.7, 165.3, 165.3, 165.3, 143.7, 115.1, 94.5, 80.7, 67.5, 61.3, 54.6, 44.8, 39.3, 32.9, 26.3, 23.8, 11.3]],
    ["Phaser", "phaser", [165.3, 165.4, 165.3, 165.3, 164.7, 164.3, 152.4, 115.3, 90.3, 74.8, 64.5, 57.7, 51.6, 47.0, 35.9, 30.6, 25.6, 22.4, 11.6]],
    ["Excalibur", "excalibur", [164.7, 164.3, 165.3, 165.3, 165.3, 147.7, 98.7, 74.8, 61.1, 52.5, 46.1, 40.1, 33.1, 31.3, 24.3, 20.7, 17.6, 14.9, 7.8]],
    ["Canvas 2D", "canvas", [165.3, 165.3, 103.2, 58.5, 32.2, 16.3, 11.2, 8.5, null, null, null, null, null, null, null, null, null, null, null]],
  ],
};
const chartSvg = (data) => {
  const width = 620; const height = 290; const left = 52; const right = 16; const top = 22; const bottom = 58; const plotW = width - left - right; const plotH = height - top - bottom;
  const x = (i) => left + i * plotW / (data.labels.length - 1); const y = (v) => top + (180 - v) * plotH / 180;
  const grid = [0, 60, 120, 180].map((v) => `<line class="chart-gridline" x1="${left}" y1="${y(v)}" x2="${width - right}" y2="${y(v)}"/><text class="axis-label" x="4" y="${y(v) + 4}">${v}</text>`).join("");
  const labels = data.labels.map((label, i) => `<text class="x-label" x="${x(i)}" y="${height - 30}" text-anchor="middle">${label}</text>`).join("");
  const series = [...data.series].sort(([, firstKey], [, secondKey]) => (firstKey === "rapid") - (secondKey === "rapid")).map(([label, key, values]) => { const coords = values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean); const lengths = coords.map((point, i) => i === 0 ? 0 : Math.hypot(point[0] - coords[i - 1][0], point[1] - coords[i - 1][1])); const totalLength = lengths.reduce((sum, length) => sum + length, 0); let travelled = 0; const points = coords.map(([px, py]) => `${px},${py}`).join(" "); const dots = coords.map(([px, py], i) => { travelled += lengths[i]; const progress = totalLength ? travelled / totalLength : 0; return `<circle class="line-dot" style="--dot-delay:${0.18 + progress * 2.55}s" cx="${px}" cy="${py}" r="3.7" fill="${chartColors[key]}"/>`; }).join(""); return `<g class="line-series"><polyline class="chart-line" pathLength="1" points="${points}" stroke="${chartColors[key]}"/><g>${dots}</g></g>`; }).join("");
  const legend = data.series.map(([label, key]) => `<span><i style="background:${chartColors[key]}"></i>${label}</span>`).join("");
  return `<div class="chart-legend">${legend}</div><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${grid}${labels}<text class="chart-axis-title" x="15" y="${top + plotH / 2}" text-anchor="middle" transform="rotate(-90 15 ${top + plotH / 2})">FPS</text><text class="chart-axis-title" x="${left + plotW / 2}" y="${height - 5}" text-anchor="middle">Sprite Count</text>${series}</svg>`;
};

const packageChartSvg = () => {
  const max = 1400;
  const width = 560; const height = 250; const left = 82; const bottom = 34; const plotH = 178;
  const bars = packageData.map(([key, label, value, display], index) => {
    const x = left + index * 116; const h = Math.max(7, value / max * plotH); const y = height - bottom - h;
    return `<rect class="package-bar" x="${x}" y="${y}" width="58" height="${h}" fill="${chartColors[key] || "#7bcf8b"}"/><text class="package-label" x="${x + 29}" y="${height - 10}" text-anchor="middle">${label}</text><text class="bar-value" x="${x + 29}" y="${Math.max(18, y - 10)}" text-anchor="middle">${display}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><line class="chart-axis" x1="${left - 12}" y1="${height - bottom}" x2="${width - 15}" y2="${height - bottom}"/><line class="chart-gridline" x1="${left - 12}" y1="${height - bottom - plotH / 2}" x2="${width - 15}" y2="${height - bottom - plotH / 2}"/><text class="axis-label" x="12" y="${height - bottom + 4}">0</text><text class="axis-label" x="8" y="${height - bottom - plotH / 2 + 4}">700k</text><text class="axis-label" x="8" y="${height - bottom - plotH + 4}">1.4M</text>${bars}</svg>`;
};

document.querySelectorAll("[data-chart]").forEach((section) => {
  const packageTarget = section.querySelector(".package-chart");
  const target = section.querySelector(".line-chart");
  if (packageTarget) packageTarget.innerHTML = packageChartSvg();
  if (target) target.innerHTML = chartSvg(multiData);
});

const chartObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    target.classList.add("is-visible");
    observer.unobserve(target);
  });
}, { threshold: 0.28 });
document.querySelectorAll(".reveal-chart").forEach((chart) => chartObserver.observe(chart));

const select = document.querySelector("#home-demo-select");
const code = document.querySelector("#home-demo-code");
const copyButton = document.querySelector("[data-copy-target]");
const features = document.querySelector("#features");
const demoStack = document.querySelector(".hero-demo-stack");

/** Stops whatever demo is currently running. */
let stopDemo = () => {};

/** Matches the code panel's height to the feature list beside it. */
const syncCodeHeight = () => {
  if (!features || !demoStack) return;

  if (!window.matchMedia("(min-width: 992px)").matches) {
    demoStack.style.removeProperty("--home-code-card-height");
    return;
  }

  const height = Math.round(features.getBoundingClientRect().height);
  if (height > 0) {
    demoStack.style.setProperty("--home-code-card-height", `${height}px`);
  }
};

const showDemo = (id) => {
  const demo = demos[id] ?? demos[demoOrder[0]];
  stopDemo();
  stopDemo = mountDemo(demo.id);
  renderDemoCode(code, demo.id);
  requestAnimationFrame(syncCodeHeight);
};

if (select && code) {
  select.replaceChildren(
    ...demoOrder.map((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = demos[id].title;
      return option;
    }),
  );

  select.value = demoOrder[0];
  select.addEventListener("change", () => showDemo(select.value));
  showDemo(select.value);

  window.addEventListener("beforeunload", () => stopDemo(), { once: true });
}

window.addEventListener("resize", syncCodeHeight);

if (features && "ResizeObserver" in window) {
  const observer = new ResizeObserver(syncCodeHeight);
  observer.observe(features);
  window.addEventListener("beforeunload", () => observer.disconnect(), {
    once: true,
  });
}

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const target = document.querySelector(copyButton.dataset.copyTarget);
    const text = target?.textContent?.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1400);
    } catch {
      copyButton.textContent = "Copy";
    }
  });
}
