import { TRUST, USE_CASES } from "./data";

const ICONS = [
  <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  <path key="s" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  <path key="c" d="M20 6 9 17l-5-5" />,
  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>,
];

export default function LdProof() {
  return (
    <section style={{ padding: "clamp(48px,6vw,88px) 0 clamp(64px,8vw,112px)" }}>
      <div className="ld-wrap" style={{ display: "flex", flexDirection: "column", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 className="ld-h" style={{ fontSize: "clamp(30px,3.6vw,44px)" }}>Built for teams that schedule, route or match.</h2>
          <div className="ld-cards">
            {USE_CASES.map(([title, text]) => (
              <div key={title} className="ld-card"><b>{title}</b><span>{text}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 24, borderTop: "1px solid var(--ld-line2)", paddingTop: 32 }}>
          {TRUST.map(([strong, text], i) => (
            <div key={strong} className="ld-trust">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[i]}</svg>
              <span><strong>{strong}</strong> {text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
