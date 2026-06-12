import Link from "next/link";

const TABLE_ROWS = [
  ["0420", "0.612", "0.4s"],
  ["0840", "0.821", "0.9s"],
  ["1260", "0.937", "1.5s"],
  ["1680", "0.978", "2.1s"],
] as const;

export default function Hero() {
  return (
    <section id="top" className="mk-container hero">
      <div className="hero__copy">
        <div className="eyebrow">Optimization · as a service</div>
        <h1>The math layer<br />within <em>AI</em>.</h1>

        <p className="hero__lede">
          Describe the goal in plain English.
        </p>
        <p className="hero__lede hero__lede--soft">
          Intellign formalises it, runs the solve, and hands back an assignment
          your team can defend — every decision explained, every constraint
          honoured.
        </p>

        <div className="hero__cta">
          <Link href="/workspace" className="btn btn-primary btn-lg">
            Launch app
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link href="/demo" className="btn btn-secondary btn-lg">Try the live demo</Link>
        </div>

        <div className="hero__trust">
          <span className="trust-item">
            <span className="trust-dot" />
            Early access — onboarding design partners
          </span>
          <span className="trust-item">
            <span className="trust-mono">pip install intellign</span>
          </span>
          <span className="trust-item">MCP-native</span>
        </div>
      </div>

      <div className="hero__visual" style={{ minWidth: 0, width: "100%" }} aria-hidden="true">
        <div className="hero__visual-head">
          <span className="hero__visual-dot" />
          <span className="hero__visual-dot" />
          <span className="hero__visual-dot" />
          <span className="hero__visual-title">solve · 0a8f3c</span>
          <span className="hero__visual-live">
            <span className="live-dot" /> converged
          </span>
        </div>

        <div className="hero__term">
          <div className="hero__term-row">
            <span className="hero__term-prompt">$</span>
            <span className="hero__term-cmd">intellign solve --watch</span>
          </div>

          <div className="hero__term-meta">
            <span className="hero__term-meta-row">
              <span className="hero__term-meta-k">problem</span>
              <span className="hero__term-meta-v">Healthcare deployment</span>
            </span>
            <span className="hero__term-meta-row">
              <span className="hero__term-meta-k">resources</span>
              <span className="hero__term-meta-v">124</span>
              <span className="hero__term-meta-sep">·</span>
              <span className="hero__term-meta-k">targets</span>
              <span className="hero__term-meta-v">48</span>
            </span>
            <span className="hero__term-meta-row">
              <span className="hero__term-meta-k">solver</span>
              <span className="hero__term-meta-v">genetic_algorithm</span>
            </span>
          </div>

          <div className="hero__term-table">
            <div className="hero__term-table-head">
              <span>gen</span>
              <span>fitness</span>
              <span>elapsed</span>
            </div>
            {TABLE_ROWS.map(([g, f, t], i) => (
              <div key={i} className="hero__term-table-row">
                <span>{g}</span>
                <span>{f}</span>
                <span>{t}</span>
              </div>
            ))}
            <div className="hero__term-table-row is-converged">
              <span>1847</span>
              <span>0.987</span>
              <span>2.3s</span>
              <span className="conv-tag">converged</span>
            </div>
          </div>
        </div>

        <div className="hero__chart">
          <div className="hero__chart-head">
            <span>Fitness convergence</span>
            <span>1.0</span>
          </div>
          <svg width="100%" height="64" viewBox="0 0 600 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#D49AAA" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#D49AAA" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((t) => (
              <line
                key={t}
                x1="0" x2="600"
                y1={64 - t * 60} y2={64 - t * 60}
                stroke="rgba(244,239,231,0.07)" strokeDasharray="3 4"
              />
            ))}
            <path d="M0,60 C100,57 200,42 300,22 S500,6 600,3 L600,64 L0,64 Z" fill="url(#sg)" />
            <path d="M0,60 C100,57 200,42 300,22 S500,6 600,3" fill="none" stroke="#D49AAA" strokeWidth="1.5" />
            <circle cx="600" cy="3" r="3.5" fill="#F4EFE7" stroke="#5C1427" strokeWidth="1.5" />
          </svg>
          <div className="hero__chart-axis">
            <span>gen 0</span>
            <span>1,000</span>
            <span>1,847</span>
          </div>
        </div>
      </div>
    </section>
  );
}
