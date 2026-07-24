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
  title: "Intellign — The math layer within AI",
  description: "Describe the goal in plain English. Intellign formalises it, runs the solve, and hands back an assignment your team can defend.",
  metadataBase: new URL("https://www.intellign.ai"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Intellign — The math layer within AI",
    description: "Plain English in, explained optimization out — three chat turns from question to assignment.",
    url: "https://www.intellign.ai",
    siteName: "Intellign",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellign — The math layer within AI",
    description: "Plain English in, explained optimization out — three chat turns from question to assignment.",
  },
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
