"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "./motionVariants";

const ROSTER_ROWS = [
  ["A. Kalu", "Ward 1", "Day"],
  ["B. Musa", "Ward 2", "Night"],
  ["C. Bello", "Ward 3", "Day"],
  ["D. Eze", "Ward 1", "Night"],
] as const;

export default function Hero() {
  return (
    <section id="top" className="mk-container hero">
      <motion.div
        className="hero__copy"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div className="eyebrow" variants={fadeUpItem}>AI for business operations</motion.div>
        <motion.h1 variants={fadeUpItem}>Stop guessing.<br /><em>Start optimizing.</em></motion.h1>

        <motion.p className="hero__lede" variants={fadeUpItem}>
          Describe the problem in plain English.
        </motion.p>
        <motion.p className="hero__lede hero__lede--soft" variants={fadeUpItem}>
          Intellign works out the best schedule, route, or assignment for
          your team, and shows you exactly why, so the result is one you
          can trust and defend.
        </motion.p>

        <motion.div className="hero__cta" variants={fadeUpItem}>
          <Link href="/workspace" className="btn btn-primary btn-lg">
            Launch app
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link href="/demo" className="btn btn-secondary btn-lg">Try the live demo</Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero__visual-wrap"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hero__visual" style={{ width: "100%" }}>
            <div className="hero__visual-head">
              <span className="hero__visual-dot" />
              <span className="hero__visual-dot" />
              <span className="hero__visual-dot" />
              <span className="hero__visual-title">This week&apos;s roster</span>
              <span className="hero__visual-live">
                <span className="live-dot" /> ready to publish
              </span>
            </div>

            <div className="hero__term">
              <div className="hero__term-row">
                <span className="hero__term-prompt">You:</span>
                <span className="hero__term-cmd">Roster 24 nurses across 3 wards. Cap overtime at 8h, keep it fair.</span>
              </div>

              <div className="hero__term-meta">
                <span className="hero__term-meta-row">
                  <span className="hero__term-meta-k">goal</span>
                  <span className="hero__term-meta-v">Balanced roster, overtime capped</span>
                </span>
                <span className="hero__term-meta-row">
                  <span className="hero__term-meta-k">staff</span>
                  <span className="hero__term-meta-v">24</span>
                  <span className="hero__term-meta-sep">·</span>
                  <span className="hero__term-meta-k">wards</span>
                  <span className="hero__term-meta-v">3</span>
                </span>
              </div>

              <motion.div
                className="hero__term-table"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { delayChildren: 0.35, staggerChildren: 0.06 } },
                }}
              >
                <div className="hero__term-table-head">
                  <span>Nurse</span>
                  <span>Ward</span>
                  <span>Shift</span>
                </div>
                {ROSTER_ROWS.map(([n, w, s], i) => (
                  <motion.div key={i} className="hero__term-table-row" variants={fadeUpItem}>
                    <span>{n}</span>
                    <span>{w}</span>
                    <span>{s}</span>
                  </motion.div>
                ))}
                <motion.div className="hero__term-table-row is-converged" variants={fadeUpItem}>
                  <span>24 nurses</span>
                  <span>0 breaches</span>
                  <span>4.1s</span>
                  <span className="conv-tag">explained</span>
                </motion.div>
              </motion.div>
            </div>
        </div>
      </motion.div>

      {/* <div className="hero__trust">
        <span className="trust-item">No coding required</span>
        <span className="trust-item">Every decision explained</span>
      </div> */}
    </section>
  );
}
