"use server";

import { revalidatePath } from "next/cache";
import { closeStudio, isAuthorized, openStudio, studioOpen } from "./auth";
import {
  addCommentRecord,
  createPostRecord,
  deleteCommentRecord,
  deletePostRecord,
  setStanceRecord,
  updatePostRecord,
} from "./store";
import type { PostInput, Stance } from "./types";
import { ensureVisitorId, getVisitorId } from "./visitor";

function refreshPost(slug: string | null) {
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/write");
  revalidatePath("/feed.xml");
  if (slug) revalidatePath(`/posts/${slug}`);
}

async function requireStudio() {
  if (!(await studioOpen())) return { error: "The studio passphrase was rejected." } as const;
  return null;
}

export async function unlockStudio(pass: string) {
  if (!isAuthorized(pass)) return { ok: false as const };
  await openStudio();
  return { ok: true as const };
}

export async function lockStudio() {
  await closeStudio();
}

export async function createPost(input: PostInput) {
  const denied = await requireStudio();
  if (denied) return denied;
  const result = createPostRecord(input);
  if ("error" in result) return result;
  refreshPost(result.slug);
  return result;
}

export async function updatePost(id: string, input: PostInput) {
  const denied = await requireStudio();
  if (denied) return denied;
  const result = updatePostRecord(id, input);
  if ("error" in result) return result;
  refreshPost(result.slug);
  return result;
}

export async function deletePost(id: string) {
  const denied = await requireStudio();
  if (denied) return denied;
  const result = deletePostRecord(id);
  if ("error" in result) return result;
  refreshPost(null);
  return result;
}

export async function addComment(input: {
  postId: string;
  takeId: string | null;
  authorName: string;
  body: string;
  company: string;
}) {
  if (input.company.trim()) return { ok: true as const };
  const visitorId = await ensureVisitorId();
  const result = addCommentRecord({
    postId: input.postId,
    takeId: input.takeId,
    authorName: input.authorName,
    body: input.body,
    visitorId,
  });
  if ("error" in result) return result;
  refreshPost(result.slug);
  return { ok: true as const };
}

export async function deleteComment(commentId: string) {
  const visitorId = await getVisitorId();
  const moderator = await studioOpen();
  const result = deleteCommentRecord(commentId, visitorId, moderator);
  if ("error" in result) return result;
  refreshPost(result.slug);
  return { ok: true as const };
}

export async function setStance(takeId: string, stance: Stance) {
  if (stance !== "agree" && stance !== "disagree") {
    return { error: "Choose agree or disagree." };
  }
  const visitorId = await ensureVisitorId();
  const result = setStanceRecord(takeId, visitorId, stance);
  if ("error" in result) return result;
  refreshPost(result.slug);
  return {
    stance: result.stance,
    agree: result.agree,
    disagree: result.disagree,
  };
}
