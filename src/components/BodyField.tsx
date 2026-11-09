"use client";

import { forwardRef, memo, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { wordCount } from "@/lib/format";
import { htmlToMarkdown, markdownToHtml, normalizeEditor, normalizeUrl } from "@/lib/richText";

type FormatKind = "bold" | "italic" | "heading" | "quote" | "list" | "steps" | "link";
type Active = Record<"bold" | "italic" | "heading" | "quote" | "list" | "steps", boolean>;

type SurfaceHandle = {
  element: HTMLDivElement | null;
  load: (markdown: string) => void;
};

const actions: { kind: FormatKind; label: string; shortcut?: string }[] = [
  { kind: "bold", label: "Bold", shortcut: "⌘B" },
  { kind: "italic", label: "Italic", shortcut: "⌘I" },
  { kind: "heading", label: "Heading" },
  { kind: "quote", label: "Quote" },
  { kind: "list", label: "List" },
  { kind: "steps", label: "Steps" },
  { kind: "link", label: "Link", shortcut: "⌘K" },
];

const emptyActive: Active = {
  bold: false,
  italic: false,
  heading: false,
  quote: false,
  list: false,
  steps: false,
};

export function BodyField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const surface = useRef<SurfaceHandle>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const onChangeRef = useRef(onChange);
  const handlers = useRef({ onInput: () => {}, onCommand: (_kind: FormatKind) => {} });
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [active, setActive] = useState<Active>(emptyActive);
  onChangeRef.current = onChange;
  handlers.current = { onInput: publishMarkdown, onCommand: apply };

  useLayoutEffect(() => {
    surface.current?.load(value);
  }, [value]);

  useEffect(() => {
    const onSelection = () => setActive(readActive(surface.current?.element ?? null));
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  useEffect(() => {
    if (linkUrl !== null) linkRef.current?.focus();
  }, [linkUrl]);

  function publishMarkdown() {
    const root = surface.current?.element;
    if (!root || !surface.current) return "";
    const markdown = htmlToMarkdown(root);
    surface.current.load(markdown);
    onChangeRef.current(markdown);
    setActive(readActive(root));
    return markdown;
  }

  function apply(kind: FormatKind) {
    const root = surface.current?.element;
    if (!root) return;
    root.focus();
    document.execCommand("defaultParagraphSeparator", false, "p");
    normalizeEditor(root);
    if (!root.innerHTML.trim()) root.innerHTML = "<p><br></p>";
    const selected = window.getSelection()?.anchorNode ?? null;
    const block = selected ? blockElement(selected, root) : null;
    if (kind === "bold") document.execCommand("bold");
    else if (kind === "italic") document.execCommand("italic");
    else if (kind === "heading") document.execCommand("formatBlock", false, block?.tagName === "H2" ? "p" : "h2");
    else if (kind === "quote") {
      document.execCommand("formatBlock", false, block?.closest("blockquote") ? "p" : "blockquote");
    } else if (kind === "list") document.execCommand("insertUnorderedList");
    else if (kind === "steps") document.execCommand("insertOrderedList");
    else {
      savedRange.current = currentRange(root);
      const anchor = anchorFromSelection(root);
      setLinkUrl(anchor?.getAttribute("href") ?? "https://");
      return;
    }
    publishMarkdown();
  }

  function commitLink() {
    const root = surface.current?.element;
    if (!root || linkUrl === null) return;
    const url = normalizeUrl(linkUrl);
    root.focus();
    const selection = window.getSelection();
    const range = savedRange.current;
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    if (!url) document.execCommand("unlink");
    else if (selection?.isCollapsed) {
      const label = url.replace(/^https?:\/\//, "");
      document.execCommand("insertHTML", false, `<a href="${escapeAttr(url)}">${escapeText(label)}</a>`);
    } else document.execCommand("createLink", false, url);
    setLinkUrl(null);
    publishMarkdown();
  }

  return (
    <div className="field">
      <div className="section-head">
        <span className="label">Body</span>
      </div>
      <div className="format-bar" role="toolbar" aria-label="Body formatting">
        {actions.map((action) => (
          <button
            key={action.kind}
            type="button"
            className={`format-${action.kind}${action.kind !== "link" && active[action.kind] ? " is-active" : ""}`}
            title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            aria-label={action.label}
            aria-pressed={action.kind === "link" ? undefined : active[action.kind]}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => apply(action.kind)}
          >
            {action.label}
          </button>
        ))}
      </div>
      {linkUrl !== null && (
        <div className="link-bar">
          <label>
            <span>Link address</span>
            <input
              ref={linkRef}
              className="line-input"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitLink();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setLinkUrl(null);
                  surface.current?.element?.focus();
                }
              }}
              placeholder="https://"
              aria-label="Link address"
            />
          </label>
          <button type="button" className="button secondary" onClick={commitLink}>
            Add link
          </button>
        </div>
      )}
      <div className="editor-frame">
        {!value.trim() && <span className="editor-placeholder">Write the argument.</span>}
        <WritingSurface ref={surface} initial={value} handlers={handlers} />
        <textarea className="editor-fallback" value={value} required tabIndex={-1} aria-hidden="true" onChange={() => undefined} />
      </div>
      <p className="word-count">
        {wordCount(value)} {wordCount(value) === 1 ? "word" : "words"}
      </p>
    </div>
  );
}

