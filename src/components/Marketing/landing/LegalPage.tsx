import type { ReactNode } from "react";
import "./landing.css";
import LdNav from "./LdNav";
import LdFooter from "./LdFooter";
import { LEGAL_EMAIL, type LegalDoc } from "@/lib/legal-content";

// Turns the contact address inside a paragraph into a mailto link.
function withMail(text: string): ReactNode {
  const parts = text.split(LEGAL_EMAIL);
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i < parts.length - 1 ? [part, <a key={i} href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>] : [part],
  );
}

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="ld">
      <LdNav />
      <main className="ld-wrap">
        <div className="ld-doc">
          <nav className="ld-toc" aria-label="On this page">
            {doc.sections.map((s) => (
              <a key={s.id} className="ld-toc-a" href={`#${s.id}`}>{s.h}</a>
            ))}
          </nav>
          <article>
            <div className="ld-eyebrow">Legal</div>
            <h1>{doc.title}</h1>
            <div className="ld-mono" style={{ fontSize: 13, color: "var(--ld-faint)" }}>Last updated {doc.updated}</div>
            <p className="intro">{doc.intro}</p>
            {doc.sections.map((s) => (
              <section key={s.id}>
                <h2 id={s.id}>{s.h}</h2>
                {s.p.map((para, i) => <p key={i}>{withMail(para)}</p>)}
                {s.ul && <ul>{s.ul.map((li) => <li key={li}>{li}</li>)}</ul>}
              </section>
            ))}
          </article>
        </div>
      </main>
      <LdFooter />
    </div>
  );
}
