"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CODE, DEST_ORDER, DESTS, ICON_PATHS, METHOD_ORDER, SETUP_STEPS, SOURCES, SOURCE_ORDER,
  type DestKey, type IconName, type MethodKey, type SourceKey,
} from "./data";
import Wordmark from "./Wordmark";

const Icon = ({ name }: { name: IconName }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICON_PATHS[name]} />
  </svg>
);

interface Ui { rows: number; unit: string; stg: [boolean, boolean, boolean]; stgText: [string, string, string]; plan: string; planOn: boolean; ok: DestKey[] }

const finalUi = (k: SourceKey): Ui => {
  const s = SOURCES[k];
  return { rows: s.rows, unit: s.unit, stg: [true, true, true], stgText: [...s.stages] as Ui["stgText"], plan: s.plan, planOn: true, ok: [...s.outs] };
};
const emptyUi = (k: SourceKey): Ui => ({ rows: 0, unit: "rows in", stg: [false, false, false], stgText: ["", "", ""], plan: "", planOn: false, ok: [] });

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const CANCEL = { cancelled: true };

interface Engine { play: (k: SourceKey, fromUser: boolean) => void; stop: () => void }
type Paths = { inn: Partial<Record<SourceKey, string>>; out: Partial<Record<DestKey, string>> };

