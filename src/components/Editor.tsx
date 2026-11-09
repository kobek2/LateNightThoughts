"use client";

import { FormEvent, KeyboardEvent, TextareaHTMLAttributes, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePost } from "@/lib/actions";
import { OPEN_DRAFT_KEY, SESSION_DRAFT_KEY, draftStorageKey } from "@/lib/constants";
import { excerptScale, formatDate, titleScale } from "@/lib/format";
import type { DraftInput, EditorPost } from "@/lib/types";
import { BodyField } from "./BodyField";
import { DeletePostButton } from "./DeletePostButton";
import { RemoveCommentButton } from "./RemoveCommentButton";

type TakeDraft = { key: string; id?: string; text: string };
type SourceDraft = { key: string; id?: string; label: string; url: string; note: string };
type LocalDraft = DraftInput & { updatedAt: string; saved: boolean };
type SaveState = "idle" | "saving" | "saved" | "error";

function readLocal(id: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalDraft;
    if (!parsed || parsed.id !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function hashDraft(draft: DraftInput) {
  return JSON.stringify([draft.title, draft.excerpt, draft.body, draft.tags, draft.takes, draft.sources]);
}

function hasProgress(draft: DraftInput) {
  return Boolean(
    draft.title.trim() ||
      draft.excerpt.trim() ||
      draft.body.trim() ||
      draft.tags.trim() ||
      draft.takes.some((take) => take.text.trim()) ||
      draft.sources.some((source) => source.label.trim() || source.url.trim() || source.note.trim()),
  );
}

function GrowingTextarea({
  value,
  className,
  minRows = 1,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value, className]);

  return <textarea {...props} ref={ref} rows={minRows} value={value} className={className} />;
}

export function Editor({ post, fresh = false }: { post: EditorPost | null; fresh?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [takes, setTakes] = useState<TakeDraft[]>(
    post?.takes.length
      ? post.takes.map((take) => ({ key: take.id, id: take.id, text: take.text }))
      : [{ key: "initial", text: "" }],
  );
  const [sources, setSources] = useState<SourceDraft[]>(
    post?.sources.map((source) => ({
      key: source.id,
      id: source.id,
      label: source.label,
      url: source.url,
      note: source.note,
    })) ?? [],
  );
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const idRef = useRef(post?.id ?? "");
  const readyRef = useRef(false);
  const publishingRef = useRef(false);
  const savedHash = useRef("");
  const snapshotRef = useRef<DraftInput>({
    id: post?.id ?? "",
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    body: post?.body ?? "",
    tags: post?.tags.join(", ") ?? "",
    takes: post?.takes ?? [],
    sources: post?.sources ?? [],
  });

  function snapshot(): DraftInput {
    return {
      id: idRef.current,
      title,
      excerpt,
      body,
      tags,
      takes: takes.map((take) => ({ id: take.id ?? take.key, text: take.text })),
      sources: sources.map((source) => ({
        id: source.id ?? source.key,
        label: source.label,
        url: source.url,
        note: source.note,
      })),
    };
  }

  function applyLocal(local: LocalDraft) {
    idRef.current = local.id;
    setTitle(local.title);
    setExcerpt(local.excerpt);
    setBody(local.body);
    setTags(local.tags);
    setTakes(
      local.takes.length
        ? local.takes.map((take) => ({ key: take.id || crypto.randomUUID(), id: take.id, text: take.text }))
        : [{ key: "initial", text: "" }],
    );
    setSources(
      local.sources.map((source) => ({
        key: source.id || crypto.randomUUID(),
        id: source.id,
        label: source.label,
        url: source.url,
        note: source.note,
      })),
    );
  }

  useEffect(() => {
    if (post) {
      idRef.current = post.id;
      savedHash.current = hashDraft({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        tags: post.tags.join(", "),
        takes: post.takes,
        sources: post.sources,
      });
      sessionStorage.setItem(SESSION_DRAFT_KEY, post.id);
      localStorage.setItem(OPEN_DRAFT_KEY, post.id);
      const local = readLocal(post.id);
      if (local && local.updatedAt > post.updatedAt) applyLocal(local);
    } else if (fresh) {
      const id = crypto.randomUUID();
      idRef.current = id;
      sessionStorage.setItem(SESSION_DRAFT_KEY, id);
      localStorage.setItem(OPEN_DRAFT_KEY, id);
    } else {
      const sessionId = sessionStorage.getItem(SESSION_DRAFT_KEY);
      const openId = sessionId || localStorage.getItem(OPEN_DRAFT_KEY);
      if (openId) {
        const local = readLocal(openId);
        idRef.current = openId;
        if (local) applyLocal(local);
        if (!sessionId && local?.saved) {
          router.replace(`/write/${openId}`);
        } else {
          sessionStorage.setItem(SESSION_DRAFT_KEY, openId);
        }
      } else {
        const id = crypto.randomUUID();
        idRef.current = id;
        sessionStorage.setItem(SESSION_DRAFT_KEY, id);
        localStorage.setItem(OPEN_DRAFT_KEY, id);
      }
    }
    readyRef.current = true;
    // Resume once, from the post that was loaded with this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  snapshotRef.current = snapshot();

  useEffect(() => {
    const current = { ...snapshotRef.current, id: idRef.current };
    snapshotRef.current = current;
    if (!readyRef.current || !current.id || !hasProgress(current)) return;
    localStorage.setItem(
      draftStorageKey(current.id),
      JSON.stringify({ ...current, updatedAt: new Date().toISOString(), saved: false } satisfies LocalDraft),
    );
    localStorage.setItem(OPEN_DRAFT_KEY, current.id);
  }, [title, excerpt, body, tags, takes, sources]);

  async function pushDraft(
    current = { ...snapshotRef.current, id: idRef.current },
  ): Promise<{ error: string } | { id: string; slug: string; status: "draft" | "published"; updatedAt: string; skipped: boolean }> {
    if (!current.id || !hasProgress(current)) {
      return { id: current.id || "", slug: "", status: "draft", updatedAt: "", skipped: true };
    }
    if (hashDraft(current) === savedHash.current) {
      return { id: current.id, slug: "", status, updatedAt: "", skipped: false };
    }
    setSaveState("saving");
    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      const result = (await response.json()) as {
        error?: string;
        id?: string;
        slug?: string;
        status?: "draft" | "published";
        updatedAt?: string;
        skipped?: boolean;
      };
      if (!response.ok || result.error || !result.id) {
        setSaveState("error");
        return { error: result.error || "Draft could not be saved." };
      }
      localStorage.setItem(
        draftStorageKey(result.id),
        JSON.stringify({
          ...current,
          id: result.id,
          updatedAt: result.updatedAt || new Date().toISOString(),
          saved: true,
        } satisfies LocalDraft),
      );
      savedHash.current = hashDraft({ ...current, id: result.id });
      if (result.status) setStatus(result.status);
      setSaveState(result.skipped ? "idle" : "saved");
      return {
        id: result.id,
        slug: result.slug || "",
        status: result.status || "draft",
        updatedAt: result.updatedAt || "",
        skipped: Boolean(result.skipped),
      };
    } catch {
      setSaveState("error");
      return { error: "Draft could not be saved. A copy is kept in this browser." };
    }
  }

  useEffect(() => {
    if (!readyRef.current) return;
    const handle = window.setTimeout(() => {
      if (!publishingRef.current) void pushDraft();
    }, 700);
    return () => window.clearTimeout(handle);
    // pushDraft closes over the latest field values via snapshotRef, which is updated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, excerpt, body, tags, takes, sources]);

  useEffect(() => {
    const flush = () => {
      const current = { ...snapshotRef.current, id: idRef.current };
      if (publishingRef.current || !current.id || !hasProgress(current)) return;
      localStorage.setItem(
        draftStorageKey(current.id),
        JSON.stringify({ ...current, updatedAt: new Date().toISOString(), saved: false } satisfies LocalDraft),
      );
      localStorage.setItem(OPEN_DRAFT_KEY, current.id);
      void fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
        keepalive: true,
      });
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  function onTitleKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (event.key === "Enter") event.preventDefault();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    publishingRef.current = true;
    const current = snapshot();
    snapshotRef.current = current;
    const saved = await pushDraft(current);
    if ("error" in saved) {
      setError(saved.error);
      setPending(false);
      publishingRef.current = false;
      return;
    }
    if (saved.skipped) {
      setError("Write the post before publishing.");
      setPending(false);
      publishingRef.current = false;
      return;
    }
    const result = await updatePost(saved.id, current);
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      publishingRef.current = false;
      return;
    }
    localStorage.removeItem(draftStorageKey(saved.id));
    if (localStorage.getItem(OPEN_DRAFT_KEY) === saved.id) localStorage.removeItem(OPEN_DRAFT_KEY);
    sessionStorage.removeItem(SESSION_DRAFT_KEY);
    router.push(`/posts/${result.slug}`);
    router.refresh();
  }

  const published = status === "published";

  return (
    <form className="measure" onSubmit={onSubmit}>
      <label className="field">
        <span>Title</span>
        <GrowingTextarea
          className={`title-input ${titleScale(title)}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={onTitleKeyDown}
          maxLength={200}
          required
          autoFocus={!post}
          placeholder="Title"
          aria-label="Title"
        />
      </label>
      {post && published && (
        <p className="hint">
          The link stays <span>/posts/{post.slug}</span> when you change the title.
        </p>
      )}
      <label className="field">
        <span>Excerpt</span>
        <GrowingTextarea
          className={`excerpt-input ${excerptScale(excerpt)}`}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          maxLength={500}
          minRows={2}
          placeholder="One or two sentences for the home page"
          aria-label="Excerpt"
        />
      </label>
      <label className="field">
        <span>Tags</span>
        <input
          className="line-input"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          onKeyDown={onTitleKeyDown}
          placeholder="Local politics, Voting"
        />
        <span className="hint">Comma separated. Up to 6.</span>
      </label>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: "1.15rem 0" }}>
        <legend className="label">Takes</legend>
        <span className="hint">
          Each take is one claim. Readers get an agree button and a disagree button for it.
        </span>
        {takes.map((take, index) => (
          <div className="take-edit" key={take.key} style={{ marginTop: "0.7rem" }}>
            <input
              className="line-input"
              value={take.text}
              maxLength={280}
              placeholder={index === 0 ? "The main take" : "Another take"}
              aria-label={index === 0 ? "Main take" : `Take ${index + 1}`}
              onChange={(event) =>
                setTakes((current) =>
                  current.map((item) => (item.key === take.key ? { ...item, text: event.target.value } : item)),
                )
              }
            />
            {takes.length > 1 && (
              <button
                type="button"
                className="text-button"
                onClick={() => setTakes((current) => current.filter((item) => item.key !== take.key))}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {takes.length < 8 && (
          <button
            type="button"
            className="button secondary"
            style={{ marginTop: "0.8rem" }}
            onClick={() => setTakes((current) => [...current, { key: crypto.randomUUID(), text: "" }])}
          >
            Add a take
          </button>
        )}
      </fieldset>
      <BodyField value={body} onChange={setBody} />
      <fieldset className="sources-editor">
        <legend className="label">Sources</legend>
        <p className="hint">Name, link, and the limit of what the source can prove. These sit at the bottom of the essay.</p>
        {sources.map((source, index) => (
          <div className="source-edit" key={source.key}>
            <label>
              <span>Name</span>
              <input
                className="line-input"
                value={source.label}
                maxLength={180}
                placeholder="Budget report, 2024"
                aria-label={`Source ${index + 1} name`}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) => (item.key === source.key ? { ...item, label: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label>
              <span>Link</span>
              <input
                className="line-input"
                value={source.url}
                inputMode="url"
                placeholder="https://"
                aria-label={`Source ${index + 1} link`}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) => (item.key === source.key ? { ...item, url: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label>
              <span>What it cannot prove</span>
              <GrowingTextarea
                className="excerpt-input excerpt-medium"
                value={source.note}
                maxLength={300}
                minRows={2}
                placeholder="The year it covers, and the decision it does not settle."
                aria-label={`Source ${index + 1} note`}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) => (item.key === source.key ? { ...item, note: event.target.value } : item)),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="text-button"
              onClick={() => setSources((current) => current.filter((item) => item.key !== source.key))}
            >
              Remove source
            </button>
          </div>
        ))}
        {sources.length < 12 && (
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setSources((current) => [
                ...current,
                { key: crypto.randomUUID(), label: "", url: "", note: "" },
              ])
            }
          >
            Add a source
          </button>
        )}
      </fieldset>
      <p className="hint save-status" role="status">
        {saveState === "saving" && "Saving…"}
        {saveState === "saved" &&
          (published
            ? "Edits saved."
            : "Saved as a draft. Closing the tab keeps it in the studio.")}
        {saveState === "error" && "Could not reach the site. A copy is kept in this browser."}
        {saveState === "idle" && !published && "A draft is saved while you write, including if you close the tab."}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="editor-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? (published ? "Updating…" : "Publishing…") : published ? "Update" : "Publish"}
        </button>
        <Link href="/write" className="text-link">
          Cancel
        </Link>
        {post && <DeletePostButton id={post.id} />}
      </div>
      {post && post.comments.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 className="section-title">Comments on this post</h2>
          <ul className="comment-admin">
            {post.comments.map((comment) => (
              <li key={comment.id}>
                <div>
                  <strong>{comment.authorName}</strong>
                  <span className="comment-meta"> · {formatDate(comment.createdAt)}</span>
                  <p className="comment-body">{comment.body}</p>
                </div>
                <RemoveCommentButton id={comment.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </form>
  );
}
