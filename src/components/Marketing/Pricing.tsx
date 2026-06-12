import Link from "next/link";

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
  {
    name: "API · developers",
    price: "$0.10",
    unit: "/ solve",
    sub: "A revenue layer for AI builders.",
    feats: ["Subscription-based API access", "MCP and function-calling native", "Long-term enterprise contracts"],
    cta: "Read API docs",
    href: "/docs",
  },
];

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
        <div className="pricing__grid">
          {TIERS.map((t) => (
            <div key={t.name} className={`tier ${t.feature ? "is-feature" : ""}`}>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
