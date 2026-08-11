import type { Metadata } from "next";
// Self-hosted fonts (next/font/local) — next/font/google downloads from Google
// at build/dev time and dies on restricted networks (ETIMEDOUT retry storms).
// Variable woff2 files live in src/fonts/; no network needed ever.
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const instrumentSerif = localFont({
  variable: "--font-instrument-serif",
  src: [
    { path: "../fonts/instrument-serif-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
});

const interTight = localFont({
  variable: "--font-inter-tight",
  src: [
    { path: "../fonts/inter-tight-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/inter-tight-italic.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  src: [
    { path: "../fonts/jetbrains-mono-normal.woff2", weight: "100 800", style: "normal" },
    { path: "../fonts/jetbrains-mono-italic.woff2", weight: "100 800", style: "italic" },
  ],
  display: "swap",
});

const SITE_URL = "https://www.intellign.ai";
const SITE_TITLE = "Intellign — The Math Layer Within AI";
const SITE_DESCRIPTION =
  "Intellign turns plain-English optimization problems into formal mathematical models, solves them, and returns explainable assignments your team can defend.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: "%s | Intellign",
  },

  description: SITE_DESCRIPTION,

  applicationName: "Intellign",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: "Intellign",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    // No `images` override here — Next.js picks up the generated
    // src/app/opengraph-image.tsx (1200x630) automatically for every route
    // that doesn't define its own. Do not hardcode a static image path
    // unless a matching file actually exists in /public.
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
  },
};

// Site-wide entities. Page-level JSON-LD (e.g. src/app/page.tsx) should
// reference these via @id rather than redeclaring Organization/WebSite —
// duplicate/conflicting Organization nodes actively hurt entity resolution.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Intellign",
      alternateName: "Intellign AI",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#logo`,
        url: `${SITE_URL}/intellign-mark.svg`,
      },
      image: { "@id": `${SITE_URL}/#logo` },
      description: SITE_DESCRIPTION,
      sameAs: [
        "https://github.com/DataBacked-Africa",
        "https://www.linkedin.com/company/intellign-ai",
        // TODO: add X/Twitter / Crunchbase once official profiles exist.
        // Do not invent URLs — verified none exist as of this implementation.
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Intellign",
      description: SITE_TITLE,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Set theme before paint — no flash of wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`,
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Toaster position="top-right" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
