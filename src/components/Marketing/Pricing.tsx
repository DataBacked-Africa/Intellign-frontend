"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem, viewportOnce } from "./motionVariants";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const TIERS = [
  {
    name: "Free",
    price: "$0",
    unit: "/ month",
    sub: "For individuals exploring the platform.",
    feats: ["Capped optimization prompts", "Limited dataset size", "10 datasets per month", "Community support"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$15",
    unit: "/ month",
    sub: "For SMEs and growing teams.",
    feats: ["Higher usage limits", "Faster processing", "Scheduling, routing, assignment", "Unlimited dataset creation", "Email and priority support"],
    cta: "Choose Pro",
    feature: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "",
    sub: "For regulated industries.",
    feats: ["Unlimited usage", "Custom integrations", "Dedicated support and SLAs", "Advanced compliance and constraints"],
    cta: "Talk to sales",
    href: "mailto:hello@databackedafrica.com",
  },
];

const API_TIER = {
  price: "$0.10",
  unit: "/ solve",
  sub: "A revenue layer for teams calling Intellign directly from their own product or AI agent.",
  feats: ["Subscription-based API access", "MCP and function-calling native", "Long-term enterprise contracts"],
  cta: "Read API docs",
  href: "/docs",
};

export default function Pricing() {
  return (
    <section id="pricing" className="pricing">
      <div className="mk-container">
        <div className="section-header">
          <div className="eyebrow">Pricing</div>
          <h2>Three tiers, plus a<br /><em>developer revenue layer</em>.</h2>
          <p>
            Start free, grow into Pro when you&apos;re moving real production work,
            and let your engineering team call the API directly when an LLM
            needs an optimisation answer.
          </p>
        </div>
        <motion.div
          className="pricing__grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {TIERS.map((t) => (
            <motion.div key={t.name} className={`tier ${t.feature ? "is-feature" : ""}`} variants={fadeUpItem}>
              <div className="tier__name">{t.name}</div>
              <div className="tier__price">{t.price}<small>{t.unit}</small></div>
              <div className="tier__sub">{t.sub}</div>
              <ul className="tier__feats">
                {t.feats.map((f) => (
                  <li key={f}><CheckIcon />{f}</li>
                ))}
              </ul>
              <div className="tier__cta">
                {(t as { href?: string }).href?.startsWith("mailto:") ? (
                  <a href={(t as { href?: string }).href} className="btn btn-primary">{t.cta}</a>
                ) : (
                  <Link href={(t as { href?: string }).href ?? "/auth/signup"} className="btn btn-primary">{t.cta}</Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="pricing__api"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pricing__api-info">
            <span className="pricing__api-eb">For developers</span>
            <h3>API access, {API_TIER.price}<small>{API_TIER.unit}</small></h3>
            <p>{API_TIER.sub}</p>
          </div>
          <ul className="pricing__api-feats">
            {API_TIER.feats.map((f) => (
              <li key={f}><CheckIcon />{f}</li>
            ))}
          </ul>
          <div className="pricing__api-cta">
            <Link href={API_TIER.href} className="btn btn-secondary">{API_TIER.cta}</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
