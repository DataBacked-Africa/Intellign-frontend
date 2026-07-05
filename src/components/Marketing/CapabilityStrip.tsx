"use client";

import { motion } from "framer-motion";
import { staggerContainer, popItem, viewportOnce } from "./motionVariants";

const ITEMS = [
  {
    n: "01",
    t: "Scheduling, by hand.",
    b: "Rosters built on a spreadsheet miss fairness, break overtime rules, or leave a shift short, and nobody notices until it hurts.",
  },
  {
    n: "02",
    t: "Routes, guessed.",
    b: "Manual routing wastes fuel and hours that quietly add up across a fleet, a week, a year.",
  },
  {
    n: "03",
    t: "Matching, that doesn't scale.",
    b: "Assigning people to places by hand gets slower and less fair as the list on both sides grows.",
  },
];

export default function CapabilityStrip() {
  return (
    <section className="mk-container cap-strip">
      <div className="section-header">
        <div className="eyebrow">The cost of guesswork</div>
        <h2>Guesswork has a cost.<br />Most businesses just don&apos;t <em>see it</em>.</h2>
        <p>
          Scheduling hundreds of nurses. Routing delivery fleets across a city.
          Assigning field officers to districts. Every growing operation runs
          into puzzles like these, solved today with expensive software,
          endless spreadsheets, or a manager&apos;s best guess. Standard AI
          chatbots don&apos;t help: they can talk about the problem, but they
          can&apos;t reliably do the math.
        </p>
      </div>
      <motion.div
        className="cap-strip__grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
      >
        {ITEMS.map((item) => (
          <motion.div key={item.n} className="cap" variants={popItem}>
            <div className="cap__num">{item.n}</div>
            <div className="cap__title">{item.t}</div>
            <div className="cap__body">{item.b}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
