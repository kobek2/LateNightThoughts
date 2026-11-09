import "server-only";
import { timingSafeEqual } from "crypto";

export function passphraseRequired() {
  return Boolean(process.env.BLOG_PASSPHRASE);
}

export function isAuthorized(pass: string) {
  const expected = process.env.BLOG_PASSPHRASE || "";
  if (!expected) return true;
  return safeEqual(pass, expected);
}

function safeEqual(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
