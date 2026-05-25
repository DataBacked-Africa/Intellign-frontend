export default function CapabilityStrip() {
  return (
    <section className="mk-container cap-strip">
      <div className="cap">
        <div className="cap__num">01</div>
        <div className="cap__title">Plain language in.</div>
        <div className="cap__body">
          No solver syntax. No modelling expertise. Operators describe; the engine
          formalises.
        </div>
      </div>
      <div className="cap">
        <div className="cap__num">02</div>
        <div className="cap__title">Optimal out.</div>
        <div className="cap__body">
          A genetic algorithm tuned for assignment problems — guaranteed feasible,
          near-optimal at scale.
        </div>
      </div>
      <div className="cap">
        <div className="cap__num">03</div>
        <div className="cap__title">Explainable.</div>
        <div className="cap__body">
          Every output ships with a human-readable rationale. Auditable by ops,
          defensible to compliance.
        </div>
      </div>
    </section>
  );
}