const WritingSurface = memo(
  forwardRef<SurfaceHandle, { initial: string; handlers: RefObject<{ onInput: () => void; onCommand: (kind: FormatKind) => void }> }>(
    function WritingSurface({ initial, handlers }, forwarded) {
      const ref = useRef<HTMLDivElement>(null);
      const emitted = useRef(initial);

      useLayoutEffect(() => {
        if (ref.current) ref.current.innerHTML = markdownToHtml(emitted.current);
      }, []);

      useImperativeHandle(forwarded, () => ({
        get element() {
          return ref.current;
        },
        load(markdown: string) {
          if (markdown === emitted.current) return;
          emitted.current = markdown;
          const root = ref.current;
          if (!root || root.contains(document.activeElement)) return;
          root.innerHTML = markdownToHtml(markdown);
        },
      }));

      return (
        <div
          ref={ref}
          className="editor-surface"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Body"
          suppressContentEditableWarning
          onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
          onInput={() => {
            if (ref.current) normalizeEditor(ref.current);
            handlers.current.onInput();
          }}
          onKeyDown={(event) => {
            const command = event.metaKey || event.ctrlKey;
            if (!command) return;
            const key = event.key.toLowerCase();
            if (key === "b" || key === "i" || key === "k") {
              event.preventDefault();
              handlers.current.onCommand(key === "b" ? "bold" : key === "i" ? "italic" : "link");
            } else if (key === "enter") {
              event.preventDefault();
              event.currentTarget.closest("form")?.requestSubmit();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, markdownToHtml(text) || escapeText(text));
            handlers.current.onInput();
          }}
        />
      );
    },
  ),
  () => true,
);

function readActive(root: HTMLElement | null): Active {
  if (!root) return emptyActive;
  const selection = window.getSelection();
  if (!selection?.anchorNode || !root.contains(selection.anchorNode)) return emptyActive;
  const block = blockElement(selection.anchorNode, root);
  return {
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    heading: block?.tagName === "H2",
    quote: Boolean(block?.closest("blockquote")),
    list: Boolean(block?.closest("ul")),
    steps: Boolean(block?.closest("ol")),
  };
}

function blockElement(node: Node, root: HTMLElement) {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current instanceof HTMLElement && current.parentElement === root) return current;
    current = current.parentNode;
  }
  return null;
}

function currentRange(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !root.contains(selection.anchorNode)) {
    return null;
  }
  return selection.getRangeAt(0).cloneRange();
}

function anchorFromSelection(root: HTMLElement) {
  const selection = window.getSelection();
  const node = selection?.anchorNode;
  if (!node || !root.contains(node)) return null;
  const element = node instanceof HTMLElement ? node : node.parentElement;
  return element?.closest("a") ?? null;
}

function escapeText(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string) {
  return escapeText(text).replace(/"/g, "&quot;");
}
