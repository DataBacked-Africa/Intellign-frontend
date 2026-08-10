import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/Marketing/MarketingNav";
import MarketingFooter from "@/components/Marketing/MarketingFooter";

const SITE_URL = "https://www.intellign.ai";
const DESCRIPTION =
  "Intellign is the math layer within AI: a product by DataBacked Africa that turns plain-English optimization problems into formal mathematical models, solves them, and returns explainable, auditable assignments.";

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Intellign",
    description: DESCRIPTION,
    url: `${SITE_URL}/about`,
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE_URL}/about#webpage`,
  url: `${SITE_URL}/about`,
  name: "About Intellign",
  description: DESCRIPTION,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
};

export default function AboutPage() {
  return (
    <div className="mk-page px-[5%]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <MarketingNav />
      <main>
        <section className="mk-container" style={{ padding: "72px 0 48px", maxWidth: 720 }}>
          <div className="eyebrow">About</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1.1, margin: "16px 0 24px" }}>
            Intellign is <em style={{ fontStyle: "italic", color: "var(--brand-maroon)" }}>the math layer within AI</em>.
          </h1>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>What Intellign is</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--neutral-700)" }}>
              Intellign is an optimization-as-a-service platform. You describe a
              resource-allocation problem in plain English, who goes where, what
              runs when, how to use limited people, vehicles, budget or time
              well, and Intellign turns that description into a formal
              mathematical model, solves it with real optimization engines
              (genetic algorithms, CP-SAT, OR-Tools), and returns an optimized
              plan with a human-readable rationale for every assignment.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>What problem it solves</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--neutral-700)" }}>
              Assignment, scheduling, routing, allocation and matching problems
              are usually solved today with spreadsheets, expensive legacy
              software, or a manager&apos;s best guess, none of which explain
              their own decisions. Standard AI chatbots can discuss these
              problems but can&apos;t reliably do the underlying math. Intellign
              uses AI to understand the goal and translate it into a formal
              optimization problem, while the actual assignment comes from
              exact mathematical solvers, not a language model&apos;s guess, so
              every result is feasible, scored, and explained.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>Who it&apos;s for</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--neutral-700)" }}>
              Teams that regularly decide who does what: healthcare
              organizations rostering nurses or deploying field workers,
              logistics teams routing delivery fleets, schools placing
              teachers, government and NGO programs deploying enumerators, and
              developers who want to call optimization directly from their own
              product or AI agent via the API, Python SDK, or MCP server.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>How it works</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--neutral-700)" }}>
              Four surfaces run on the same engine and the same account: the{" "}
              <Link href="/">web app</Link> for chatting your way from problem
              to plan, a public REST API for developers integrating
              optimization into their own systems, a Python SDK for typed
              access without HTTP plumbing, and an MCP server that lets AI
              agents call Intellign as a tool. See the{" "}
              <Link href="/docs">documentation</Link> for details on all four,
              or try the <Link href="/demo">live demo</Link> to click through a
              real optimization run.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>Who&apos;s behind it</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--neutral-700)" }}>
              Intellign is built by{" "}
              <a href="https://github.com/DataBacked-Africa" target="_blank" rel="noopener noreferrer">
                DataBacked Africa
              </a>
              , tested out of Africa and designed for every team that decides
              who does what. Reach the team at{" "}
              <a href="mailto:hello@databackedafrica.com">hello@databackedafrica.com</a>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>Official site</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--neutral-700)" }}>
              The official Intellign website is{" "}
              <a href={SITE_URL}>www.intellign.ai</a>. Intellign is a distinct
              product and company; it is not affiliated with any similarly
              named product, tool or company.
            </p>
          </section>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
