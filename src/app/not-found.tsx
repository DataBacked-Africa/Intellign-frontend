import type { Metadata } from "next";
import Link from "next/link";
import "@/components/Marketing/landing/landing.css";
import LdNav from "@/components/Marketing/landing/LdNav";
import LdFooter from "@/components/Marketing/landing/LdFooter";
import NotFoundPath from "@/components/Marketing/landing/NotFoundPath";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// One cell is the "unassigned" page; the rest echo the roster grid used across the site.
const PATTERN = "101101001011010110100101101011010110100101";
const GAP = 23;

export default function NotFound() {
  return (
    <div className="ld">
      <LdNav />
      <main className="ld-wrap">
        <section className="ld-nf">
          <div>
            <div className="ld-eyebrow">Error 404</div>
            <p className="ld-nf-code" aria-hidden="true">404</p>
            <h1>This page isn&apos;t in the plan.</h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--ld-ink2)", margin: 0, maxWidth: "34em" }}>
              The address you followed doesn&apos;t exist, or the page has moved. Nothing is assigned here.
            </p>
            <NotFoundPath />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link className="ld-btn ld-btn-p" href="/">Back to home</Link>
              <Link className="ld-btn ld-btn-out" href="/workspace">Launch app</Link>
              <Link className="ld-btn ld-btn-out" href="/docs">Read the docs</Link>
            </div>
          </div>
          <div className="ld-nf-card" aria-hidden="true">
            <div className="ld-nf-grid">
              {PATTERN.split("").map((c, i) => (
                <span key={i} className={`ld-nf-cell${i === GAP ? " gap" : c === "1" ? " on" : ""}`} />
              ))}
            </div>
            <div className="ld-mono" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--ld-faint)" }}>
              <span>■ assigned</span><span>▨ this page</span>
            </div>
          </div>
        </section>
      </main>
      <LdFooter />
    </div>
  );
}
