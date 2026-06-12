"use client";

import { useState } from "react";

import { FAQ_ITEMS } from "./faq-data";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mk-container" style={{ padding: "72px 32px 88px" }}>
      <div className="section-header">
        <div className="eyebrow">FAQ</div>
        <h2>Questions, <em>answered</em>.</h2>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ background: "var(--neutral-0)", border: "1px solid var(--brand-bone-deep)", borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%", textAlign: "left", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 16, padding: "16px 20px",
                  background: "transparent", border: 0, cursor: "pointer",
                  fontSize: 16, fontWeight: 600, color: "var(--brand-maroon-deep)",
                  fontFamily: "inherit", minHeight: 44,
                }}
              >
                {item.q}
                <span aria-hidden="true" style={{
                  fontSize: 20, color: "var(--brand-maroon)", flexShrink: 0,
                  transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 180ms ease",
                }}>+</span>
              </button>
              {isOpen && (
                <p style={{ margin: 0, padding: "0 20px 18px", fontSize: 14.5, lineHeight: 1.6, color: "var(--neutral-700)" }}>
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
