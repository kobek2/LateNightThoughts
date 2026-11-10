import "server-only";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  activityRemote,
  isActivityConflict,
  readRemoteActivity,
  StoreWriteError,
  writeRemoteActivity,
} from "./activity";
import { plainExcerpt, readingMinutes } from "./format";
import { seedStore } from "./seed";
import type {
  CommentView,
  DraftInput,
  EditorPost,
  PostInput,
  PostSummary,
  PostView,
  Source,
  SourceInput,
  Stance,
  StoreData,
  StoredPost,
  Take,
  TakeView,
} from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

type LoadedStore = StoreData & {
  activityEtag: string | null;
  activityUnreadable: boolean;
};

function fileRecord(store: StoreData): StoreData {
  return {
    posts: store.posts,
    comments: store.comments,
    reactions: store.reactions,
  };
}

function writeFileStore(store: StoreData, purpose: "posts" | "activity") {
  try {
    mkdirSync(dataDir, { recursive: true });
    const tmp = `${dataFile}.tmp`;
    writeFileSync(tmp, JSON.stringify(fileRecord(store), null, 2));
    renameSync(tmp, dataFile);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";
    if (process.env.VERCEL || code === "EROFS" || code === "EACCES" || code === "EPERM") {
      throw new StoreWriteError(
        purpose === "posts"
          ? "Posts can only be published from your computer."
          : "Comments could not be saved on the live site.",
      );
    }
    throw error;
  }
}

function readFileStore(): StoreData {
  mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    const seeded = seedStore();
    try {
      writeFileStore(seeded, "posts");
    } catch (error) {
      if (!(error instanceof StoreWriteError)) throw error;
    }
    return seeded;
  }
  try {
    const parsed = JSON.parse(readFileSync(dataFile, "utf8")) as StoreData;
    if (
      !parsed ||
      !Array.isArray(parsed.posts) ||
      !Array.isArray(parsed.comments) ||
      !Array.isArray(parsed.reactions)
    ) {
      throw new Error("Blog data is missing posts, comments, or reactions.");
    }
    parsed.posts = parsed.posts.map(normalizePost);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Blog data could not be read. Check data/store.json.");
    }
    throw error;
  }
}

async function load(): Promise<LoadedStore> {
  const file = readFileStore();
  if (!activityRemote()) {
    return { ...file, activityEtag: null, activityUnreadable: false };
  }
  try {
    const remote = await readRemoteActivity();
    if (!remote) return { ...file, activityEtag: null, activityUnreadable: false };
    return {
      posts: file.posts,
      comments: remote.comments,
      reactions: remote.reactions,
      activityEtag: remote.etag,
      activityUnreadable: false,
    };
  } catch {
    return { ...file, activityEtag: null, activityUnreadable: true };
  }
}

async function saveActivity(store: LoadedStore) {
  if (!activityRemote()) {
    writeFileStore(store, "activity");
    return;
  }
  if (store.activityUnreadable) {
    throw new StoreWriteError("Comments could not be saved on the live site.");
  }
  await writeRemoteActivity(
    { comments: store.comments, reactions: store.reactions },
    store.activityEtag,
  );
}

async function withActivityRetry<T>(
  run: (store: LoadedStore) => Promise<{ error: string } | T>,
): Promise<{ error: string } | T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const store = await load();
    try {
      return await run(store);
    } catch (error) {
      if (error instanceof StoreWriteError) return { error: error.message };
      if (isActivityConflict(error) && attempt < 2) continue;
      if (isActivityConflict(error)) return { error: "That could not be saved. Try again." };
      throw error;
    }
  }
  return { error: "That could not be saved. Try again." };
}

function savePosts(store: StoreData): { error: string } | null {
  try {
    writeFileStore(store, "posts");
    return null;
  } catch (error) {
    if (error instanceof StoreWriteError) return { error: error.message };
    throw error;
  }
}

function byNewest(a: { createdAt: string }, b: { createdAt: string }) {
  return b.createdAt.localeCompare(a.createdAt);
}

function byOldest(a: { createdAt: string }, b: { createdAt: string }) {
  return a.createdAt.localeCompare(b.createdAt);
}

function cleanLine(input: string) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function slugify(input: string) {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "post";
}

