"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthInput } from "./AuthInput";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import { useRouter, useSearchParams } from "next/navigation";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await axiosInstance.post("/api/v1/auth/reset-password", { token, new_password: password });
      showToast.success("Password updated", "Please sign in with your new password.");
      router.push("/auth/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? "Reset failed. The link may have expired.";
      showToast.error("Reset failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // No token in the URL — the link is malformed or was opened directly.
  if (!token) {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 10px" }}>
            Invalid reset link.
          </h1>
          <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
            This password reset link is missing or invalid. Request a new one to continue.
          </p>
        </div>

        <Link
          href="/auth/forgot-password"
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15, borderRadius: 8, textDecoration: "none" }}
        >
          Request a new link
        </Link>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--brand-bone-deep)", textAlign: "center" as const }}>
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
          Set a new password.
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
          Choose a strong password you don&apos;t use elsewhere.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <AuthInput
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
          }}
          required
          error={errors.password}
        />
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          required
          error={errors.confirmPassword}
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
            "Update password"
          )}
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

export default ResetPasswordForm;
