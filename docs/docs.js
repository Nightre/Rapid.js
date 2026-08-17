const chapters = [
  { id: "overview", title: "Overview", file: "./guide.md", icon: "./image/docs.png" },
  { id: "installation", title: "Installation", file: "./install.md", icon: "./image/install.png" },
  { id: "quick-start", title: "Quick Start", file: "./quick-start.md", icon: "./image/quick-start.png" },
  { id: "architecture", title: "Architecture", file: "./architecture.md", icon: "./image/tree.png" },
  { id: "textures", title: "Textures", file: "./textures.md", icon: "./image/texture.png" },
  { id: "drawing", title: "Drawing", file: "./drawing.md", icon: "./image/draw.png" },
  { id: "transformations", title: "Transformations", file: "./transformations.md", icon: "./image/transformation.png" },
  { id: "custom-geometry", title: "Custom Geometry", file: "./custom-geometry.md", icon: "./image/polygon.png" },
  { id: "lines", title: "Lines", file: "./line.md", icon: "./image/line.png" },
  { id: "text", title: "Text", file: "./text.md", icon: "./image/text.png" },
  { id: "render-textures", title: "Render Textures", file: "./render-textures.md", icon: "./image/render-texture.png" },
  { id: "masks", title: "Masks & Clipping", file: "./masks.md", icon: "./image/mask.png" },
  { id: "particles", title: "Particles", file: "./particles.md", icon: "./image/particle.png" },
  { id: "shaders", title: "Custom Shaders", file: "./shaders.md", icon: "./image/shader.png" },
  { id: "advanced", title: "Advanced", file: "./advanced.md", icon: "./image/advanced.png" },
];

const sidebar = document.querySelector("#docs-sidebar");
const target = document.querySelector("#markdown-doc");

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const inlineMarkdown = (value) => escapeHtml(value)
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const renderMarkdown = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inCode = false;
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
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        closeList();
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
  for (const button of sidebar.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.chapter === id);
  }
};

const loadChapter = async (chapter) => {
  target.textContent = "Loading docs...";
  setActiveChapter(chapter.id);

  try {
    const response = await fetch(chapter.file);
    if (!response.ok) throw new Error("Unable to load Markdown");
    target.innerHTML = renderMarkdown(await response.text());

    const heading = target.querySelector("h1");
    if (heading) {
      const header = document.createElement("header");
      header.className = "doc-chapter-header";

      const icon = document.createElement("img");
      icon.src = chapter.icon;
      icon.alt = `${chapter.title} icon`;
      icon.className = "doc-chapter-icon pixel-art";

      heading.before(header);
      header.append(icon, heading);
    }

    history.replaceState(null, "", `#${chapter.id}`);
  } catch {
    target.textContent = "Unable to load docs.";
  }
};

for (const chapter of chapters) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.chapter = chapter.id;
  button.innerHTML = `<img src="${chapter.icon}" class="pixel-art" alt=""><span>${chapter.title}</span>`;
  button.addEventListener("click", () => loadChapter(chapter));
  sidebar.append(button);
}

const initial = chapters.find((chapter) => chapter.id === location.hash.slice(1)) ?? chapters[0];
loadChapter(initial);

window.addEventListener("hashchange", () => {
  const chapter = chapters.find((item) => item.id === location.hash.slice(1));
  if (chapter) loadChapter(chapter);
});
