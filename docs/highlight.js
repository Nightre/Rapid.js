import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

hljs.registerAliases(["sh", "shell"], { languageName: "bash" });
hljs.registerAliases(["js"], { languageName: "javascript" });
hljs.registerAliases(["ts"], { languageName: "typescript" });
hljs.registerAliases(["html"], { languageName: "xml" });

export const highlightCodeBlock = (target) => {
  if (!target) return;
  hljs.highlightElement(target);
};

export const highlightCodeBlocks = (root) => {
  for (const block of root.querySelectorAll("pre code")) {
    highlightCodeBlock(block);
  }
};
