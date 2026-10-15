"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ROSTER_PATTERN, STORY_STEPS } from "./data";

/**
 * "How it works": five flat sheets on a sticky stage, driven by a numbered rail.
 * The active step opens its sheet and the sheets after it drop to make room.
 * One value, `active`, drives both columns, so they can't drift apart.
 */
const SHEETS = [
  { n: "01 · Connect", id: "step-connect" },
  { n: "02 · Check", id: "step-check" },
  { n: "03 · Understand", id: "step-understand" },
  { n: "04 · Solve", id: "step-solve" },
  { n: "05 · Your plan", id: "step-plan" },
] as const;

const GRID = (ROSTER_PATTERN + ROSTER_PATTERN).slice(0, 42);

export default function LdStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!("IntersectionObserver" in window)) { setActive(4); return; }
    // A step becomes active when it crosses the middle band of the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const deck = Math.min(active, 4); // the closing step keeps the plan sheet open

  const goto = (i: number) => {
    const el = stepRefs.current[i];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="how" className="ld-story-sec">
      <div className="ld-wrap">
        <div className="ld-eyebrow" style={{ color: "#D49AAA" }}>How it works</div>
        <h2 className="ld-h" style={{ color: "#F4EFE7", maxWidth: "14em", marginTop: 16 }}>Five layers between your data and your plan.</h2>

        <div className="ld-story">
          <div className="ld-stage">
            <div className="ld-deck" aria-label="The five layers">
              {SHEETS.map((s, i) => {
                const cls = [`ld-sheet`, `ld-s${i}`, i === deck ? "on" : "", i < deck ? "done" : "", i > deck ? "after" : ""].filter(Boolean).join(" ");
                return (
                  <button key={s.id} type="button" className={cls} onClick={() => goto(i)} aria-label={`Go to step ${s.n}`} aria-current={i === deck}>
                    <span className="ld-sh-num">{s.n}</span>
                    <span className="ld-sh-body">
                      {i === 0 && <>
                        <span className="ld-schips"><span className="ld-schip">staff.csv</span><span className="ld-schip">leave.xlsx</span></span>
                        <span>24 rows · 6 columns, read as they are</span>
                      </>}
                      {i === 1 && <>
                        <span className="ld-schips"><span className="ld-schip">24 nurses</span><span className="ld-schip">3 gaps → asked</span></span>
                        <span>Skill level is missing for 3 nurses. Intellign asks you instead of guessing.</span>
                      </>}
                      {i === 2 && <>
                        <span className="ld-sh-q">“nobody works 4 nights in a row”</span>
                        <span className="ld-schips"><span className="ld-schip">nights in a row ≤ 3</span><span className="ld-schip">confirmed</span></span>
                      </>}
                      {i === 3 && <>
                        <span className="ld-sh-row"><span className="ld-sh-stat">quality score shown</span><span className="ld-sh-stat">rules re-checked</span><span className="ld-sh-stat">4.2 s</span></span>
                        <span>Every rule is checked again before you see the result.</span>
                      </>}
                      {i === 4 && <>
                        <span className="ld-sgrid" aria-hidden="true">
                          {GRID.split("").map((c, k) => <span key={k} className={`ld-scell${c === "1" ? " on" : ""}`} />)}
                        </span>
                        <span className="ld-schips"><span className="ld-schip">84 shifts</span><span className="ld-schip">84 reasons</span></span>
                      </>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ld-steps">
            <div className="ld-rail">
              {STORY_STEPS.map((s, i) => (
                <div
                  key={s.id}
                  id={s.id}
                  data-step={i}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  className={`ld-step${i === active ? " on" : ""}`}
                >
                  <div className="ld-tile">{"cta" in s ? "→" : i + 1}</div>
                  <div>
                    <span className="ld-kicker">{s.kicker}</span>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                    {"pills" in s && (
                      <div className="ld-pillrow">
                        {s.pills.map((p) => <span key={p} className="ld-pill">{p}</span>)}
                      </div>
                    )}
                    {"why" in s && (
                      <div className="ld-why">
                        <span className="ld-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D49AAA" }}>{s.why[0]}</span>
                        <span style={{ fontSize: 15, lineHeight: 1.5, color: "#F4EFE7" }}>{s.why[1]}</span>
                      </div>
                    )}
                    {"cta" in s && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <Link className="ld-btn ld-btn-bone" href="/workspace">Try it free</Link>
                        <a className="ld-btn ld-btn-line" href="#demo">Try a sentence</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