function uniqueSlug(store: StoreData, title: string, exceptId?: string) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (store.posts.some((post) => post.slug === slug && post.id !== exceptId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function normalizePost(post: StoredPost): StoredPost {
  return {
    ...post,
    status: post.status === "draft" ? "draft" : "published",
    sources: Array.isArray(post.sources) ? post.sources : [],
    takes: Array.isArray(post.takes) ? post.takes : [],
    tags: Array.isArray(post.tags) ? post.tags : [],
  };
}

function isPublic(post: StoredPost) {
  return post.status !== "draft";
}

function keepId(id: string | undefined) {
  if (id && /^[\w-]{1,80}$/.test(id)) return id;
  return crypto.randomUUID();
}

function decorate(post: StoredPost, store: StoreData, visitorId: string | null): PostView {
  const takes: TakeView[] = post.takes.map((take) => {
    const related = store.reactions.filter((reaction) => reaction.takeId === take.id);
    const mine = visitorId
      ? related.find((reaction) => reaction.visitorId === visitorId)
      : undefined;
    return {
      ...take,
      agree: related.filter((reaction) => reaction.stance === "agree").length,
      disagree: related.filter((reaction) => reaction.stance === "disagree").length,
      stance: mine?.stance ?? null,
    };
  });

  const comments: CommentView[] = store.comments
    .filter((comment) => comment.postId === post.id)
    .sort(byOldest)
    .map((comment) => ({
      id: comment.id,
      takeId: comment.takeId,
      takeText: post.takes.find((take) => take.id === comment.takeId)?.text ?? null,
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt,
      mine: Boolean(visitorId && comment.visitorId === visitorId),
    }));

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    tags: post.tags,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    readingMinutes: readingMinutes(post.body),
    commentCount: comments.length,
    leadTake: takes[0] ?? null,
    takes,
    sources: post.sources,
    comments,
  };
}

function parseTags(input: string, strict: boolean): { error: string } | { tags: string[] } {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of input.split(",")) {
    const tag = cleanLine(part).replace(/\s+/g, " ");
    if (!tag) continue;
    if (tag.length > 32) {
      if (strict) return { error: "Tags need to be 32 characters or fewer." };
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length > 6) {
      if (strict) return { error: "Use 6 tags or fewer." };
      break;
    }
  }
  return { tags };
}

function parseTakes(
  input: { id?: string; text: string }[],
  strict: boolean,
): { error: string } | { takes: Take[] } {
  const cleaned = input
    .map((take) => ({ id: take.id?.trim(), text: cleanLine(take.text).replace(/\s+/g, " ") }))
    .filter((take) => take.text);
  if (strict && cleaned.length === 0) {
    return {
      error: "Add at least one take. A take is the claim readers can agree or disagree with.",
    };
  }
  if (cleaned.length > 8) {
    if (strict) return { error: "Keep it to 8 takes or fewer." };
    cleaned.length = 8;
  }
  for (const take of cleaned) {
    if (take.text.length > 280) {
      if (strict) return { error: "Each take needs to be 280 characters or fewer." };
      take.text = take.text.slice(0, 280);
    }
  }
  return {
    takes: cleaned.map((take) => ({ id: keepId(take.id), text: take.text })),
  };
}

function parseSources(
  input: SourceInput[] | undefined,
  strict: boolean,
): { error: string } | { sources: Source[] } {
  const rows = (input ?? [])
    .map((source) => ({
      id: source.id?.trim(),
      label: cleanLine(source.label).replace(/\s+/g, " "),
      url: source.url.trim(),
      note: cleanLine(source.note).replace(/\s+/g, " "),
    }))
    .filter((source) => source.label || source.url || source.note);
  if (rows.length > 12) {
    if (strict) return { error: "Keep it to 12 sources or fewer." };
    rows.length = 12;
  }
  for (const row of rows) {
    if (!row.label) {
      if (strict) return { error: "Every source needs a name." };
      row.label = "Untitled source";
    }
    if (row.label.length > 180) {
      if (strict) return { error: "Source names need to be 180 characters or fewer." };
      row.label = row.label.slice(0, 180);
    }
    if (row.note.length > 300) {
      if (strict) return { error: "Source notes need to be 300 characters or fewer." };
      row.note = row.note.slice(0, 300);
    }
    if (row.url && !/^https?:\/\//i.test(row.url)) {
      if (strict) return { error: "Source links need to start with http:// or https://." };
      row.url = "";
    }
  }
  return {
    sources: rows.map((row) => ({
      id: keepId(row.id),
      label: row.label,
      url: row.url,
      note: row.note,
    })),
  };
}

