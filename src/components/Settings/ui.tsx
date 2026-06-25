"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export const Card: React.FC<{ title?: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section
    style={{
      background: "var(--neutral-0, #ffffff)",
      border: "1px solid var(--brand-bone-deep)",
      borderRadius: 14,
      padding: "24px 24px",
      marginBottom: 20,
    }}
  >
    {title && (
      <div style={{ marginBottom: description ? 4 : 18 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 20, color: "var(--brand-maroon-deep)", margin: 0 }}>
          {title}
        </h2>
      </div>
    )}
    {description && (
      <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: "0 0 18px", lineHeight: 1.5 }}>{description}</p>
    )}
    {children}
  </section>
);

export const SaveButton: React.FC<{ loading?: boolean; disabled?: boolean; children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" }> = ({
  loading,
  disabled,
  children,
  onClick,
  type = "submit",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading || disabled}
    className="btn btn-primary"
    style={{ justifyContent: "center", height: 44, padding: "0 22px", fontSize: 14.5, borderRadius: 8, opacity: loading || disabled ? 0.6 : 1 }}
  >
    {loading ? <Loader2 style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }} /> : children}
  </button>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  checked,
  onChange,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    style={{
      width: 44,
      height: 26,
      borderRadius: 999,
      border: "none",
      cursor: disabled ? "default" : "pointer",
      background: checked ? "var(--brand-maroon)" : "var(--brand-bone-deep)",
      position: "relative",
      transition: "background 160ms",
      flexShrink: 0,
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 3,
        left: checked ? 21 : 3,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 160ms",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
    />
  </button>
);

export const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "14px 0", borderBottom: "1px solid var(--brand-bone)" }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-primary)" }}>{label}</div>
      {hint && <div style={{ fontSize: 13, color: "var(--fg-secondary)", marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
    </div>
    {children}
  </div>
);
