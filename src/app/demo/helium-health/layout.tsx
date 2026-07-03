import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helium Health Demo — Intellign",
  description:
    "Three HeliumOS optimization opportunities — bed assignment, appointment scheduling, and ward personnel assignment — with real generated data and real solver runs.",
  alternates: { canonical: "/demo/helium-health" },
};

export default function HeliumHealthDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
