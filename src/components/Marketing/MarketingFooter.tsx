import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="mk-container mk-footer">
      <div className="mk-footer__brand">
        <div className="brand-mark">
          Intellign
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--brand-maroon)", display: "inline-block", verticalAlign: 2, marginLeft: 2 }} />
        </div>
        <div className="desc">
          The math layer within AI. Built and tested out of Africa,
          designed for every team that decides who does what.
        </div>
        <div className="by">
          PLATFORM BY DATABACKED AFRICA<br />
          intellign.databackedafrica.com
        </div>
      </div>
      <div className="mk-footer__col">
        <h5>Product</h5>
        <a href="#product">Overview</a>
        <a href="#how">How it works</a>
        <a href="#uses">Use cases</a>
        <a href="#pricing">Pricing</a>
        <Link href="/workspace">Launch app</Link>
      </div>
      <div className="mk-footer__col">
        <h5>Developers</h5>
        <a href="#docs">Documentation</a>
        <a href="#docs">API reference</a>
        <a href="#docs">MCP guide</a>
        <a href="#docs">SDK · pip install intellign</a>
        <a href="#docs">Status</a>
      </div>
      <div className="mk-footer__col">
        <h5>Company</h5>
        <a href="#">About</a>
        <a href="#">DataBacked Africa</a>
        <a href="mailto:hello@databackedafrica.com">hello@databackedafrica.com</a>
        <a href="#">Careers</a>
      </div>
      <div className="mk-footer__base">
        <span>© {new Date().getFullYear()} DataBacked Africa</span>
        <span className="links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="https://github.com/databackedafrica/intellign">GitHub ↗</a>
        </span>
      </div>
    </footer>
  );
}
