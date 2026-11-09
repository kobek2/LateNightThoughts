"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="measure">
      <p className="kicker">Error</p>
      <h1 className="page-title">The page could not be loaded.</h1>
      <p className="deck">{error.message || "Something went wrong while reading the blog."}</p>
      <button type="button" className="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
