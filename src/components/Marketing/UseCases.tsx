"use client";

import { motion } from "framer-motion";
import { staggerContainer, popItem, viewportOnce } from "./motionVariants";

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
    eb: "Education",
    t: "Timetables that just work.",
    b: "Build school timetables · Place teachers across subjects · Balance classroom utilisation.",
  },
  {
    eb: "Public sector",
    t: "Fair allocation at scale.",
    b: "Assign field workers to regions · Plan rotating staff schedules · Allocate scarce resources fairly.",
    emph: true,
    wide: true,
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
            The same Intellign engine routes deliveries, schedules nurses, places
            teachers, allocates field officers. Anywhere a human is matching
            resources to demand by hand or by Excel, the engine fits.
          </p>
        </div>
        <motion.div
          className="uses__grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {CASES.map((c) => (
            <motion.div
              key={c.eb}
              variants={popItem}
              className={`use ${c.wide ? "use--wide" : ""} ${c.emph ? "bg-[var(--brand-maroon-deep)] text-[var(--brand-bone)]" : ""}`}
            >
              <div className={`use__eb ${c.emph ? "text-[var(--brand-bone)] opacity-70" : ""}`}>{c.eb}</div>
              <div className={`use__t ${c.emph ? "text-[var(--brand-bone)]" : ""}`}>{c.t}</div>
              <div className={`use__b ${c.emph ? "text-[var(--brand-bone)] opacity-75" : ""}`}>{c.b}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
