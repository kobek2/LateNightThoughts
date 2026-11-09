import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <p>
          {site.name}. Written by {site.author}.
        </p>
        <nav aria-label="Footer">
          <Link href="/archive">Archive</Link>
          <Link href="/about">About</Link>
          <Link href="/feed.xml">RSS</Link>
        </nav>
      </div>
    </footer>
  );
}
