import { xmlEscape } from "@/lib/format";
import { site } from "@/lib/site";
import { listFeedPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await listFeedPosts();
  const items = posts
    .map(
      (post) => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(`${site.url}/posts/${post.slug}`)}</link>
      <guid>${xmlEscape(`${site.url}/posts/${post.slug}`)}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description>${xmlEscape(post.excerpt)}</description>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(site.name)}</title>
    <link>${xmlEscape(site.url)}</link>
    <description>${xmlEscape(site.description)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
