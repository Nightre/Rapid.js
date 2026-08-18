import { demoOrder, demos, mountDemo, renderDemoCode } from "./demos.js";

const select = document.querySelector("#home-demo-select");
const canvas = document.querySelector("#home-demo-canvas");
const code = document.querySelector("#home-demo-code");
const copyButton = document.querySelector("[data-copy-target]");
const features = document.querySelector("#features");
const demoStack = document.querySelector(".hero-demo-stack");

let cleanupDemo = () => {};

const syncHomeCodeHeight = () => {
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

const chooseDemo = (id) => {
  const demo = demos[id] ?? demos.toycar;
  cleanupDemo();
  cleanupDemo = mountDemo(canvas);
  renderDemoCode(code, demo.source);
  requestAnimationFrame(syncHomeCodeHeight);
};

if (select && canvas && code) {
  select.replaceChildren();

  for (const id of demoOrder) {
    const demo = demos[id];
    const option = document.createElement("option");
    option.value = demo.id;
    option.textContent = demo.title;
    select.append(option);
  }

  select.value = "toycar";
  select.disabled = demoOrder.length <= 1;
  chooseDemo(select.value);
  select.addEventListener("change", () => chooseDemo(select.value));
  window.addEventListener("beforeunload", () => cleanupDemo(), { once: true });
}

window.addEventListener("resize", syncHomeCodeHeight);

if (features && "ResizeObserver" in window) {
  const observer = new ResizeObserver(syncHomeCodeHeight);
  observer.observe(features);
  window.addEventListener("beforeunload", () => observer.disconnect(), { once: true });
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
