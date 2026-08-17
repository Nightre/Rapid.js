const select = document.querySelector("#home-demo-select");
const copyButton = document.querySelector("[data-copy-target]");
const features = document.querySelector("#features");
const demoStack = document.querySelector(".hero-demo-stack");

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

if (select) {
  select.replaceChildren();
  select.disabled = true;
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
