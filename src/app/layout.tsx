import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit, Source_Serif_4 } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "600"],
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.author }],
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#f3eee4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${sans.variable}`}>
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <Header />
        <main id="content" className="shell main-shell">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
