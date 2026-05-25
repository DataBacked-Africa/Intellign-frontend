const CASES = [
  {
    eb: "Healthcare",
    t: "Schedules and routes for care.",
    b: "Schedule nurses across wards · Assign patients to doctors · Plan home-care visit routes · Optimise ambulance dispatch.",
  },
  {
    eb: "Logistics",
    t: "Routes that save fuel and hours.",
    b: "Plan multi-stop delivery routes · Assign drivers to deliveries · Reduce fuel + idle costs · Re-optimise on the fly.",
  },
  {
    eb: "Public sector",
    t: "Fair allocation at scale.",
    b: "Assign field workers to regions · Plan rotating staff schedules · Allocate scarce resources fairly.",
    emph: true,
  },
  {
    eb: "Education",
    t: "Timetables that just work.",
    b: "Build school timetables · Place teachers across subjects · Balance classroom utilisation.",
  },
  {
    eb: "Business ops",
    t: "Workload balanced.",
    b: "Assign tasks to employees · Manage team workload · Plan operations efficiently.",
  },
];

export default function UseCases() {
  return (
    <section id="uses" className="uses">
      <div className="mk-container">
        <div className="section-header">
          <div className="eyebrow">Use cases</div>
          <h2>One engine.<br /><em>Multiple</em> industries.</h2>
          <p>
            The same Intellign call routes deliveries, schedules nurses, places
            teachers, allocates field officers. Anywhere a human is matching
            resources to demand by hand or by Excel, the engine fits.
          </p>
        </div>
        <div className="uses__grid">
          {CASES.map((c) => (
            <div
              key={c.eb}
              className="use"
              style={c.emph ? { background: "var(--brand-maroon-deep)", color: "var(--brand-bone)" } : undefined}
            >
              <div className="use__eb" style={c.emph ? { color: "var(--brand-bone)", opacity: 0.7 } : undefined}>{c.eb}</div>
              <div className="use__t" style={c.emph ? { color: "var(--brand-bone)" } : undefined}>{c.t}</div>
              <div className="use__b" style={c.emph ? { color: "rgba(244,239,231,0.75)" } : undefined}>{c.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
