"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DOMAINS, KIND_LABEL, ROSTER_PATTERN, STATUS_LABEL, type Tok } from "./data";

const isTok = (p: string | Tok): p is Tok => typeof p !== "string";

export default function LdHero() {
  const [domain, setDomain] = useState<string>("health");
  const [sel, setSel] = useState(0);

  const d = DOMAINS[domain];
  const toks = useMemo(() => d.parts.filter(isTok), [d]);
  const cur = toks[Math.min(sel, toks.length - 1)];
  const ready = toks.filter((p) => p.st === "ok").length;
  let n = -1;

  return (
    <section className="ld-hero">
      <div className="ld-wrap ld-hero-in">
        <div className="ld-col" style={{ flex: "1 1 380px", minWidth: 0, gap: 28 }}>
          <div className="ld-eyebrow">For anyone who plans people, routes or resources</div>
          <h1 className="ld-h1">The best plan, <em>proven.</em></h1>
          <p style={{ margin: 0, fontSize: "clamp(17px,1.7vw,20px)", lineHeight: 1.55, color: "var(--ld-muted)", maxWidth: "30em" }}>
            Tell Intellign what you need in plain English. Get back a schedule, route or assignment that follows every rule, with the reason for each decision.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 24px" }}>
            <div className="ld-track">
              <span className="ld-track-l">I plan people, routes or resources</span>
              <div><Link className="ld-btn ld-btn-p" href="/workspace">Try it free</Link></div>
            </div>
            <div className="ld-track">
              <span className="ld-track-l">I build with an API</span>
              <div><a className="ld-btn ld-btn-out" href="#connect">Connect your system</a></div>
            </div>
          </div>
        </div>

        <div id="demo" className="ld-col" style={{ flex: "1 1 540px", minWidth: 0, gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <span className="ld-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ld-accent)" }}>Tap any part of the sentence</span>
            <span className="ld-mono" style={{ fontSize: 11, color: "var(--ld-faint)" }}>Example, not live data</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Example problems">
            {Object.entries(DOMAINS).map(([key, dom]) => (
              <button
                key={key}
                type="button"
                className={`ld-dtab${key === domain ? " on" : ""}`}
                aria-pressed={key === domain}
                onClick={() => { setDomain(key); setSel(0); }}
              >
                {dom.label}
              </button>
            ))}
          </div>

          <div className="ld-demo-card">
            <p className="ld-sentence">
              {d.parts.map((p, i) => {
                if (!isTok(p)) return <span key={i}>{p}</span>;
                n += 1;
                const idx = n;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`ld-tok ld-k-${p.k}${idx === sel ? " sel" : ""}`}
                    aria-pressed={idx === sel}
                    onClick={() => setSel(idx)}
                  >
                    {p.text}
                  </button>
                );
              })}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid var(--ld-line)", paddingTop: 14 }}>
              {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
                <span key={k} className={`ld-kchip ld-k-${k}`}>{KIND_LABEL[k]}</span>
              ))}
            </div>

            <div className="ld-detail" aria-live="polite">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className={`ld-kchip ld-k-${cur.k}`}>{KIND_LABEL[cur.k]}</span>
                <span className={`ld-kchip ld-st-${cur.st}`}>{STATUS_LABEL[cur.st]}</span>
              </div>
              <div className="ld-serif" style={{ fontSize: 24, lineHeight: 1.2, color: "var(--ld-head)" }}>“{cur.text}”</div>
              <div className="ld-col" style={{ gap: 6 }}>
                <span className="ld-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ld-faint)" }}>Becomes</span>
                <pre className="ld-mono" style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--ld-ink)", background: "var(--ld-page)", padding: "10px 12px", borderRadius: 2 }}>{cur.formal}</pre>
              </div>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ld-muted)" }}>{cur.note}</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, borderTop: "1px solid var(--ld-line)", paddingTop: 14 }}>
              <div className="ld-plangrid" aria-hidden="true">
                {ROSTER_PATTERN.slice(0, 37).split("").map((c, i) => (
                  <span key={i} className={`ld-cell${c === "1" ? " on" : ""}`} />
                ))}
              </div>
              <div className="ld-col" style={{ gap: 4, minWidth: 0, flex: "1 1 200px" }}>
                <span className="ld-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ld-accent)" }}>Then, your plan</span>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ld-ink)" }}>{d.plan}</span>
                <span className="ld-mono" style={{ fontSize: 12, color: "var(--ld-muted)" }}>
                  {toks.length} parts understood · {ready} ready · {toks.length - ready} need you
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
