"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem, viewportOnce } from "./motionVariants";

const STEPS = [
  { n: "01", t: "Describe", b: "Plain English. Tell Intellign the goal, the constraints, and what counts as a good outcome." },
  { n: "02", t: "Ingest",   b: "Drop in your CSV, point at an API, or stream from your system. Columns are inferred and explained." },
  { n: "03", t: "Solve",    b: "Intellign works out the best answer, picking the right approach for your problem and running it, usually in seconds.", emph: true },
  { n: "04", t: "Explain",  b: "Every assignment ships with a human-readable rationale. Auditable, defensible, exportable." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="how">
      <div className="mk-container">
        <div className="section-header">
          <div className="eyebrow">How it works</div>
          <h2>Four steps from <em>question</em><br />to assignment.</h2>
          <p>
            The same four steps run whether you&apos;re rostering nurses, routing
            deliveries, or placing teachers. Intellign handles the solve;
            you handle the goal and the review.
          </p>
        </div>
        <motion.div
          className="how__steps"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {STEPS.map((s) => (
            <motion.div key={s.n} className={`how__step ${s.emph ? "is-emph" : ""}`} variants={fadeUpItem}>
              <div className="step-n">{s.n}</div>
              <div className="step-t">{s.t}</div>
              <div className="step-b">{s.b}</div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          className="mt-6 px-[18px] py-4 bg-white border border-[var(--brand-bone-deep)] rounded-xl flex items-center gap-[14px] text-sm text-[var(--fg-secondary)] flex-wrap w-full overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--brand-maroon)]">
            Example
          </span>
          <span className="font-display text-[18px] text-[var(--brand-maroon-deep)] italic flex-1 min-w-0">
            &ldquo;Build next week&apos;s roster for 24 nurses across 3 wards. Maximise fairness, cap overtime at 8h, honour all leave requests.&rdquo;
          </span>
          <motion.span
            className="font-mono text-[18px] text-[var(--brand-maroon)]"
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            →
          </motion.span>
          <span className="font-mono text-[13px] text-[var(--fg-primary)] bg-[var(--brand-bone)] px-[14px] py-[10px] rounded-lg border-l-[3px] border-[var(--brand-maroon)]">
            structured roster + rationale,<br />returned in 4.2s.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
