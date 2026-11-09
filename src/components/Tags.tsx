import Link from "next/link";

export function Tags({ tags, active }: { tags: string[]; active?: string }) {
  if (tags.length === 0) return null;
  const current = active?.toLowerCase();
  return (
    <ul className="tags">
      {tags.map((tag) => {
        const on = current === tag.toLowerCase();
        return (
          <li key={tag}>
            <Link
              href={`/archive?tag=${encodeURIComponent(tag)}`}
              className={on ? "tag is-active" : "tag"}
              aria-current={on ? "page" : undefined}
            >
              {tag}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
