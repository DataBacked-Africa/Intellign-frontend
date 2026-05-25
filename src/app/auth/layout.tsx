import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", fontFamily: "var(--font-sans)" }}>
      {/* Left panel — brand */}
      <div
        style={{
          background: "var(--brand-maroon-deep)",
          color: "var(--brand-bone)",
          padding: "48px",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "42%",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
        className="auth-panel"
      >
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: "70%", aspectRatio: "1",
          background: "radial-gradient(circle, rgba(138,30,58,0.55), transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-5%",
          width: "50%", aspectRatio: "1",
          background: "radial-gradient(circle, rgba(92,20,39,0.35), transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/intellign-logo.png" alt="Intellign" width={28} height={28} style={{ height: 28, width: "auto", filter: "brightness(0) invert(1)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--brand-bone)", letterSpacing: "-0.5px" }}>
              Intellign
            </span>
          </Link>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.02em",
            color: "var(--brand-bone)", margin: "0 0 24px", fontWeight: 400,
          }}>
            The math layer within <em style={{ color: "var(--brand-maroon-bright)" }}>AI</em>.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(244,239,231,0.65)", margin: 0 }}>
            Describe the goal. Intellign formalises it, runs the solve, and
            hands back an assignment your team can defend.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
            {["Genetic algorithm solver", "Plain-language goals", "Explainable assignments"].map((f) => (
              <span key={f} style={{
                fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "rgba(244,239,231,0.5)",
                padding: "4px 10px", borderRadius: 4,
                border: "1px solid rgba(244,239,231,0.12)",
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.08em", color: "rgba(244,239,231,0.35)", margin: 0 }}>
            © {new Date().getFullYear()} DataBacked Africa
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px", background: "var(--brand-bone)",
        position: "relative",
      }}>
        {/* Mobile logo */}
        <div style={{ position: "absolute", top: 24, left: 24 }} className="auth-mobile-logo">
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Image src="/intellign-logo.png" alt="Intellign" width={24} height={24} style={{ height: 24, width: "auto" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--brand-maroon-deep)" }}>Intellign</span>
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          {children}
        </div>
      </div>

    </div>
  );
}