function validate(input: PostInput, existing: Take[]): { error: string } | {
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  takes: Take[];
  sources: Source[];
} {
  const title = cleanLine(input.title).replace(/\s+/g, " ");
  const body = input.body.replace(/\r\n/g, "\n").trim();
  if (!title) return { error: "Give the post a title." };
  if (title.length > 200) return { error: "Keep the title under 200 characters." };
  if (!body) return { error: "Write the post before publishing." };
  if (body.length > 40000) {
    return { error: "This post is too long for the editor (40,000 characters)." };
  }

  const excerptSource = input.excerpt.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ").trim();
  const excerpt = excerptSource || plainExcerpt(body);
  if (!excerpt) return { error: "Add an excerpt, or write a little more of the post." };
  if (excerpt.length > 500) return { error: "Keep the excerpt under 500 characters." };

  const tags = parseTags(input.tags, true);
  if ("error" in tags) return tags;
  const takes = parseTakes(input.takes, true);
  if ("error" in takes) return takes;
  const sources = parseSources(input.sources, true);
  if ("error" in sources) return sources;
  void existing;

  return { title, excerpt, body, tags: tags.tags, takes: takes.takes, sources: sources.sources };
}

export async function homePosts(visitorId: string | null) {
  const store = await load();
  const posts = store.posts
    .filter(isPublic)
    .slice()
    .sort(byNewest)
    .map((post) => decorate(post, store, visitorId));
  return { featured: posts[0] ?? null, recent: posts.slice(1, 6) };
}

export async function queryPosts(options: {
  q?: string;
  tag?: string;
  page?: number;
  visitorId: string | null;
  pageSize?: number;
}) {
  const pageSize = options.pageSize ?? 8;
  const store = await load();
  let posts = store.posts.filter(isPublic).slice().sort(byNewest);
  if (options.tag) {
    const tag = options.tag.toLowerCase();
    posts = posts.filter((post) => post.tags.some((item) => item.toLowerCase() === tag));
  }
  if (options.q?.trim()) {
    const q = options.q.trim().toLowerCase();
    posts = posts.filter((post) =>
      [
        post.title,
        post.excerpt,
        post.body,
        post.tags.join(" "),
        post.takes.map((take) => take.text).join(" "),
        post.sources.map((source) => `${source.label} ${source.note}`).join(" "),
      ]
        .join("\n")
        .toLowerCase()
        .includes(q),
    );
  }
  const total = posts.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(options.page ?? 1, 1), total === 0 ? 1 : pages);
  const slice = posts.slice((page - 1) * pageSize, page * pageSize);
  return {
    posts: slice.map((post) => decorate(post, store, options.visitorId)),
    total,
    page,
    pages,
  };
}

export async function allTags() {
  const store = await load();
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of store.posts.filter(isPublic)) {
    for (const tag of post.tags) {
      const key = tag.toLowerCase();
      const current = counts.get(key);
      if (current) current.count += 1;
      else counts.set(key, { tag, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostBySlug(slug: string, visitorId: string | null) {
  const store = await load();
  const post = store.posts.find((item) => item.slug === slug);
  if (!post || !isPublic(post)) return null;
  return decorate(post, store, visitorId);
}

export async function listEditorPosts(): Promise<PostSummary[]> {
  const store = await load();
  return store.posts
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    })
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentCount: store.comments.filter((comment) => comment.postId === post.id).length,
    }));
}

export async function getEditorPost(id: string): Promise<EditorPost | null> {
  const store = await load();
  const post = store.posts.find((item) => item.id === id);
  if (!post) return null;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    tags: post.tags,
    takes: post.takes,
    sources: post.sources,
    status: post.status,
    updatedAt: post.updatedAt,
    comments: store.comments
      .filter((comment) => comment.postId === post.id)
      .sort(byOldest)
      .map((comment) => ({
        id: comment.id,
        authorName: comment.authorName,
        body: comment.body,
        createdAt: comment.createdAt,
      })),
  };
}

export async function listFeedPosts() {
  const store = await load();
  return store.posts
    .filter(isPublic)
    .slice()
    .sort(byNewest)
    .slice(0, 20)
    .map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      createdAt: post.createdAt,
    }));
}

