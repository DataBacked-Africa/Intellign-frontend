"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function ChatMock() {
  return (
    <div className="mock">
      <div className="mock__sidebar">
        <div className="mock__brand">
          Intellign
          <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--brand-maroon)", display: "inline-block", verticalAlign: 1, marginLeft: 2 }} />
        </div>
        <div className="mock__sb-item is-active"><span className="dot" />New chat</div>
        <div className="mock__sb-sec">Workspaces</div>
        <div className="mock__sb-item"><span className="dot" />Developer playground</div>
        <div className="mock__sb-sec">Recents</div>
        <div className="mock__sb-item">Q4 nurse roster</div>
        <div className="mock__sb-item">Logistics routes</div>
        <div className="mock__sb-item">Teacher placement</div>
      </div>
      <div className="mock__main">
        <div className="mock__top">Intellign AI</div>
        <div className="mock__body">
          <div className="mock__ctxbar">
            <span className="ch-eb">Active problem</span>
            <span className="ch-chip"><b>Healthcare deployment</b></span>
            <span className="ch-chip"><b>124</b> resources · <b>48</b> targets</span>
            <span className="ch-status"><span className="dot" />Ready</span>
          </div>
          <div className="mock__readiness">
            <span className="ck done">✓ Data</span>
            <span className="ck done">✓ Rules</span>
            <span className="ck done">✓ Goals</span>
            <span className="ck done">✓ Ready</span>
          </div>
          <div className="mock__msg">
            <div className="av bot" />
            <div className="bub">
              I&apos;ve inspected the workspace and found two tables that look like the right inputs. Confirm and I&apos;ll structure the dataset.
            </div>
          </div>
          <div className="mock__msg user">
            <div className="av user" />
            <div className="bub">Accept and continue.</div>
          </div>
          <div className="mock__msg">
            <div className="av bot" />
            <div className="bub">
              Working on it, balancing qualifications, overtime caps, and fairness across every ward.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatWithCanvasMock() {
  return (
    <div className="mock mock--has-canvas">
      <div className="mock__sidebar">
        <div className="mock__brand">
          Intellign
          <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--brand-maroon)", display: "inline-block", verticalAlign: 1, marginLeft: 2 }} />
        </div>
        <div className="mock__sb-item is-active"><span className="dot" />New chat</div>
        <div className="mock__sb-sec">Workspaces</div>
        <div className="mock__sb-item"><span className="dot" />Developer playground</div>
      </div>
      <div className="mock__main mock__chat">
        <div className="mock__top">Intellign AI</div>
        <div className="mock__body">
          <div className="mock__ctxbar">
            <span className="ch-eb">Problem</span>
            <span className="ch-chip"><b>Healthcare</b></span>
            <span className="ch-status" style={{ color: "#B45309" }}>
              <span className="dot" style={{ background: "#F59E0B" }} />Solving…
            </span>
          </div>
          <div className="mock__msg">
            <div className="av bot" />
            <div className="bub">Working it out now, watch it live →</div>
          </div>
        </div>
      </div>
      <div className="mock__canvas">
        <div className="mock__canvas-head">
          <span className="dot" />Healthcare
        </div>
        <div className="mock__canvas-tabs">
          <span className="is-active">Progress</span>
          <span>Results</span>
          <span>Assignments</span>
        </div>
        <div className="mock__canvas-body">
          <div className="mock__metric-lbl">Assignments placed</div>
          <div className="mock__metric">46 / 50</div>
          <div className="mock__metric-lbl" style={{ marginTop: 10 }}>Plan quality</div>
          <div className="mock__metric">98%</div>
          <svg width="100%" height="50" viewBox="0 0 160 50" preserveAspectRatio="none" style={{ marginTop: 12 }}>
            <defs>
              <linearGradient id="cm-g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#5C1427" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#5C1427" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,46 C30,44 55,32 80,18 S130,4 160,3 L160,50 L0,50 Z" fill="url(#cm-g)" />
            <path d="M0,46 C30,44 55,32 80,18 S130,4 160,3" fill="none" stroke="#5C1427" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PlaygroundMock() {
  return (
    <div className="mock">
      <div className="mock__sidebar">
        <div className="mock__brand">
          Intellign
          <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--brand-maroon)", display: "inline-block", verticalAlign: 1, marginLeft: 2 }} />
        </div>
        <div className="mock__sb-item"><span className="dot" />New chat</div>
        <div className="mock__sb-sec">Workspaces</div>
        <div className="mock__sb-item is-active"><span className="dot" />Developer playground</div>
        <div className="mock__sb-sec">Recents</div>
        <div className="mock__sb-item">Q4 nurse roster</div>
      </div>
      <div className="mock__main" style={{ background: "var(--brand-bone)" }}>
        <div className="mock__top">Developer playground</div>
        <div className="mock__body">
          <div className="mock__pg-head">
            <div>
              <div className="pg-eb">Problem · 0a8f3c</div>
              <div className="pg-title">Q4 nurse roster</div>
            </div>
          </div>
          <div className="mock__pg-cfg">
            <span className="lbl">Configuration</span>
            <span className="sum">
              <span>LLM <b>Claude</b></span>
              <span>Solver <b>GA</b></span>
              <span>Pop <b>256</b></span>
            </span>
          </div>
          <div className="mock__pg-sec">
            <span className="num">01</span>
            <span className="ti">Goal</span>
            <span className="pl">Minimize overtime, balance across wards…</span>
          </div>
          <div className="mock__pg-sec">
            <span className="num">02</span>
            <span className="ti">Constraints</span>
            <span className="pl">≥3 nurses / shift · ≤48h / week · …</span>
          </div>
          <div className="mock__pg-sec">
            <span className="num">03</span>
            <span className="ti">Resources</span>
            <span className="pl">240 nurses · 240 shifts · roster.csv</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 6 }}>
            <span style={{ fontSize: 10, padding: "5px 10px", borderRadius: 4, background: "transparent", border: "1px solid var(--neutral-300)", color: "var(--fg-secondary)" }}>Save draft</span>
            <span style={{ fontSize: 10, padding: "5px 10px", borderRadius: 4, background: "var(--brand-maroon)", color: "var(--brand-bone)", fontWeight: 600 }}>Solve problem</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type PanelConfig = {
  id: string;
  label: string;
  who: string;
  title: React.ReactNode;
  body: string;
  bullets: string[];
  Mock: React.ComponentType;
  CanvasMock: React.ComponentType | null;
};