export default function LdConnect() {
  const [cur, setCur] = useState<SourceKey>("sheet");
  const [auto, setAuto] = useState(true);
  const [mode, setMode] = useState<"no" | "yes">(SOURCES.sheet.mode);
  const [method, setMethod] = useState<MethodKey>(SOURCES.sheet.code);
  const [ui, setUi] = useState<Ui>(() => finalUi("sheet"));
  const [paths, setPaths] = useState<Paths>({ inn: {}, out: {} });

  const gridRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pkRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const actRefs = useRef<Record<string, SVGPathElement | null>>({});
  const tokenRef = useRef(0);
  const autoRef = useRef(true);
  const curRef = useRef<SourceKey>("sheet");
  const engineRef = useRef<Engine | null>(null);

  const layout = useCallback(() => {
    const grid = gridRef.current, svg = svgRef.current, core = coreRef.current;
    if (!grid || !svg || !core) return;
    const gb = grid.getBoundingClientRect();
    if (!gb.width || !svg.getBoundingClientRect().width) return; // hidden on small screens
    const edge = (el: Element, side: "l" | "r") => {
      const r = el.getBoundingClientRect();
      return { x: (side === "r" ? r.right : r.left) - gb.left, y: r.top + r.height / 2 - gb.top };
    };
    const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const dx = Math.max(24, (b.x - a.x) * 0.5);
      return `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
    };
    const cin = edge(core, "l"), cout = edge(core, "r");
    const inn: Paths["inn"] = {}, out: Paths["out"] = {};
    SOURCE_ORDER.forEach((k) => { const el = nodeRefs.current[`s:${k}`]; if (el) inn[k] = curve(edge(el, "r"), cin); });
    DEST_ORDER.forEach((k) => { const el = nodeRefs.current[`d:${k}`]; if (el) out[k] = curve(cout, edge(el, "l")); });
    svg.setAttribute("viewBox", `0 0 ${gb.width} ${gb.height}`);
    setPaths({ inn, out });
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let started = false;

    const sleep = (ms: number, tk: number) =>
      new Promise<void>((res, rej) => setTimeout(() => (tk === tokenRef.current ? res() : rej(CANCEL)), ms));

    const frames = (ms: number, tk: number, fn: (t: number) => void) =>
      new Promise<void>((res, rej) => {
        const t0 = performance.now();
        const step = (now: number) => {
          if (tk !== tokenRef.current) return rej(CANCEL);
          const t = Math.min(1, (now - t0) / ms);
          fn(t);
          if (t < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });

    const drawPath = (key: string, ms: number, tk: number) => {
      const p = actRefs.current[key];
      if (!p) return Promise.resolve();
      const len = p.getTotalLength();
      p.style.opacity = "1";
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      return frames(ms, tk, (t) => { p.style.strokeDashoffset = String(len * (1 - ease(t))); });
    };

    const travel = (key: string, label: string, plan: boolean, ms: number, tk: number) => {
      const path = actRefs.current[key], layer = pkRef.current, svg = svgRef.current;
      if (!path || !layer || !svg || !svg.getBoundingClientRect().width) return sleep(ms / 3, tk);
      const el = document.createElement("span");
      el.className = `ld-pk${plan ? " plan" : ""}`;
      el.textContent = label;
      layer.appendChild(el);
      const len = path.getTotalLength(), h = el.offsetHeight / 2;
      return frames(ms, tk, (t) => {
        const e = ease(t), pt = path.getPointAtLength(len * e);
        el.style.transform = `translate(${pt.x - el.offsetWidth / 2}px,${pt.y - h}px) scale(${1 - 0.18 * e})`;
        el.style.opacity = String(t < 0.1 ? t * 10 : t > 0.88 ? (1 - t) * 8 : 1);
      }).then(() => el.remove(), (e) => { el.remove(); throw e; });
    };

    const clearVisuals = () => {
      Object.values(actRefs.current).forEach((p) => { if (p) { p.style.opacity = "0"; } });
      if (pkRef.current) pkRef.current.innerHTML = "";
    };

    const play = async (k: SourceKey, fromUser: boolean) => {
      const tk = ++tokenRef.current;
      const s = SOURCES[k];
      curRef.current = k;
      setCur(k);
      if (fromUser) { setMode(s.mode); setMethod(s.code); }
      clearVisuals();
      if (reduce) { setUi(finalUi(k)); return; }
      setUi(emptyUi(k));
      try {
        await sleep(250, tk);
        await Promise.all([
          drawPath(`in:${k}`, 700, tk),
          ...s.packets.map((name, i) => sleep(i * 240, tk).then(() => travel(`in:${k}`, name, false, 900, tk))),
        ]);
        await frames(700, tk, (t) => setUi((u) => ({ ...u, rows: Math.round(s.rows * ease(t)), unit: s.unit })));
        for (let i = 0; i < 3; i++) {
          setUi((u) => {
            const stg = [...u.stg] as Ui["stg"], stgText = [...u.stgText] as Ui["stgText"];
            stg[i] = true; stgText[i] = s.stages[i];
            return { ...u, stg, stgText };
          });
          await sleep(520, tk);
        }
        setUi((u) => ({ ...u, plan: s.plan, planOn: true }));
        await Promise.all(s.outs.map((o, i) =>
          sleep(i * 200, tk)
            .then(() => Promise.all([drawPath(`out:${o}`, 700, tk), travel(`out:${o}`, "plan", true, 900, tk)]))
            .then(() => setUi((u) => ({ ...u, ok: u.ok.includes(o) ? u.ok : [...u.ok, o] }))),
        ));
        await sleep(2400, tk);
        if (autoRef.current) {
          const next = SOURCE_ORDER[(SOURCE_ORDER.indexOf(k) + 1) % SOURCE_ORDER.length];
          void play(next, false);
        }
      } catch (e) {
        if (e !== CANCEL) throw e;
      }
    };

    engineRef.current = { play, stop: () => { tokenRef.current += 1; } };

    // Start when the card is on screen, pause when it leaves.
    const card = cardRef.current;
    let io: IntersectionObserver | undefined;
    const begin = () => { if (!started) { started = true; layout(); void play("sheet", false); } };
    if (card && "IntersectionObserver" in window) {
      io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (e.isIntersecting) { if (!started) begin(); else if (autoRef.current) void play(curRef.current, false); }
          else if (started) tokenRef.current += 1;
        });
      }, { threshold: 0.25 });
      io.observe(card);
    } else begin();

    let rz: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(layout, 120); };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => { if (started) layout(); });
    layout();

    return () => {
      tokenRef.current += 1;
      io?.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(rz);
    };
  }, [layout]);

  const s = SOURCES[cur];
  const kind = cur === "sheet" ? "sheet" : method === "rest" ? "system" : "dev";
  const C = CODE[method];

  const pick = (k: SourceKey) => {
    autoRef.current = false; setAuto(false);
    engineRef.current?.play(k, true);
  };
  const toggleAuto = () => {
    const next = !auto;
    autoRef.current = next; setAuto(next);
    if (next) engineRef.current?.play(curRef.current, false); else engineRef.current?.stop();
  };

  return (
    <section id="connect" className="ld-cx-sec">
      <div className="ld-wrap ld-col" style={{ gap: 40 }}>
        <div className="ld-split">
          <div className="ld-col" style={{ gap: 20 }}>
            <div className="ld-eyebrow">Connect</div>
            <h2 className="ld-h">Works with what you already run.</h2>
          </div>
          <p className="ld-lede">Drop in a spreadsheet, or connect the system your team already uses. Your plan goes back where the work happens.</p>
        </div>

        <div className="ld-cx" ref={cardRef}>
          <div className="ld-cx-head">
            <span className="ld-cx-label">Pick where your data lives</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="ld-cx-label" style={{ textTransform: "none", letterSpacing: ".04em" }}>Example flow · counts are illustrative</span>
              <button type="button" className="ld-ctl" aria-pressed={!auto} onClick={toggleAuto}>{auto ? "Pause" : "Play"}</button>
            </div>
          </div>

          <div className="ld-cx-grid" ref={gridRef}>
            <svg className="ld-cx-svg" ref={svgRef} aria-hidden="true">
              {SOURCE_ORDER.map((k) => paths.inn[k] && (
                <g key={`in-${k}`}>
                  <path d={paths.inn[k]} fill="none" stroke="var(--ld-line3)" strokeWidth="1" />
                  <path ref={(el) => { actRefs.current[`in:${k}`] = el; }} d={paths.inn[k]} fill="none" stroke="var(--ld-accent)" strokeWidth="1.6" strokeLinecap="round" style={{ opacity: 0 }} />
                </g>
              ))}
              {DEST_ORDER.map((k) => paths.out[k] && (
                <g key={`out-${k}`}>
                  <path d={paths.out[k]} fill="none" stroke="var(--ld-line3)" strokeWidth="1" />
                  <path ref={(el) => { actRefs.current[`out:${k}`] = el; }} d={paths.out[k]} fill="none" stroke="var(--ld-accent)" strokeWidth="1.6" strokeLinecap="round" style={{ opacity: 0 }} />
                </g>
              ))}
            </svg>
            <div className="ld-pk-layer" ref={pkRef} aria-hidden="true" />

            <div className="ld-cx-col ld-cx-in">
              {SOURCE_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  ref={(el) => { nodeRefs.current[`s:${k}`] = el; }}
                  className={`ld-src${k === cur ? " on" : ""}`}
                  aria-pressed={k === cur}
                  onClick={() => pick(k)}
                >
                  <Icon name={SOURCES[k].icon} />
                  <span className="ld-t"><b>{SOURCES[k].label}</b><small>{SOURCES[k].method}</small></span>
                </button>
              ))}
            </div>

            <div className="ld-core" ref={coreRef} aria-live="polite">
              <div className="ld-core-top">
                <Wordmark size={26} />
                <span className="ld-cx-label">Workspace</span>
              </div>
              <div className="ld-rows"><b>{ui.rows.toLocaleString()}</b><span>{ui.unit}</span></div>
              {(["Check", "Understand", "Solve"] as const).map((name, i) => (
                <div key={name} className={`ld-stg${ui.stg[i] ? " on" : ""}`}>
                  <span className="d">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F4EFE7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span className="n"><b>{name}</b><small>{ui.stgText[i] || " "}</small></span>
                </div>
              ))}
              <div className={`ld-planline${ui.planOn ? " on" : ""}`}>{ui.plan || " "}</div>
            </div>

            <div className="ld-cx-col ld-cx-out">
              {DEST_ORDER.map((k) => (
                <div
                  key={k}
                  ref={(el) => { nodeRefs.current[`d:${k}`] = el; }}
                  className={`ld-dst${s.outs.includes(k) ? " lit" : ""}${ui.ok.includes(k) ? " ok" : ""}`}
                >
                  <Icon name={DESTS[k].icon} />
                  <span className="ld-t"><b>{k === "system" ? s.sys : DESTS[k].label}</b><small>{DESTS[k].chip}</small></span>
                  <span className="ld-done">{DESTS[k].done}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ld-facts" aria-live="polite">
            <div className="ld-fact"><span className="l hi">Way in</span><span className="big">{s.way}</span></div>
            <div className="ld-fact"><span className="l">Goes in</span><span className="v">{s.reads}</span></div>
            <div className="ld-fact"><span className="l">Comes back</span><span className="v">{s.back}</span></div>
          </div>
        </div>

        <div className="ld-col" style={{ gap: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span className="ld-cx-label">How to set it up</span>
            <div className="ld-seg" role="group" aria-label="Setup style">
              <button type="button" className={mode === "no" ? "on" : ""} aria-pressed={mode === "no"} onClick={() => setMode("no")}>Without code</button>
              <button type="button" className={mode === "yes" ? "on" : ""} aria-pressed={mode === "yes"} onClick={() => setMode("yes")}>With code</button>
            </div>
          </div>

          {mode === "no" ? (
            <div className="ld-steps3">
              {SETUP_STEPS[kind].map((t, i) => (
                <div key={t} className="ld-st"><span className="num">{i + 1}</span><span className="tx">{t}</span></div>
              ))}
            </div>
          ) : (
            <div className="ld-codebox">
              <div className="ld-mtabs">
                <div role="tablist" aria-label="Integration method" style={{ display: "flex", flexWrap: "wrap" }}>
                  {METHOD_ORDER.map((m) => (
                    <button key={m} type="button" role="tab" aria-selected={m === method} className={`ld-mtab${m === method ? " on" : ""}`} onClick={() => setMethod(m)}>{CODE[m].label}</button>
                  ))}
                </div>
                <span className="ld-mono" style={{ fontSize: 11, color: "#9E9C92", padding: "8px 0" }}>{C.host}</span>
              </div>
              <pre className="ld-code">{C.code}</pre>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #2E2D2A", fontSize: 13, color: "#9E9C92" }}>{C.note}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
