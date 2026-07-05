"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { FAQ_ITEMS } from "./faq-data";
import { staggerContainer, fadeUpItem, viewportOnce } from "./motionVariants";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mk-container" style={{ padding: "72px 32px 88px" }}>
      <div className="section-header">
        <div className="eyebrow">FAQ</div>
        <h2>Questions, <em>answered</em>.</h2>
      </div>
      <motion.div
        style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
      >
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={i}
              variants={fadeUpItem}
              style={{ background: "var(--neutral-0)", border: "1px solid var(--brand-bone-deep)", borderRadius: 12, overflow: "hidden" }}
            >
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
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ fontSize: 20, color: "var(--brand-maroon)", flexShrink: 0, display: "inline-block" }}
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <p style={{ margin: 0, padding: "0 20px 18px", fontSize: 14.5, lineHeight: 1.6, color: "var(--neutral-700)" }}>
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
