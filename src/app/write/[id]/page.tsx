import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { LockButton, WriteGate } from "@/components/WriteGate";
import { passphraseRequired } from "@/lib/auth";
import { getEditorPost } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getEditorPost(id);
  if (!post) notFound();

  return (
    <WriteGate required={passphraseRequired()}>
      <div className="measure">
        <p className="kicker">Studio</p>
        <div className="section-head">
          <h1 className="page-title">Edit post</h1>
          <div className="row-actions">
            <LockButton />
            {post.status === "published" && <Link href={`/posts/${post.slug}`}>View</Link>}
          </div>
        </div>
        <Editor post={post} />
      </div>
    </WriteGate>
  );
}
