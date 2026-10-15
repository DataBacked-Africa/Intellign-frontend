import Link from "next/link";
import Wordmark from "./Wordmark";
import { SITE_EMAIL } from "./data";

export default function LdClose() {
  return (
    <section style={{ background: "var(--ld-tint)", padding: "clamp(56px,7vw,96px) 0", borderTop: "1px solid var(--ld-line2)" }}>
      <div className="ld-wrap" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "32px 48px" }}>
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 22 }}>
          <h2 className="ld-h" style={{ fontSize: "clamp(44px,6vw,80px)" }}>Bring one real problem.</h2>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: "var(--ld-ink2)", maxWidth: "28em" }}>
            Send us a rota, a route list or an allocation from last month. We will show you the best plan for it.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="ld-btn ld-btn-p" href="/workspace">Try it free</Link>
            <a className="ld-btn ld-btn-out" href={`mailto:${SITE_EMAIL}?subject=Book%20a%20session`}>Book a session</a>
          </div>
        </div>
        <div aria-hidden="true" style={{ flex: "1 1 320px", minWidth: 0, display: "flex", justifyContent: "center" }}>
          <Wordmark size="clamp(64px,10vw,140px)" />
        </div>
      </div>
    </section>
  );
}