const PANELS: PanelConfig[] = [
  {
    id: "chat",
    label: "Smart Chat",
    who: "For operators and enterprises",
    title: <>Move <em>existing</em> optimization tasks into a chat.</>,
    body: "Hospital schedulers, logistics ops, public-sector planners, describe the goal, drop in your CSVs, and Intellign builds the problem with you. No syntax, no modelling expertise, but every step shows its work: the data it read, the columns it understood, and how it worked out the plan.",
    bullets: [
      "Active-problem context bar, readiness checks tell you exactly what's missing.",
      "Optimization runs in a live view: watch progress, expand goals, review assignments without losing your place.",
      "Every assignment row carries a rationale, auditable by ops, defensible to compliance.",
      "Dataset preview and progress are inline in the conversation, never behind a modal.",
    ],
    Mock: ChatMock,
    CanvasMock: ChatWithCanvasMock,
  },
  {
    id: "playground",
    label: "Developer playground",
    who: "For builders and power users",
    title: <>Wire the <em>solver</em> by hand.</>,
    body: "When the conversational path is overkill, the playground gives you the explicit form: structured Goal / Constraints / Resources blocks, a Configuration panel with LLM + solver pickers, and a convergence chart you can pause and inspect. Built for the engineer who wants to feel every parameter.",
    bullets: [
      "Pick the LLM (Claude, GPT-4, Gemini, custom endpoint) and the solver (GA, CP, LP, simulated annealing).",
      "Tune hyperparameters live: population, generations, crossover, mutation.",
      "Per-shift rationale with factor-level scoring, qualification fit, hours under cap, fairness rotation.",
      "Same workspace and recents as Smart Chat, switch any time without losing context.",
    ],
    Mock: PlaygroundMock,
    CanvasMock: null,
  },
];

export default function InterfaceShowcase() {
  const [activeId, setActiveId] = useState("chat");
  const [showCanvas, setShowCanvas] = useState(false);

  const panel = PANELS.find((p) => p.id === activeId)!;
  const MockToRender = activeId === "chat" && showCanvas && panel.CanvasMock
    ? panel.CanvasMock
    : panel.Mock;

  return (
    <section id="product" className="showcase">
      <div className="mk-container mk-container--wide">
        <div className="section-header">
          <div className="eyebrow">The product</div>
          <h2>Two ways<br />to work.</h2>
          <p>
            Same engine underneath. Pick the surface that matches you, a
            chat for teams moving existing tasks in, a structured playground
            for developers who want to wire it by hand.
          </p>
        </div>

        <div className="showcase__tab-row">
          <div className="showcase__tabs">
            {PANELS.map((p) => (
              <button
                key={p.id}
                className={activeId === p.id ? "is-active" : ""}
                onClick={() => { setActiveId(p.id); setShowCanvas(false); }}
                style={{ position: "relative" }}
              >
                {activeId === p.id && (
                  <motion.span
                    layoutId="showcase-tab-pill"
                    className="showcase__tab-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="showcase__panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              className="showcase__copy"
              style={{ minWidth: 0 }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="who">{panel.who}</div>
              <h3>{panel.title}</h3>
              <p>{panel.body}</p>
              <ul>
                {panel.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/auth/signup" className="btn btn-primary">
                  Try {panel.label.toLowerCase()}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                {panel.id === "chat" && panel.CanvasMock && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCanvas((c) => !c)}
                  >
                    {showCanvas ? "Hide live view" : "Watch it solve"}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeId}-${showCanvas}`}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <MockToRender />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--neutral-500)", marginTop: 18, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
        Illustrative interface, explore the real thing in the <a href="/demo" style={{ color: "var(--brand-maroon)", textDecoration: "underline" }}>live demo</a>.
      </p>
    </section>
  );
}
