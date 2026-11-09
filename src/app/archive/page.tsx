import type { Metadata } from "next";
import Link from "next/link";
import { StoryRow } from "@/components/Stories";
import { Tags } from "@/components/Tags";
import { allTags, queryPosts } from "@/lib/store";
import { getVisitorId } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description: "Every post on the blog, newest first.",
};

function archiveHref(page: number, q: string, tag: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const tag = sp.tag?.trim() ?? "";
  const parsed = Number.parseInt(sp.page ?? "1", 10);
  const requested = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const visitorId = await getVisitorId();
  const { posts, total, page, pages } = queryPosts({ q, tag, page: requested, visitorId });
  const tags = allTags();

  return (
    <div>
      <p className="kicker">Archive</p>
      <h1 className="page-title">All posts</h1>
      <p className="deck">Newest first. Search the titles, the essays, and the takes.</p>
      <form className="search" action="/archive">
        {tag && <input type="hidden" name="tag" value={tag} />}
        <label className="field">
          <span>Search</span>
          <input className="line-input" id="q" name="q" defaultValue={q} placeholder="Polls, libraries, a phrase" />
        </label>
        <button className="button secondary" type="submit">
          Search
        </button>
      </form>
      <div className="filter-row">
        <Tags tags={tags.map((item) => item.tag)} active={tag} />
        <p className="hint">
          {total} {total === 1 ? "post" : "posts"}
          {(q || tag) && (
            <>
              {" "}
              <Link href="/archive">Clear</Link>
            </>
          )}
        </p>
      </div>
      {posts.length === 0 ? (
        <div className="empty">
          <h2 className="section-title">Nothing matches.</h2>
          <p className="deck">Try another word, or clear the filter.</p>
        </div>
      ) : (
        <div className="recent">
          {posts.map((post, index) => (
            <StoryRow
              key={post.id}
              post={post}
              index={String((page - 1) * 8 + index + 1).padStart(2, "0")}
            />
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="pager" aria-label="Pagination">
          {page > 1 ? <Link href={archiveHref(page - 1, q, tag)}>Newer</Link> : <span />}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={archiveHref(page + 1, q, tag)}>Older</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