export async function createPostRecord(input: PostInput): Promise<{ error: string } | { slug: string }> {
  const store = await load();
  const validated = validate(input, []);
  if ("error" in validated) return validated;
  const now = new Date().toISOString();
  const post: StoredPost = {
    id: crypto.randomUUID(),
    slug: uniqueSlug(store, validated.title),
    title: validated.title,
    excerpt: validated.excerpt,
    body: validated.body,
    tags: validated.tags,
    takes: validated.takes,
    sources: validated.sources,
    status: "published",
    createdAt: now,
    updatedAt: now,
  };
  store.posts.push(post);
  const failed = savePosts(store);
  if (failed) return failed;
  return { slug: post.slug };
}

export async function updatePostRecord(
  id: string,
  input: PostInput,
): Promise<{ error: string } | { slug: string }> {
  const store = await load();
  const post = store.posts.find((item) => item.id === id);
  if (!post) return { error: "That post no longer exists." };
  const validated = validate(input, post.takes);
  if ("error" in validated) return validated;
  const wasDraft = post.status === "draft";
  post.title = validated.title;
  post.excerpt = validated.excerpt;
  post.body = validated.body;
  post.tags = validated.tags;
  post.takes = validated.takes;
  post.sources = validated.sources;
  post.status = "published";
  if (wasDraft) post.slug = uniqueSlug(store, validated.title, post.id);
  post.updatedAt = new Date().toISOString();
  const kept = new Set(post.takes.map((take) => take.id));
  store.reactions = store.reactions.filter((reaction) => kept.has(reaction.takeId));
  for (const comment of store.comments) {
    if (comment.postId === post.id && comment.takeId && !kept.has(comment.takeId)) {
      comment.takeId = null;
    }
  }
  const failed = savePosts(store);
  if (failed) return failed;
  return { slug: post.slug };
}

export async function saveDraftRecord(
  input: DraftInput,
): Promise<
  { error: string } | { id: string; slug: string; status: StoredPost["status"]; updatedAt: string; skipped?: boolean }
