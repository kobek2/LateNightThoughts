import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `What ${site.name} is for.`,
};

export default function AboutPage() {
  return (
    <article className="measure">
      <p className="kicker">About</p>
      <h1 className="page-title">A blog with the argument written out front.</h1>
      <div className="prose">
        <p>
          {site.name} is {site.author}&apos;s personal political blog. Each essay states a few takes.
          Readers can agree or disagree with those takes, and comment when a button is not enough.
        </p>
      </div>
    </article>
  );
}
