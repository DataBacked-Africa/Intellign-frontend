"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthInput } from "./AuthInput";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { useUserStore } from "@/store/useUserStore";
import { showToast } from "@/components/ui/CustomToast";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/api/v1/auth/login", { email, password });
      const { user: rawUser, tokens } = response.data;
      const user = { ...rawUser, organizationId: rawUser.organization_id };
      login(user, tokens.access_token, tokens.refresh_token);
      showToast.success("Welcome back!", "You have successfully logged in.");
      router.push("/workspace");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      showToast.error("Login Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--brand-maroon)", marginBottom: 10 }}>
          Sign in
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 8px" }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
          Enter your details to continue.
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
        <div>
          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <Link href="/auth/forgot-password" style={{ fontSize: 13, color: "var(--fg-secondary)", textDecoration: "none", transition: "color 140ms" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--brand-maroon)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--fg-secondary)")}>
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15, marginTop: 8, borderRadius: 8, opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? (
            <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--brand-bone-deep)", textAlign: "center" as const }}>
        <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--brand-maroon)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
