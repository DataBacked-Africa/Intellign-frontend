"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, popItem, viewportOnce } from "./motionVariants";

/**
 * Social-proof section. Pre-launch honest version: one pilot story (the NYSC
 * healthcare deployment, also the live demo's dataset) + stat chips from real
 * verified runs. Swap in design-partner logos and quotes as they land.
 */
const STATS = [
  { value: "3 turns", label: "from first message to optimization run" },
  { value: "~40s", label: "to generate a realistic two-table sample dataset" },
  { value: "50/50", label: "resources assigned in the pilot solve, every one explained" },
  { value: "13+", label: "file formats ingested, CSV, Excel, Parquet, GeoPackage…" },
];

export default function ProofStrip() {
  return (
    <section className="mk-container" style={{ padding: "72px 32px" }}>
      <div className="section-header">
        <div className="eyebrow">Proven on real problems</div>
        <h2>Built against a <em>national-scale</em> deployment.</h2>
        <p>
          Intellign&apos;s pilot case study assigns NYSC healthcare graduates to
          primary health facilities across Nigeria, matching specializations,
          honouring capacity, prioritising disease burden. It&apos;s the same
          scenario you can click through in the live demo.
        </p>
      </div>

      <motion.div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14, marginTop: 8,
        }}
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
      >
        {STATS.map((s) => (
          <motion.div
            key={s.value}
            variants={popItem}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            style={{
              background: "var(--neutral-0)", border: "1px solid var(--brand-bone-deep)",
              borderRadius: 12, padding: "20px 18px",
            }}
          >
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 34, lineHeight: 1,
              color: "var(--brand-maroon)", letterSpacing: "-0.02em",
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--neutral-700)", marginTop: 8, lineHeight: 1.45 }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <Link href="/demo" className="btn btn-secondary">
          Walk through the case study →
        </Link>
      </div>
    </section>
  );
}
