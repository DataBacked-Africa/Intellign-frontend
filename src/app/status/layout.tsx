import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Status — Intellign",
  description: "Live status of Intellign services: chat API, data ingestion, dataset generation, optimization engine.",
  alternates: { canonical: "/status" },
  robots: { index: true, follow: true },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
