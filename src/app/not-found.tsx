import Link from "next/link";

export default function NotFound() {
  return (
    <div className="measure">
      <p className="kicker">404</p>
      <h1 className="page-title">This page is not on the blog.</h1>
      <p className="deck">The post may have been renamed or deleted.</p>
      <Link href="/" className="text-link">
        Back to the latest
      </Link>
    </div>
  );
}
