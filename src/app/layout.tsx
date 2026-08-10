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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.intellign.ai"),

  title: {
    default: "Intellign — The Math Layer Within AI",
    template: "%s | Intellign",
  },

  description:
    "Intellign turns plain-English optimization problems into formal mathematical models, solves them, and returns explainable assignments your team can defend.",

  applicationName: "Intellign",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: "Intellign",
    title: "Intellign — The Math Layer Within AI",
    description:
      "Intellign turns plain-English optimization problems into formal mathematical models, solves them, and returns explainable assignments your team can defend.",
    url: "https://www.intellign.ai/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Intellign — The Math Layer Within AI",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Intellign — The Math Layer Within AI",
    description:
      "Intellign turns plain-English optimization problems into formal mathematical models, solves them, and returns explainable assignments your team can defend.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Intellign",
  url: "https://www.intellign.ai",
  logo: "https://www.intellign.ai/logo.png",
  description:
    "Intellign is the math layer within AI, turning plain-English optimization problems into formal mathematical models, solving them, and returning explainable assignments.",
  sameAs: [
    // Add only real Intellign profiles
    "https://www.linkedin.com/company/...",
    "https://x.com/...",
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
