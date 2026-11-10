import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/CommentSection";
import { Markdown } from "@/components/Markdown";
import { StanceControl } from "@/components/StanceControl";
import { Tags } from "@/components/Tags";
import { excerptScale, formatDate, safeHref, titleScale } from "@/lib/format";
import { site } from "@/lib/site";
import { getPostBySlug } from "@/lib/store";
import { getVisitorId } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, null);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visitorId = await getVisitorId();
  const post = await getPostBySlug(slug, visitorId);
  if (!post) notFound();

  return (
    <article className="article-wrap">
      <p className="kicker">
        <Link href="/archive">All posts</Link>
      </p>
      <h1 className={`post-title ${titleScale(post.title)}`}>{post.title}</h1>
      <p className={`deck ${excerptScale(post.excerpt)}`}>{post.excerpt}</p>
      <p className="meta">
        <span>By {site.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
        {post.updatedAt !== post.createdAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>Updated {formatDate(post.updatedAt)}</span>
          </>
        )}
      </p>
      <Tags tags={post.tags} />
      <Markdown source={post.body} />
      {post.sources.length > 0 && (
        <section className="sources" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="section-title">
            Sources
          </h2>
          <ol>
            {post.sources.map((source) => {
              const href = safeHref(source.url);
              return (
                <li key={source.id}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      {source.label}
                    </a>
                  ) : (
                    source.label
                  )}
                  {source.note && <p>{source.note}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
      <section className="takes" aria-labelledby="takes-heading">
        <h2 id="takes-heading" className="section-title">
          Where do you land?
        </h2>
        <p className="hint">Agree or disagree with each take. Your stance is saved in this browser.</p>
        {post.takes.map((take) => (
          <StanceControl
            key={take.id}
            takeId={take.id}
            text={take.text}
            agree={take.agree}
            disagree={take.disagree}
            stance={take.stance}
          />
        ))}
      </section>
      <CommentSection postId={post.id} comments={post.comments} takes={post.takes} />
    </article>
  );
}
