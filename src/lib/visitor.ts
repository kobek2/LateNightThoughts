import "server-only";
import { cookies } from "next/headers";
import { VISITOR_COOKIE } from "./constants";

const visitorPattern = /^[\w-]{8,80}$/;

export async function getVisitorId() {
  const jar = await cookies();
  const value = jar.get(VISITOR_COOKIE)?.value;
  if (!value || !visitorPattern.test(value)) return null;
  return value;
}

export async function ensureVisitorId() {
  const existing = await getVisitorId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  const jar = await cookies();
  jar.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}
