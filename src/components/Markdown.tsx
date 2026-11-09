"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeHref } from "@/lib/format";

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            const safe = safeHref(href);
            if (!safe) return <span>{children}</span>;
            const external = safe.startsWith("http");
            return (
              <a href={safe} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const safe = safeHref(typeof src === "string" ? src : undefined);
            if (!safe) return null;
            return <img src={safe} alt={alt || ""} />;
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
