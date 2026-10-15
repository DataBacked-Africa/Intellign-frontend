import type { Metadata } from "next";
import LegalPage from "@/components/Marketing/landing/LegalPage";
import { TERMS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Intellign, including the workspace, API, SDK and MCP server.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
