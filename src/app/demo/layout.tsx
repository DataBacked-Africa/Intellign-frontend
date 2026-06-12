import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Demo — Intellign",
  description:
    "Click through a real optimization: 50 NYSC healthcare graduates assigned to 20 primary health facilities in three chat turns. No signup needed.",
  alternates: { canonical: "/demo" },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