> {
  if (!input.id || !/^[\w-]{1,80}$/.test(input.id)) {
    return { error: "Draft could not be saved." };
  }
  const store = await load();
  const title = cleanLine(input.title).replace(/\s+/g, " ").slice(0, 200);
  const excerpt = input.excerpt.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ").trim().slice(0, 500);
  const body = input.body.replace(/\r\n/g, "\n").slice(0, 40000);
  const tags = parseTags(input.tags, false);
  const takes = parseTakes(input.takes, false);
  const sources = parseSources(input.sources, false);
  if ("error" in tags || "error" in takes || "error" in sources) {
    return { error: "Draft could not be saved." };
  }
  const meaningful = Boolean(
    title || excerpt || body.trim() || tags.tags.length || takes.takes.length || sources.sources.length,
  );
  const existing = store.posts.find((item) => item.id === input.id);
  if (!existing && !meaningful) {
    return { id: input.id, slug: "", status: "draft", updatedAt: "", skipped: true };
  }
  const now = new Date().toISOString();
  if (existing) {
    existing.title = title || "Untitled";
    existing.excerpt = excerpt;
    existing.body = body;
    existing.tags = tags.tags;
    const previousTakeIds = new Set(existing.takes.map((take) => take.id));
    existing.takes = takes.takes;
    existing.sources = sources.sources;
    if (existing.status !== "published") {
      existing.status = "draft";
      existing.slug = uniqueSlug(store, existing.title, existing.id);
    }
    existing.updatedAt = now;
    const kept = new Set(existing.takes.map((take) => take.id));
    store.reactions = store.reactions.filter(
      (reaction) => !previousTakeIds.has(reaction.takeId) || kept.has(reaction.takeId),
    );
    for (const comment of store.comments) {
      if (comment.postId === existing.id && comment.takeId && !kept.has(comment.takeId)) {
        comment.takeId = null;
      }
    }
    const failed = savePosts(store);
    if (failed) return failed;
    return { id: existing.id, slug: existing.slug, status: existing.status, updatedAt: now };
  }
  const post: StoredPost = {
    id: input.id,
    slug: uniqueSlug(store, title || "Untitled"),
    title: title || "Untitled",
    excerpt,
    body,
    tags: tags.tags,
    takes: takes.takes,
    sources: sources.sources,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  store.posts.push(post);
  const failed = savePosts(store);
  if (failed) return failed;
  return { id: post.id, slug: post.slug, status: post.status, updatedAt: now };
}

export async function deletePostRecord(id: string): Promise<{ error: string } | { ok: true }> {
  const store = await load();
  const post = store.posts.find((item) => item.id === id);
  if (!post) return { error: "That post no longer exists." };
  const takeIds = new Set(post.takes.map((take) => take.id));
  store.posts = store.posts.filter((item) => item.id !== id);
  store.comments = store.comments.filter((comment) => comment.postId !== id);
  store.reactions = store.reactions.filter((reaction) => !takeIds.has(reaction.takeId));
  const failed = savePosts(store);
  if (failed) return failed;
  return { ok: true };
}

export function addCommentRecord(input: {
  postId: string;
  takeId: string | null;
  authorName: string;
  body: string;
  visitorId: string;
}): Promise<{ error: string } | { ok: true; slug: string }> {
  return withActivityRetry(async (store) => {
    const post = store.posts.find((item) => item.id === input.postId);
    if (!post) return { error: "That post no longer exists." };
    const name = cleanLine(input.authorName).replace(/\s+/g, " ").slice(0, 40) || "Reader";
    const body = input.body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if (!body) return { error: "Write a comment before posting it." };
    if (body.length > 2000) return { error: "Keep the comment under 2,000 characters." };
    if (store.comments.filter((comment) => comment.postId === post.id).length >= 500) {
      return { error: "This post is not accepting more comments." };
    }
    const latest = store.comments
      .filter((comment) => comment.visitorId === input.visitorId)
      .sort(byNewest)[0];
    if (latest && Date.now() - new Date(latest.createdAt).getTime() < 15_000) {
      return { error: "Wait a few seconds before posting another comment." };
    }
    const takeId = input.takeId && post.takes.some((take) => take.id === input.takeId) ? input.takeId : null;
    store.comments.push({
      id: crypto.randomUUID(),
      postId: post.id,
      takeId,
      authorName: name,
      body,
      createdAt: new Date().toISOString(),
      visitorId: input.visitorId,
    });
    await saveActivity(store);
    return { ok: true as const, slug: post.slug };
  });
}

export function deleteCommentRecord(
  commentId: string,
  visitorId: string | null,
  moderator: boolean,
): Promise<{ error: string } | { ok: true; slug: string | null }> {
  return withActivityRetry(async (store) => {
    const comment = store.comments.find((item) => item.id === commentId);
    if (!comment) return { error: "That comment is already gone." };
    const mine = Boolean(visitorId && comment.visitorId === visitorId);
    if (!mine && !moderator) return { error: "You can only remove your own comments." };
    store.comments = store.comments.filter((item) => item.id !== commentId);
    await saveActivity(store);
    const post = store.posts.find((item) => item.id === comment.postId);
    return { ok: true as const, slug: post?.slug ?? null };
  });
}

export function setStanceRecord(
  takeId: string,
  visitorId: string,
  stance: Stance,
): Promise<{ error: string } | { stance: Stance | null; agree: number; disagree: number; slug: string }> {
  return withActivityRetry(async (store) => {
    const post = store.posts.find((item) => item.takes.some((take) => take.id === takeId));
    if (!post) return { error: "That take no longer exists." };
    const existing = store.reactions.find(
      (reaction) => reaction.takeId === takeId && reaction.visitorId === visitorId,
    );
    if (existing && existing.stance === stance) {
      store.reactions = store.reactions.filter(
        (reaction) => !(reaction.takeId === takeId && reaction.visitorId === visitorId),
      );
    } else if (existing) {
      existing.stance = stance;
    } else {
      store.reactions.push({ takeId, visitorId, stance });
    }
    await saveActivity(store);
    const related = store.reactions.filter((reaction) => reaction.takeId === takeId);
    const mine = related.find((reaction) => reaction.visitorId === visitorId);
    return {
      stance: mine?.stance ?? null,
      agree: related.filter((reaction) => reaction.stance === "agree").length,
      disagree: related.filter((reaction) => reaction.stance === "disagree").length,
      slug: post.slug,
    };
  });
}
