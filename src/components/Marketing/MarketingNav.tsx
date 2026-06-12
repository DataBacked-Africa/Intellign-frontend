"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`mk-nav ${scrolled ? "is-scrolled" : ""}`}
    >
      <Link href="/" className="mk-nav__brand">
        <Image src="/intellign-logo.png" alt="Intellign" width={28} height={28} style={{ height: 28, width: "auto" }} />
        <span>Intellign<span className="dot" /></span>
      </Link>
      <div className="mk-nav__items">
        <a href="#product">Product</a>
        <a href="#how">How it works</a>
        <a href="#uses">Use cases</a>
        <a href="#pricing">Pricing</a>
        <Link href="/demo">Demo</Link>
        <Link href="/docs">Docs</Link>
      </div>
      <div className="mk-nav__spacer" />
      <div className="mk-nav__cta">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-[var(--brand-bone-deep)] transition-colors text-[var(--fg-secondary)]"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link href="/auth/login" className="btn btn-ghost mk-nav__signin">Sign in</Link>
        <Link href="/workspace" className="btn btn-primary">
          Launch app
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        <button
          className="mk-nav__burger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>
              : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="mk-nav__mobile" onClick={() => setMenuOpen(false)}>
          <a href="#product">Product</a>
          <a href="#how">How it works</a>
          <a href="#uses">Use cases</a>
          <a href="#pricing">Pricing</a>
          <Link href="/demo">Demo</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/auth/login">Sign in</Link>
        </div>
      )}
    </motion.nav>
  );
}
