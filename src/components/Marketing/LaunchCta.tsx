import Link from "next/link";

export default function LaunchCta() {
  return (
    <section className="launch-cta">
      <div className="eyebrow">Get started</div>
      <h2>Every organization needs<br /><em>optimization</em>. We&apos;d like you in<br />when they start asking AI for it.</h2>
      <p>
        Launch the app, drop in your data, and describe a problem. Most teams
        ship their first solve in the same afternoon they sign up.
      </p>
      <div className="launch-cta__cta">
        <Link href="/auth/signup" className="btn btn-primary btn-lg">
          Launch app
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        <a href="mailto:hello@databackedafrica.com" className="btn btn-secondary btn-lg">Book a demo</a>
      </div>
    </section>
  );
}
