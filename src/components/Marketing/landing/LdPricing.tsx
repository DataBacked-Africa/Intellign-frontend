import Link from "next/link";
import { TIERS } from "./data";

function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function LdPricing() {
  return (
    <section id="pricing" style={{ padding: "clamp(64px,8vw,112px) 0", background: "var(--ld-surface)", borderTop: "1px solid var(--ld-line)" }}>
      <div className="ld-wrap" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="ld-eyebrow">Pricing</div>
          <h2 className="ld-h">Start free.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 16, alignItems: "stretch" }}>
          {TIERS.map((tier) => {
            const feat = "feat" in tier && tier.feat;
            const ink = feat ? "#F4EFE7" : "var(--ld-head)";
            const accent = feat ? "#D49AAA" : "var(--ld-accent)";
            const sub = feat ? "#D49AAA" : "var(--ld-faint)";
            const body = feat ? "#F4EFE7" : "var(--ld-ink2)";
            const btn = feat ? "ld-btn ld-btn-bone" : tier.name === "Enterprise" ? "ld-btn ld-btn-p" : "ld-btn ld-btn-out";
            const external = tier.href.startsWith("mailto:");
            return (
              <div key={tier.name} className={`ld-price${feat ? " feat" : ""}`}>
                <span className="ld-mono" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>{tier.name}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="ld-serif" style={{ fontSize: 56, lineHeight: 1, color: ink }}>{tier.price}</span>
                  <span style={{ fontSize: 14, color: sub }}>{tier.per}</span>
                </div>
                <ul className="ld-plist" style={{ color: body }}>
                  {tier.items.map((it) => (
                    <li key={it}><span style={{ color: accent, display: "inline-flex" }}><Tick /></span>{it}</li>
                  ))}
                </ul>
                {external
                  ? <a className={btn} href={tier.href} style={{ marginTop: "auto" }}>{tier.cta}</a>
                  : <Link className={btn} href={tier.href} style={{ marginTop: "auto" }}>{tier.cta}</Link>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
