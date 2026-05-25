"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`mk-nav ${scrolled ? "is-scrolled" : ""}`}>
      <Link href="/" className="mk-nav__brand">
        <Image src="/intellign-logo.png" alt="Intellign" width={28} height={28} style={{ height: 28, width: "auto" }} />
        <span>Intellign<span className="dot" /></span>
      </Link>
      <div className="mk-nav__items">
        <a href="#product">Product</a>
        <a href="#how">How it works</a>
        <a href="#uses">Use cases</a>
        <a href="#pricing">Pricing</a>
        <a href="#docs">Docs</a>
      </div>
      <div className="mk-nav__spacer" />
      <div className="mk-nav__cta">
        <Link href="/auth/login" className="btn btn-ghost">Sign in</Link>
        <Link href="/auth/signup" className="btn btn-primary">
          Launch app
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
