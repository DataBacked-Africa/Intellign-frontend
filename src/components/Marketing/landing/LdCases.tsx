"use client";

import { useState } from "react";
import { CASES } from "./data";

export default function LdCases() {
  const [idx, setIdx] = useState(0);
  const c = CASES[idx];
  const external = c.link[0].startsWith("mailto:") || c.link[0].startsWith("http");

  return (
    <div id="cases" className="ld-col" style={{ gap: 32 }}>
      <div className="ld-split">
        <div className="ld-col" style={{ gap: 18 }}>
          <div className="ld-eyebrow">Case studies</div>
          <h2 className="ld-h">Real deployments, solved and explained.</h2>
        </div>
        <p className="ld-lede">
          One research deployment and three hospital scenarios, run through Intellign. The records are generated or synthetic, and every number below comes from a recorded run.
        </p>
      </div>

      <div className="ld-case">
        <div className="ld-ctabs" role="tablist" aria-label="Case studies">
          {CASES.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === idx} className={`ld-ctab${i === idx ? " on" : ""}`} onClick={() => setIdx(i)}>
              <span className="m">{x.module}</span>
              <b>{x.title}</b>
              <span className="s">{x.blurb}</span>
            </button>
          ))}
        </div>

        <div className="ld-cpanel" role="tabpanel" aria-live="polite">
          <div>
            <div className="ld-cl">What was asked</div>
            <p className="ld-cq">“{c.prompt}”</p>
          </div>
          <div>
            <div className="ld-cl">What Intellign understood</div>
            {c.goals.map(([kind, text, weight]) => (
              <div key={text} className="ld-goal">
                <span className={`ld-kchip ${kind === "Penalty" ? "ld-st-block" : "ld-st-ok"}`}>{kind}</span>
                <span className="t">{text}</span>
                {weight != null && <span className="w">weight {weight}</span>}
              </div>
            ))}
          </div>
          <div className="ld-cmetrics">
            {c.metrics.map(([value, label]) => (
              <div key={label} className="ld-cm">
                <b style={value.length > 9 ? { fontSize: 24, lineHeight: 1.15 } : undefined}>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {c.rows && (
            <div>
              <div className="ld-cl">A few of the decisions</div>
              {c.rows.map(([who, where, why]) => (
                <div key={who} className="ld-crow">
                  <strong>{who}</strong><span className="arr">→</span><span>{where}</span>
                  <span className="ld-kchip ld-st-ok">{why}</span>
                </div>
              ))}
            </div>
          )}
          {c.note && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ld-muted)" }}>{c.note}</p>}
          <div className="ld-cfoot">
            <p>{c.foot}</p>
            {external
              ? <a className="ld-btn ld-btn-p" href={c.link[0]}>{c.link[1]}</a>
              : <a className="ld-btn ld-btn-p" href={c.link[0]}>{c.link[1]}</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
