import { site } from "./site";

export function readingMinutes(body: string) {
  const words = wordCount(body);
  return Math.max(1, Math.round(words / 230));
}

export function titleScale(title: string) {
  const length = title.trim().length;
  if (length > 90) return "title-long";
  if (length > 42) return "title-medium";
  return "title-short";
}

export function excerptScale(excerpt: string) {
  const length = excerpt.trim().length;
  if (length > 220) return "excerpt-long";
  if (length > 90) return "excerpt-medium";
  return "excerpt-short";
}

export function wordCount(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: site.timeZone,
  }).format(new Date(iso));
}

export function plainExcerpt(body: string, max = 180) {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\[\]()`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function safeHref(href?: string) {
  if (!href) return undefined;
  if (/^(https?:|mailto:|\/|#)/i.test(href)) return href;
  return undefined;
}
