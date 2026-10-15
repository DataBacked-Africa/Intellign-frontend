import type { Metadata } from "next";
import LegalPage from "@/components/Marketing/landing/LegalPage";
import { PRIVACY } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data Intellign collects, why, who it is shared with, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
