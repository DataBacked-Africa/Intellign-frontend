"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Wordmark from "./Wordmark";

// Below this width the inline links collapse into the side drawer (matches landing.css).
const DRAWER_MAX = 900;

// Anchors only resolve on the landing page, so off-landing routes prefix "/".
export default function LdNav({ home = false }: { home?: boolean }) {
  const [open, setOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const a = (hash: string) => (home ? hash : `/${hash}`);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) burgerRef.current?.focus();
  }, []);

  // Esc closes; leaving the drawer breakpoint closes; the page behind doesn't scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const mq = window.matchMedia(`(min-width: ${DRAWER_MAX + 1}px)`);
    const onMq = () => { if (mq.matches) close(false); };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      document.documentElement.style.overflow = prev;
    };
  }, [open, close]);

  const links: { label: string; href: string; hash?: boolean }[] = [
    { label: "How it works", href: a("#how"), hash: true },
    { label: "Connect", href: a("#connect"), hash: true },
    { label: "Case studies", href: a("#cases"), hash: true },
    { label: "Pricing", href: a("#pricing"), hash: true },
    { label: "Docs", href: "/docs" },
    { label: "Live demo", href: "/demo" },
    { label: "Sign in", href: "/auth/login" },
  ];

  return (
    <header className="ld-nav">
      <nav className="ld-wrap ld-nav-in" aria-label="Main">
        <Link href="/" className="ld-wm" aria-label="Intellign home" style={{ minHeight: 44, alignItems: "center" }}>
          <Wordmark size={30} />
        </Link>
        <div className="ld-nav-links">
          <a className="ld-navlink hide-sm" href={a("#how")}>How it works</a>
          <a className="ld-navlink hide-sm" href={a("#connect")}>Connect</a>
          <a className="ld-navlink hide-sm" href={a("#cases")}>Case studies</a>
          <a className="ld-navlink hide-sm" href={a("#pricing")}>Pricing</a>
          <Link className="ld-navlink hide-sm" href="/docs">Docs</Link>
          <Link className="ld-navlink hide-sm" href="/auth/login">Sign in</Link>
          <button type="button" className="ld-iconbtn" onClick={toggle} aria-label="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link className="ld-btn ld-btn-p ld-nav-cta" href="/workspace">Launch app</Link>
          <button
            ref={burgerRef}
            type="button"
            className="ld-iconbtn ld-burger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="ld-drawer"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* Side drawer for phones and tablets. Always mounted so it can animate;
          `inert` + aria-hidden keep it out of the tab order while closed. */}
      <div className={`ld-backdrop${open ? " is-open" : ""}`} onClick={() => close()} aria-hidden="true" />
      <aside
        id="ld-drawer"
        className={`ld-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="ld-drawer-head">
          <Wordmark size={26} />
          <button ref={closeRef} type="button" className="ld-iconbtn" onClick={() => close()} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="ld-drawer-links" aria-label="Menu">
          {links.map((l) =>
            l.hash ? (
              <a key={l.label} className="ld-drawer-link" href={l.href} onClick={() => close(false)}>{l.label}</a>
            ) : (
              <Link key={l.label} className="ld-drawer-link" href={l.href} onClick={() => close(false)}>{l.label}</Link>
            ),
          )}
        </nav>
        <div className="ld-drawer-foot">
          <Link className="ld-btn ld-btn-p" href="/workspace" onClick={() => close(false)} style={{ width: "100%" }}>Launch app</Link>
          <div className="ld-drawer-legal">
            <Link href="/terms" onClick={() => close(false)}>Terms</Link>
            <Link href="/privacy" onClick={() => close(false)}>Privacy</Link>
          </div>
        </div>
      </aside>
    </header>
  );
}
