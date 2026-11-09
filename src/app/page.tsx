import Link from "next/link";
import { FeaturedStory, StoryRow } from "@/components/Stories";
import { homePosts } from "@/lib/store";
import { site } from "@/lib/site";
import { getVisitorId } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const visitorId = await getVisitorId();
  const { featured, recent } = homePosts(visitorId);

  return (
    <>
      <header className="masthead">
        <p className="kicker">Personal political blog</p>
        <h1>{site.name}</h1>
      </header>
      {featured ? (
        <>
          <FeaturedStory post={featured} />
          {recent.length > 0 && (
            <section className="recent" aria-labelledby="recent-heading">
              <div className="recent-head">
                <h2 id="recent-heading" className="section-title">
                  Recent
                </h2>
                <Link href="/archive">All posts</Link>
              </div>
              {recent.map((post, index) => (
                <StoryRow key={post.id} post={post} index={String(index + 2).padStart(2, "0")} />
              ))}
            </section>
          )}
        </>
      ) : (
        <div className="empty">
          <h2 className="section-title">No posts yet.</h2>
          <p className="deck">The first argument goes in the studio.</p>
          <Link href="/write/new" className="button">
            Write a post
          </Link>
        </div>
      )}
    </>
  );
}
