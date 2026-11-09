"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="top">
      <div className="shell top-inner">
        <Link href="/" className="wordmark">
          {site.name}
        </Link>
        <nav className="nav" aria-label="Primary">
          {links.map((link) => {
            const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/write"
            className="nav-write"
            aria-current={pathname.startsWith("/write") ? "page" : undefined}
          >
            Write
          </Link>
        </nav>
      </div>
    </header>
  );
}
