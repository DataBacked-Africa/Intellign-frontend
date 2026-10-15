"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "../faq-data";

export default function LdFaq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="faq" style={{ padding: "clamp(64px,8vw,112px) 0" }}>
      <div className="ld-wrap ld-split" style={{ alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="ld-eyebrow">Questions</div>
          <h2 className="ld-h">Before your first plan.</h2>
        </div>
        <div style={{ borderTop: "1px solid var(--ld-line2)" }}>
          {FAQ_ITEMS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} style={{ borderBottom: "1px solid var(--ld-line2)" }}>
                <button
                  type="button"
                  className="ld-faqbtn"
                  aria-expanded={isOpen}
                  aria-controls={`ld-faq-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="ld-mono" style={{ fontSize: 20, color: "var(--ld-accent)", flex: "none" }} aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <p id={`ld-faq-${i}`} style={{ margin: "0 0 22px", fontSize: 16, lineHeight: 1.65, color: "var(--ld-muted)", maxWidth: "38em" }}>{f.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
