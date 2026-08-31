import { demoOrder, demos, mountDemo, renderDemoCode } from "./demos.js";

const select = document.querySelector("#home-demo-select");
const code = document.querySelector("#home-demo-code");
const copyButton = document.querySelector("[data-copy-target]");
const copyButtonLabel = copyButton?.querySelector(".copy-button-label");
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

if (copyButton && copyButtonLabel) {
  copyButton.addEventListener("click", async () => {
    const target = document.querySelector(copyButton.dataset.copyTarget);
    const text = target?.textContent?.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      copyButtonLabel.textContent = "Copied";
      setTimeout(() => {
        copyButtonLabel.textContent = "Copy";
      }, 1400);
    } catch {
      copyButtonLabel.textContent = "Copy";
    }
  });
}
