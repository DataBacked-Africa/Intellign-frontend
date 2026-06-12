const STEPS = [
  { n: "01", t: "Describe",  b: "Plain English. Tell Intellign the goal, the constraints, and what counts as a good solve." },
  { n: "02", t: "Ingest",    b: "Drop in your CSV, point at an API, or stream from your system. Columns are inferred and explained." },
  { n: "03", t: "Translate", b: "Goals + constraints get formalised into a structured optimization problem.", emph: true },
  { n: "04", t: "Solve",     b: "The engine picks the right solver for the problem and runs it — typical solves finish in seconds." },
  { n: "05", t: "Explain",   b: "Every assignment ships with a human-readable rationale. Auditable, defensible, exportable." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="how">
      <div className="mk-container">
        <div className="section-header">
          <div className="eyebrow">How it works</div>
          <h2>Five steps from <em>question</em><br />to assignment.</h2>
          <p>
            The same five steps run whether you&apos;re rostering nurses, routing
            deliveries, or placing teachers. Intellign handles the translation
            and the solve; you handle the goal and the review.
          </p>
        </div>
        <div className="how__steps">
          {STEPS.map((s) => (
            <div key={s.n} className={`how__step ${s.emph ? "is-emph" : ""}`}>
              <div className="step-n">{s.n}</div>
              <div className="step-t">{s.t}</div>
              <div className="step-b">{s.b}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 px-[18px] py-4 bg-white border border-[var(--brand-bone-deep)] rounded-xl flex items-center gap-[14px] text-sm text-[var(--fg-secondary)] flex-wrap w-full overflow-hidden">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--brand-maroon)]">
            Example
          </span>
          <span className="font-display text-[18px] text-[var(--brand-maroon-deep)] italic flex-1 min-w-0">
            &ldquo;Build next week&apos;s roster for 24 nurses across 3 wards. Maximise fairness, cap overtime at 8h, honour all leave requests.&rdquo;
          </span>
          <span className="font-mono text-[18px] text-[var(--brand-maroon)]">→</span>
          <span className="font-mono text-[13px] text-[var(--fg-primary)] bg-[var(--brand-bone)] px-[14px] py-[10px] rounded-lg border-l-[3px] border-[var(--brand-maroon)]">
            structured roster + rationale,<br />returned in 4.2s.
          </span>
        </div>
      </div>
    </section>
  );
}
