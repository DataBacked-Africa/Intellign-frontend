"use client";

import MarketingNav from "@/components/Marketing/MarketingNav";
import Hero from "@/components/Marketing/Hero";
import CapabilityStrip from "@/components/Marketing/CapabilityStrip";
import InterfaceShowcase from "@/components/Marketing/InterfaceShowcase";
import HowItWorks from "@/components/Marketing/HowItWorks";
import ProofStrip from "@/components/Marketing/ProofStrip";
import UseCases from "@/components/Marketing/UseCases";
import CodeSample from "@/components/Marketing/CodeSample";
import Pricing from "@/components/Marketing/Pricing";
import LaunchCta from "@/components/Marketing/LaunchCta";
import Faq from "@/components/Marketing/Faq";
import { FAQ_ITEMS } from "@/components/Marketing/faq-data";
import MarketingFooter from "@/components/Marketing/MarketingFooter";
import { motion } from "framer-motion";

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

export default function MarketingPage() {
  return (
    <div className="mk-page px-[5%]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <MarketingNav />
      <main>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <Hero />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.1 }}>
          <CapabilityStrip />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <InterfaceShowcase />
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <ProofStrip />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
          <HowItWorks />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
          <UseCases />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }}>
          <CodeSample />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
          <Pricing />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
          <Faq />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}>
          <LaunchCta />
        </motion.div>
      </main>
      <MarketingFooter />
    </div>
  );
}
