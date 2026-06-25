"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthInput } from "./AuthInput";
import { Loader2, MailCheck } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axiosInstance.post("/api/v1/auth/forgot-password", { email });
      // Always show the confirmation — backend never reveals whether the email exists.
      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? "Something went wrong. Please try again.";
      showToast.error("Request failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--brand-bone-deep)", marginBottom: 18 }}>
            <MailCheck style={{ width: 24, height: 24, color: "var(--brand-maroon)" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 10px" }}>
            Check your inbox.
          </h1>
          <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
            If an account exists for <strong style={{ color: "var(--brand-maroon-deep)" }}>{email}</strong>, we&apos;ve sent a link to reset your password. The link expires in 1 hour.
          </p>
        </div>

        <div style={{ marginTop: 8, paddingTop: 20, borderTop: "1px solid var(--brand-bone-deep)", textAlign: "center" as const }}>
          <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: 0 }}>
            <Link href="/auth/login" style={{ color: "var(--brand-maroon)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--brand-maroon)", marginBottom: 10 }}>
          Reset password
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 8px" }}>
          Forgot password?
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
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
          disabled={isLoading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15, marginTop: 8, borderRadius: 8, opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? (
            <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--brand-bone-deep)", textAlign: "center" as const }}>
        <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: 0 }}>
          Remembered it?{" "}
          <Link href="/auth/login" style={{ color: "var(--brand-maroon)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
