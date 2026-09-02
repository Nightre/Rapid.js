import { highlightCodeBlocks } from "./highlight.js";
import markdownEn from "./markdown/index.js";
import markdownCn from "./markdown_cn/index.js";

const chapters = [
  { id: "overview", title: "Overview", file: "guide.md", icon: "./image/docs.png" },
  { id: "installation", title: "Installation", file: "install.md", icon: "./image/install.png" },
  { id: "quick-start", title: "Quick Start", file: "quick-start.md", icon: "./image/quick-start.png" },
  { id: "textures", title: "Textures", file: "textures.md", icon: "./image/texture.png" },
  { id: "sprite", title: "Sprite", file: "sprite.md", icon: "./image/sprite.png" },
  { id: "transformations", title: "Transformations", file: "transformations.md", icon: "./image/transformation.png" },
  { id: "screen-position", title: "Screen Position", file: "screen-position.md", icon: "./image/screen-position.png" },
  { id: "shaders", title: "Custom Shaders", file: "shaders.md", icon: "./image/shader.png" },

  { id: "custom-geometry", title: "Custom Geometry", file: "custom-geometry.md", icon: "./image/polygon.png" },
  { id: "lines", title: "Lines", file: "line.md", icon: "./image/line.png" },
  { id: "text", title: "Text", file: "text.md", icon: "./image/text.png" },
  { id: "render-textures", title: "Render Textures", file: "render-textures.md", icon: "./image/render-texture.png" },
  { id: "masks", title: "Masks & Clipping", file: "masks.md", icon: "./image/mask.png" },
  { id: "particle-drawing", title: "Particle Drawing", file: "particle-drawing.md", icon: "./image/fast.png" },
  { id: "particle-emitter", title: "Particle Helper", file: "particles.md", icon: "./image/particle.png" },
  { id: "advanced", title: "Advanced Render", file: "advanced.md", icon: "./image/advanced.png" },
];

const MARKDOWN_CONTENT = { en: markdownEn, cn: markdownCn };
const DEFAULT_LANG = "en";
const LANG_STORAGE_KEY = "rapid-docs-lang";

const readStoredLang = () => {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored in MARKDOWN_CONTENT ? stored : DEFAULT_LANG;
};

let currentLang = readStoredLang();
let activeChapter = null;
const chapterCache = { en: {}, cn: {} };

const nav = document.querySelector("#docs-nav");
const target = document.querySelector("#markdown-doc");
const langSelect = document.querySelector("#docs-lang-select");

// The sidebar is position: fixed so it never moves with the page scroll. Two
// things must be measured live and fed to CSS vars so it lines up with the
// layout: the navbar height (varies with logo load / viewport / menu wrap) so
// it parks just below the navbar, and the layout's left edge so the fixed
// sidebar sits exactly over its reserved column.
const navbar = document.querySelector(".navbar");
const layout = document.querySelector(".docs-layout");

const syncLayoutVars = () => {
  const root = document.documentElement.style;
  if (navbar) root.setProperty("--nav-h", `${navbar.offsetHeight}px`);
  if (layout) root.setProperty("--sidebar-left", `${Math.max(layout.getBoundingClientRect().left, 0)}px`);
};

syncLayoutVars();
window.addEventListener("resize", syncLayoutVars);
window.addEventListener("load", syncLayoutVars);
if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(syncLayoutVars);
  if (navbar) observer.observe(navbar);
  if (layout) observer.observe(layout);
}

const backToTop = document.querySelector("#back-to-top");
if (backToTop) {
  const syncBackToTop = () => {
    backToTop.hidden = window.scrollY < 320;
  };
  syncBackToTop();
  window.addEventListener("scroll", syncBackToTop, { passive: true });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener("change", () => {
    const newLang = langSelect.value in MARKDOWN_CONTENT ? langSelect.value : DEFAULT_LANG;
    if (newLang !== currentLang) {
      currentLang = newLang;
      localStorage.setItem(LANG_STORAGE_KEY, currentLang);
      if (activeChapter) loadChapter(activeChapter);
    }
  });
}

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const normalizeCodeLanguage = (value) => {
  const language = value.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return /^[a-z0-9_-]+$/.test(language) ? language : "";
};

const inlineMarkdown = (value) => escapeHtml(value)
  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const renderMarkdown = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines = [];
  let listType = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const openList = (type) => {
    if (listType === type) return;
    closeList();
    html.push(`<${type}>`);
    listType = type;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        const languageClass = codeLanguage ? ` class="language-${codeLanguage}"` : "";
        html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        codeLanguage = "";
        inCode = false;
      } else {
        closeList();
        codeLanguage = normalizeCodeLanguage(line.slice(3));
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      openList("ul");
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      openList("ol");
      html.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s/, ""))}</li>`);
    } else if (line.startsWith("> ")) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  return html.join("\n");
};

const setActiveChapter = (id) => {
  for (const button of nav.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.chapter === id);
  }
};

const loadChapter = (chapter) => {
  activeChapter = chapter;
  setActiveChapter(chapter.id);

  const cached = chapterCache[currentLang][chapter.id];
  if (cached) {
    target.innerHTML = cached.html;
    highlightCodeBlocks(target);
    history.replaceState(null, "", `#${chapter.id}`);
    window.scrollTo(0, 0);
  }
};

const preloadAllChapters = () => {
  for (const lang in MARKDOWN_CONTENT) {
    for (const chapter of chapters) {
      try {
        const markdown = MARKDOWN_CONTENT[lang][chapter.file];
        if (!markdown) throw new Error("Markdown not found");

        const heading = document.createElement("div");
        heading.innerHTML = renderMarkdown(markdown);

        const h1 = heading.querySelector("h1");
        if (h1) {
          const header = document.createElement("header");
          header.className = "doc-chapter-header";

          const icon = document.createElement("img");
          icon.src = chapter.icon;
          icon.alt = `${chapter.title} icon`;
          icon.className = "doc-chapter-icon pixel-art";

          h1.before(header);
          header.append(icon, h1);
        }

        chapterCache[lang][chapter.id] = { html: heading.innerHTML };
      } catch (e) {
        console.error(`Failed to load ${lang}/${chapter.file}:`, e);
      }
    }
  }
};

for (const chapter of chapters) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.chapter = chapter.id;
  button.innerHTML = `<img src="${chapter.icon}" class="pixel-art" alt=""><span>${chapter.title}</span>`;
  button.addEventListener("click", () => loadChapter(chapter));
  nav.append(button);
}

preloadAllChapters();
const initial = chapters.find((chapter) => chapter.id === location.hash.slice(1)) ?? chapters[0];
loadChapter(initial);

window.addEventListener("hashchange", () => {
  const chapter = chapters.find((item) => item.id === location.hash.slice(1));
  if (chapter && chapterCache[currentLang][chapter.id]) loadChapter(chapter);
});
