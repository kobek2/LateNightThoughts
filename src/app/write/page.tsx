import type { Metadata } from "next";
import Link from "next/link";
import { DeletePostButton } from "@/components/DeletePostButton";
import { LockButton, WriteGate } from "@/components/WriteGate";
import { studioOpen } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listEditorPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Write",
  description: "Write, edit, and remove posts.",
};

export default async function WritePage() {
  if (!(await studioOpen())) return <WriteGate />;
  const posts = listEditorPosts();

  return (
    <>
      <div className="measure">
        <p className="kicker">Studio</p>
        <div className="section-head">
          <h1 className="page-title">Your posts</h1>
          <div className="row-actions">
            <LockButton />
            <Link className="button" href="/write/new?fresh=1">
              New post
            </Link>
          </div>
        </div>
        {posts.length === 0 ? (
          <p className="hint">Nothing published yet.</p>
        ) : (
          <ul className="manage-list">
            {posts.map((post) => {
              const draft = post.status === "draft";
              return (
                <li key={post.id}>
                  <div>
                    {draft && <p className="draft-mark">Draft</p>}
                    <Link href={draft ? `/write/${post.id}` : `/posts/${post.slug}`} className="story-link title-medium">
                      {post.title || "Untitled"}
                    </Link>
                    <p className="meta">
                      <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                      <span aria-hidden="true">·</span>
                      <span>
                        {draft
                          ? "Not published"
                          : `${post.commentCount} ${post.commentCount === 1 ? "comment" : "comments"}`}
                      </span>
                    </p>
                  </div>
                  <div className="row-actions">
                    <Link href={`/write/${post.id}`}>{draft ? "Resume" : "Edit"}</Link>
                    <DeletePostButton id={post.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
