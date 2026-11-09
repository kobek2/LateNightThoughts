import type { Metadata } from "next";
import { Editor } from "@/components/Editor";
import { LockButton, WriteGate } from "@/components/WriteGate";
import { studioOpen } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string }>;
}) {
  if (!(await studioOpen())) return <WriteGate />;
  const sp = await searchParams;
  return (
    <>
      <div className="measure">
        <p className="kicker">Studio</p>
        <div className="section-head">
          <h1 className="page-title">New post</h1>
          <LockButton />
        </div>
        <Editor post={null} fresh={sp.fresh === "1"} />
      </div>
    </>
  );
}
