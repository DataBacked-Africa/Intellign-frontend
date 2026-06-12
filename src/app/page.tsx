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

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "DataBacked Africa",
      url: "https://intellign.databackedafrica.com",
      email: "hello@databackedafrica.com",
    },
    {
      "@type": "SoftwareApplication",
      name: "Intellign",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Optimization as a service — describe assignment, scheduling or routing problems in plain English and get explained, auditable solutions.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free tier" },
      url: "https://intellign.databackedafrica.com",
    },
    {
      "@type": "FAQPage",
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
    <div className="mk-page">
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
