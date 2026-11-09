import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const STUDIO_COOKIE = "pb_studio";

export function isAuthorized(pass: string) {
  const expected = process.env.BLOG_PASSPHRASE || "";
  if (!expected || !pass) return false;
  return safeEqual(pass, expected);
}

export async function studioOpen() {
  const token = studioToken();
  if (!token) return false;
  const jar = await cookies();
  const given = jar.get(STUDIO_COOKIE)?.value ?? "";
  return safeEqual(given, token);
}

export async function openStudio() {
  const token = studioToken();
  if (!token) return;
  const jar = await cookies();
  jar.set(STUDIO_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function closeStudio() {
  const jar = await cookies();
  jar.delete(STUDIO_COOKIE);
}

function studioToken() {
  const secret = process.env.BLOG_PASSPHRASE || "";
  if (!secret) return "";
  return createHmac("sha256", secret).update("late-night-thoughts-studio").digest("base64url");
}

function safeEqual(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
