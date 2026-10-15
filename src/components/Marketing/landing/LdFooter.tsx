import Link from "next/link";
import Wordmark from "./Wordmark";
import { SITE_EMAIL } from "./data";

const label = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--ld-faint)", marginBottom: 6 };

export default function LdFooter({ home = false }: { home?: boolean }) {
  const a = (hash: string) => (home ? hash : `/${hash}`);
  return (
    <footer style={{ background: "var(--ld-page)", padding: "56px 0 32px" }}>
      <div className="ld-wrap" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Wordmark size={30} />
            <span style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ld-muted)" }}>
              Built and tested in Africa by DataBacked Africa, Abuja.
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={label}>Product</span>
            <a className="ld-flink" href={a("#how")}>How it works</a>
            <a className="ld-flink" href={a("#demo")}>Try a sentence</a>
            <a className="ld-flink" href={a("#cases")}>Case studies</a>
            <a className="ld-flink" href={a("#pricing")}>Pricing</a>
            <Link className="ld-flink" href="/workspace">Launch app</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={label}>Developers</span>
            <Link className="ld-flink" href="/docs">Documentation</Link>
            <Link className="ld-flink" href="/docs">MCP guide</Link>
            <Link className="ld-flink" href="/demo">Live demo</Link>
            <Link className="ld-flink" href="/status">Status</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={label}>Company</span>
            <Link className="ld-flink" href="/about">About</Link>
            <a className="ld-flink" href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
            <a className="ld-flink" href="https://www.linkedin.com/company/intellign-ai" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a className="ld-flink" href="https://github.com/DataBacked-Africa" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--ld-line)", paddingTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--ld-faint)" }}>© {new Date().getFullYear()} Intellign AI</span>
            <Link className="ld-flink" href="/terms">Terms</Link>
            <Link className="ld-flink" href="/privacy">Privacy</Link>
          </span>
          <span className="ld-mono" style={{ fontSize: 12, color: "var(--ld-faint)" }}>api.intellign.ai · mcp.intellign.ai</span>
        </div>
      </div>
    </footer>
  );
}
