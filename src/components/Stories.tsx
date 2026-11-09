import Link from "next/link";
import { excerptScale, formatDate, titleScale } from "@/lib/format";
import { site } from "@/lib/site";
import type { PostView } from "@/lib/types";
import { StanceControl } from "./StanceControl";
import { Tags } from "./Tags";

function countLabel(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function FeaturedStory({ post }: { post: PostView }) {
  return (
    <article className="featured">
      <div>
        <p className="kicker">Latest</p>
        <p className="rail-meta">
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span>{post.readingMinutes} min read</span>
          <span>{countLabel(post.commentCount, "comment")}</span>
          <span>By {site.author}</span>
        </p>
        <Tags tags={post.tags} />
      </div>
      <div>
        <h2>
          <Link href={`/posts/${post.slug}`} className={`featured-title ${titleScale(post.title)}`}>
            {post.title}
          </Link>
        </h2>
        <p className={`excerpt ${excerptScale(post.excerpt)}`}>{post.excerpt}</p>
        {post.leadTake && (
          <>
            <blockquote className="pull">
              <p>{post.leadTake.text}</p>
            </blockquote>
            <StanceControl
              compact
              takeId={post.leadTake.id}
              text={post.leadTake.text}
              agree={post.leadTake.agree}
              disagree={post.leadTake.disagree}
              stance={post.leadTake.stance}
            />
          </>
        )}
        <Link href={`/posts/${post.slug}`} className="read-link">
          Read the essay
        </Link>
      </div>
    </article>
  );
}

export function StoryRow({ post, index }: { post: PostView; index: string }) {
  return (
    <article className="recent-item">
      <span className="index-num">{index}</span>
      <div>
        <h3>
          <Link href={`/posts/${post.slug}`} className={`story-link ${titleScale(post.title)}`}>
            {post.title}
          </Link>
        </h3>
        <p className={`excerpt ${excerptScale(post.excerpt)}`}>{post.excerpt}</p>
        {post.leadTake && <p className="take-snippet">{post.leadTake.text}</p>}
        <p className="meta">
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
          <span aria-hidden="true">·</span>
          <span>{countLabel(post.commentCount, "comment")}</span>
        </p>
        <Tags tags={post.tags} />
      </div>
      {post.leadTake && (
        <StanceControl
          compact
          takeId={post.leadTake.id}
          text={post.leadTake.text}
          agree={post.leadTake.agree}
          disagree={post.leadTake.disagree}
          stance={post.leadTake.stance}
        />
      )}
    </article>
  );
}
