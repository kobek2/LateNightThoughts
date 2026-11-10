import "server-only";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import type { StoredComment, StoredReaction } from "./types";

const pathname = "blog/activity.json";

export type Activity = {
  comments: StoredComment[];
  reactions: StoredReaction[];
};

export class StoreWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreWriteError";
  }
}

export function activityRemote() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export function isActivityConflict(error: unknown) {
  return error instanceof BlobPreconditionFailedError;
}

export async function readRemoteActivity(): Promise<(Activity & { etag: string }) | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text) as Partial<Activity>;
  if (!parsed || !Array.isArray(parsed.comments) || !Array.isArray(parsed.reactions)) {
    throw new StoreWriteError("Saved comments could not be read.");
  }
  return {
    comments: parsed.comments,
    reactions: parsed.reactions,
    etag: result.blob.etag,
  };
}

export async function writeRemoteActivity(activity: Activity, etag: string | null) {
  try {
    await put(pathname, JSON.stringify(activity), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      ...(etag ? { ifMatch: etag } : {}),
    });
  } catch (error) {
    if (isActivityConflict(error)) throw error;
    throw new StoreWriteError("Comments could not be saved on the live site.");
  }
}
