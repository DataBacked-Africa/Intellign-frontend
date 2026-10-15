import "@/components/Marketing/landing/landing.css";
import LdNav from "@/components/Marketing/landing/LdNav";
import LdHero from "@/components/Marketing/landing/LdHero";
import LdStory from "@/components/Marketing/landing/LdStory";
import LdConnect from "@/components/Marketing/landing/LdConnect";
import LdCases from "@/components/Marketing/landing/LdCases";
import LdProof from "@/components/Marketing/landing/LdProof";
import LdPricing from "@/components/Marketing/landing/LdPricing";
import LdFaq from "@/components/Marketing/landing/LdFaq";
import LdClose from "@/components/Marketing/landing/LdClose";
import LdFooter from "@/components/Marketing/landing/LdFooter";
import { FAQ_ITEMS } from "@/components/Marketing/faq-data";

const SITE_URL = "https://www.intellign.ai";

// References the Organization/WebSite declared once in src/app/layout.tsx via
// @id, rather than redeclaring them here — avoids duplicate/conflicting
// Organization entities across pages.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "Intellign — The Math Layer Within AI",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      description:
        "Intellign turns plain-English optimization problems into formal mathematical models, solves them, and returns explainable assignments your team can defend.",
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Intellign",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Optimization as a service: describe assignment, scheduling, routing, allocation or matching problems in plain English and get explained, auditable solutions.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free tier" },
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

// Server component: the interactive sections are client components of their
// own, so the static copy and the JSON-LD above ship as plain HTML.
export default function MarketingPage() {
  return (
    <div className="ld">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <LdNav home />
      <main>
        <LdHero />
        <LdStory />
        <LdConnect />
        <section style={{ padding: "clamp(64px,8vw,112px) 0" }}>
          <div className="ld-wrap"><LdCases /></div>
        </section>
        <LdProof />
        <LdPricing />
        <LdFaq />
        <LdClose />
      </main>
      <LdFooter home />
    </div>
  );
}
