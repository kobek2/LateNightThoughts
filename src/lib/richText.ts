export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(lines[index]);
    if (heading) {
      blocks.push(`<h2>${inlineToHtml(heading[2])}</h2>`);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(lines[index])) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(`<li>${inlineToHtml(lines[index].replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(lines[index])) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${inlineToHtml(lines[index].replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (/^>\s?/.test(lines[index])) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(inlineToHtml(lines[index].replace(/^>\s?/, "")));
        index += 1;
      }
      blocks.push(`<blockquote><p>${quote.join("<br>")}</p></blockquote>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(inlineToHtml(lines[index]));
      index += 1;
    }
    blocks.push(`<p>${paragraph.join("<br>")}</p>`);
  }

  return blocks.join("");
}

export function htmlToMarkdown(root: HTMLElement): string {
  const blocks: string[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\u00a0/g, " ").trim();
      if (text) blocks.push(escapeInline(text));
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName;
    if (tag === "H1" || tag === "H2" || tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
      const text = inlineToMarkdown(node).trim();
      if (text) blocks.push(`## ${text}`);
      return;
    }
    if (tag === "BLOCKQUOTE") {
      const text = inlineToMarkdown(node).trim();
      if (text) blocks.push(text.split("\n").map((line) => `> ${line}`).join("\n"));
      return;
    }
    if (tag === "UL") {
      const items = directItems(node)
        .map((item) => `- ${inlineToMarkdown(item).trim()}`)
        .filter((item) => item !== "-");
      if (items.length) blocks.push(items.join("\n"));
      return;
    }
    if (tag === "OL") {
      const items = directItems(node)
        .map((item, itemIndex) => `${itemIndex + 1}. ${inlineToMarkdown(item).trim()}`)
        .filter((item) => !/^\d+\.\s*$/.test(item));
      if (items.length) blocks.push(items.join("\n"));
      return;
    }
    const text = inlineToMarkdown(node).trim();
    if (text) blocks.push(text);
  });
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

const blockTags = new Set(["P", "H1", "H2", "H3", "H4", "DIV", "BLOCKQUOTE", "UL", "OL", "LI"]);

export function normalizeEditor(root: HTMLElement) {
  if (!needsBlocks(root)) return;
  const offsets = selectionOffsets(root);
  const paragraphs = splitInlines(root);
  root.replaceChildren();
  for (const fragment of paragraphs) {
    const paragraph = document.createElement("p");
    paragraph.append(fragment);
    if (!paragraph.textContent) paragraph.append(document.createElement("br"));
    root.append(paragraph);
  }
  if (offsets) restoreOffsets(root, offsets.start, offsets.end);
}

function needsBlocks(root: HTMLElement) {
  const children = [...root.childNodes];
  if (children.length === 0) return false;
  return children.some((node) => {
    if (node.nodeType === Node.TEXT_NODE) return /\S|\n/.test(node.textContent ?? "");
    if (!(node instanceof HTMLElement)) return false;
    if (node.tagName === "BR") return true;
    return !blockTags.has(node.tagName);
  });
}

function splitInlines(root: HTMLElement) {
  const paragraphs: DocumentFragment[] = [];
  let current = document.createDocumentFragment();
  const flush = () => {
    paragraphs.push(current);
    current = document.createDocumentFragment();
  };
  for (const node of [...root.childNodes]) {
    if (node instanceof HTMLElement && node.tagName === "BR") {
      flush();
      continue;
    }
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").includes("\n")) {
      const parts = (node.textContent ?? "").split("\n");
      parts.forEach((part, index) => {
        if (part) current.append(document.createTextNode(part));
        if (index < parts.length - 1) flush();
      });
      continue;
    }
    current.append(node);
  }
  flush();
  return paragraphs.filter((fragment, index) => fragment.childNodes.length > 0 || index < paragraphs.length - 1);
}

function selectionOffsets(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !root.contains(selection.anchorNode)) return null;
  const range = selection.getRangeAt(0);
  return {
    start: offsetWithin(root, range.startContainer, range.startOffset),
    end: offsetWithin(root, range.endContainer, range.endOffset),
  };
}

function offsetWithin(root: HTMLElement, container: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(container, offset);
  return range.toString().length;
}

function restoreOffsets(root: HTMLElement, start: number, end: number) {
  const startPoint = pointAt(root, start);
  const endPoint = pointAt(root, end);
  if (!startPoint || !endPoint) return;
  const range = document.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function pointAt(root: HTMLElement, target: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = target;
  let node = walker.nextNode();
  let last: Text | null = null;
  while (node) {
    const text = node as Text;
    const length = text.textContent?.length ?? 0;
    if (remaining <= length) return { node: text, offset: remaining };
    remaining -= length;
    last = text;
    node = walker.nextNode();
  }
  return last ? { node: last, offset: last.textContent?.length ?? 0 } : null;
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "https://" || trimmed === "http://") return "";
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

function isBlockStart(line: string) {
  return /^(#{1,6})\s+/.test(line) || /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line) || /^>\s?/.test(line);
}

function inlineToHtml(text: string): string {
  let html = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] === "\\" && index + 1 < text.length) {
      html += escapeHtml(text[index + 1]);
      index += 2;
      continue;
    }
    if (text.startsWith("**", index) || text.startsWith("__", index)) {
      const marker = text.slice(index, index + 2);
      const end = text.indexOf(marker, index + 2);
      if (end !== -1) {
        html += `<strong>${inlineToHtml(text.slice(index + 2, end))}</strong>`;
        index = end + 2;
        continue;
      }
    }
    if ((text[index] === "_" || text[index] === "*") && text[index + 1] !== text[index]) {
      const end = text.indexOf(text[index], index + 1);
      if (end > index + 1) {
        html += `<em>${inlineToHtml(text.slice(index + 1, end))}</em>`;
        index = end + 1;
        continue;
      }
    }
    if (text[index] === "[") {
      const match = /^\[([^\[\]]+)\]\(([^)\s]+)\)/.exec(text.slice(index));
      if (match) {
        const href = normalizeUrl(match[2]);
        html += href
          ? `<a href="${escapeHtml(href)}">${inlineToHtml(match[1])}</a>`
          : inlineToHtml(match[1]);
        index += match[0].length;
        continue;
      }
    }
    html += escapeHtml(text[index]);
    index += 1;
  }
  return html;
}

function inlineToMarkdown(node: Node): string {
  let markdown = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      markdown += escapeInline((child.textContent ?? "").replace(/\u00a0/g, " "));
      return;
    }
    if (!(child instanceof HTMLElement)) return;
    const tag = child.tagName;
    if (tag === "STRONG" || tag === "B") {
      const inner = inlineToMarkdown(child);
      markdown += inner.trim() ? `**${inner}**` : inner;
      return;
    }
    if (tag === "EM" || tag === "I") {
      const inner = inlineToMarkdown(child);
      markdown += inner.trim() ? `_${inner}_` : inner;
      return;
    }
    if (tag === "A") {
      const href = child.getAttribute("href") ?? "";
      const label = inlineToMarkdown(child).trim() || href;
      markdown += href ? `[${label}](${href})` : label;
      return;
    }
    if (tag === "BR") {
      markdown += "\n";
      return;
    }
    markdown += inlineToMarkdown(child);
  });
  return markdown;
}

function directItems(list: HTMLElement) {
  return [...list.children].filter((child): child is HTMLElement => child.tagName === "LI");
}

function escapeInline(text: string) {
  return text.replace(/[\\*_[\]]/g, "\\$&");
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
