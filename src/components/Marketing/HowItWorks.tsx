const STEPS = [
  { n: "01", t: "Describe",  b: "Plain English. Tell Intellign the goal, the constraints, and what counts as a good solve." },
  { n: "02", t: "Ingest",    b: "Drop in your CSV, point at an API, or stream from your system. Columns are inferred and explained." },
  { n: "03", t: "Translate", b: "Goals + constraints get formalised into a structured optimization problem.", emph: true },
  { n: "04", t: "Solve",     b: "The genetic algorithm core runs for as long as it needs — usually seconds, never more than 60." },
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
        <div style={{
          marginTop: 24, padding: "16px 18px",
          background: "#fff", border: "1px solid var(--brand-bone-deep)", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 14, fontSize: 14, color: "var(--fg-secondary)",
          flexWrap: "wrap", width: "100%", overflow: "hidden",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand-maroon)" }}>
            Example
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--brand-maroon-deep)", fontStyle: "italic", flex: 1, minWidth: 0 }}>
            &ldquo;Build next week&apos;s roster for 24 nurses across 3 wards. Maximise fairness, cap overtime at 8h, honour all leave requests.&rdquo;
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--brand-maroon)" }}>→</span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-primary)",
            background: "var(--brand-bone)", padding: "10px 14px", borderRadius: 8,
            borderLeft: "3px solid var(--brand-maroon)",
          }}>
            structured roster + rationale,<br />returned in 4.2s.
          </span>
        </div>
      </div>
    </section>
  );
}
