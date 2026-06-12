import Link from "next/link";
import type { Metadata } from "next";
import MarketingNav from "@/components/Marketing/MarketingNav";
import MarketingFooter from "@/components/Marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Docs — Intellign",
  description:
    "Quickstart, API shape, and MCP integration for the Intellign optimization engine.",
  alternates: { canonical: "/docs" },
};

const QUICKSTART = `1. Launch the app and describe your problem in plain English:
   "Assign 50 nurses to hospital wards. Match specialties
    to ward needs and balance the workload."

2. Pick a data source — upload your CSV/Excel, or let
   Intellign generate a realistic sample dataset.

3. Confirm the compiled goals and say "run it".

That's the whole flow — three turns from question to an
explained, auditable assignment.`;

const API_SHAPE = `POST /ingest/chat/{session_id}        # converse, upload, generate
POST /ingest/files/{session_id}       # upload datasets (csv, xlsx,
                                      # json, parquet, gpkg, ...)
POST /optimizations/run/{session_id}  # dispatch the solve
GET  /optimizations/progress/{job_id} # SSE progress stream
GET  /results/{job_id}                # assignments + metrics
GET  /results/{job_id}/export         # csv / json export`;

const MCP_NOTE = `Intellign is built to be called BY other AIs. Expose the
solve endpoint as a tool in your agent framework — when your
LLM needs an optimization answer (rostering, routing,
allocation), it calls Intellign and gets back structured
assignments with per-decision rationale.

MCP server packaging is in active development. Email us for
early access to the tool manifest.`;

function DocBlock({ title, code }: { title: string; code: string }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h3
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--brand-maroon)",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      <pre className="code-block" style={{ whiteSpace: "pre-wrap" }}>
        {code}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="mk-page">
      <MarketingNav />
      <main>
        <section className="mk-container" style={{ padding: "120px 32px 80px", maxWidth: 860 }}>
          <div className="eyebrow">Documentation</div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              lineHeight: 1.1,
              margin: "16px 0 12px",
            }}
          >
            Build with <em style={{ fontStyle: "italic", color: "var(--brand-maroon)" }}>Intellign</em>.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--neutral-700)", marginBottom: 48 }}>
            Everything here is shipping today. Deeper reference material is being
            written alongside the API — if something you need is missing,{" "}
            <a href="mailto:hello@databackedafrica.com" style={{ color: "var(--brand-maroon)", textDecoration: "underline" }}>
              email us
            </a>{" "}
            and we&apos;ll point you at the right endpoint.
          </p>

          <DocBlock title="Quickstart — three turns to a solve" code={QUICKSTART} />
          <DocBlock title="API shape" code={API_SHAPE} />
          <DocBlock title="Calling Intellign from your AI (MCP)" code={MCP_NOTE} />

          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <Link href="/demo" className="btn btn-primary">
              Try the live demo
            </Link>
            <Link href="/workspace" className="btn btn-secondary">
              Launch app
            </Link>
            <a href="mailto:hello@databackedafrica.com" className="btn btn-ghost">
              Ask a question
            </a>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
