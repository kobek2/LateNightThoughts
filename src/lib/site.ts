// Change the name, byline, and description here. They show up across the site.
export const site = {
  name: "Late Night Thoughts",
  tagline: "Arguments worth having, written down.",
  description:
    "A personal political blog: essays, the takes inside them, and the comments they start.",
  author: "kobethou",
  timeZone: "America/Chicago",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
};
