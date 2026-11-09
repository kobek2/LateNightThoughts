"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/lib/actions";
import { NAME_STORAGE_KEY } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { CommentView, TakeView } from "@/lib/types";
import { RemoveCommentButton } from "./RemoveCommentButton";

export function CommentSection({
  postId,
  comments,
  takes,
}: {
  postId: string;
  comments: CommentView[];
  takes: TakeView[];
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [takeId, setTakeId] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(NAME_STORAGE_KEY);
    if (saved) setName(saved);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addComment({
        postId,
        takeId: takeId || null,
        authorName: name,
        body,
        company,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      localStorage.setItem(NAME_STORAGE_KEY, name.trim());
      setBody("");
      setCompany("");
      router.refresh();
    });
  }

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="section-title">
        Comments
      </h2>
      <p className="hint">
        {comments.length === 0
          ? "No comments yet. If a take is wrong, say why."
          : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}.`}
      </p>
      {comments.length > 0 && (
        <div>
          {comments.map((comment) => (
            <article key={comment.id} className="comment">
              <div className="comment-top">
                <span className="comment-name">{comment.authorName}</span>
                <time className="comment-meta" dateTime={comment.createdAt}>
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              {comment.takeText && <p className="on-take">On: {comment.takeText}</p>}
              <p className="comment-body">{comment.body}</p>
              {comment.mine && (
                <p>
                  <RemoveCommentButton id={comment.id} />
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      <form className="comment-form" onSubmit={onSubmit}>
        <div className="hp" hidden aria-hidden="true">
          <label>
            Company
            <input
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>Name</span>
          <input
            className="line-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoComplete="name"
            placeholder="Reader"
          />
        </label>
        {takes.length > 0 && (
          <label className="field">
            <span>Responding to</span>
            <select className="line-input" value={takeId} onChange={(event) => setTakeId(event.target.value)}>
              <option value="">The whole post</option>
              {takes.map((take) => (
                <option key={take.id} value={take.id}>
                  {take.text}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Comment</span>
          <textarea
            className="editor-body"
            style={{ minHeight: "140px" }}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            required
            placeholder="Quote the claim you mean."
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
