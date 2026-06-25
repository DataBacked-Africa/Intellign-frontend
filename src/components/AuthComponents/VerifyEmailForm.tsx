"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AuthInput } from "./AuthInput";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import { useSearchParams } from "next/navigation";

type Status = "verifying" | "success" | "expired" | "invalid";

const VerifyEmailForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "invalid");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true; // guard against React strict-mode double-invoke
    (async () => {
      try {
        await axiosInstance.post("/api/v1/auth/verify-email", { token });
        setStatus("success");
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        setStatus(err.response?.status === 410 ? "expired" : "invalid");
      }
    })();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResending(true);
    try {
      await axiosInstance.post("/api/v1/auth/resend-verification", { email });
      showToast.success("Sent", "If that account needs verification, a new link is on its way.");
    } catch {
      showToast.error("Failed", "Could not send a new link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (status === "verifying") {
    return (
      <div style={{ width: "100%", textAlign: "center" as const, padding: "24px 0" }}>
        <Loader2 style={{ width: 26, height: 26, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} />
        <p style={{ marginTop: 16, fontSize: 15, color: "var(--fg-secondary)" }}>Confirming your email…</p>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--brand-bone-deep)", marginBottom: 18 }}>
          <CheckCircle2 style={{ width: 24, height: 24, color: "var(--brand-maroon)" }} />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 10px" }}>
          Email confirmed.
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
          Your account is verified. You&apos;re all set.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/workspace" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15, borderRadius: 8, textDecoration: "none" }}>
            Go to workspace
          </Link>
        </div>
      </div>
    );
  }

  // ── Expired / invalid → offer resend ─────────────────────────────────────
  const expired = status === "expired";
  return (
    <div style={{ width: "100%" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#FBEAEA", marginBottom: 18 }}>
        <XCircle style={{ width: 24, height: 24, color: "#B91C1C" }} />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 10px" }}>
        {expired ? "Link expired." : "Invalid link."}
      </h1>
      <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
        {expired
          ? "This verification link has expired. Enter your email and we'll send a fresh one."
          : "This verification link is invalid or already used. Request a new one below."}
      </p>

      <form onSubmit={handleResend} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <AuthInput
          label="Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={resending}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15, borderRadius: 8, opacity: resending ? 0.7 : 1 }}
        >
          {resending ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : "Send a new link"}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--brand-bone-deep)", textAlign: "center" as const }}>
        <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: 0 }}>
          <Link href="/auth/login" style={{ color: "var(--brand-maroon)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailForm;
