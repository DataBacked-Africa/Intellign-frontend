"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthInput } from "./AuthInput";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { useUserStore } from "@/store/useUserStore";
import { showToast } from "@/components/ui/CustomToast";
import { useRouter } from "next/navigation";

const SignupForm = () => {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organizationName: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.firstName.trim()) next.firstName = "First name is required.";
    if (!formData.lastName.trim()) next.lastName = "Last name is required.";
    if (!formData.email.trim()) next.email = "Email is required.";
    if (!formData.organizationName.trim()) next.organizationName = "Organization name is required.";
    if (formData.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirmPassword) next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { confirmPassword: _, firstName, lastName, organizationName, ...rest } = formData;
      const payload = {
        ...rest,
        name: `${firstName} ${lastName}`.trim(),
        organization_name: organizationName,
      };
      const response = await axiosInstance.post("/api/v1/auth/register", payload);
      const { user: rawUser, tokens } = response.data;
      const user = { ...rawUser, organizationId: rawUser.organization_id };
      login(user, tokens.access_token, tokens.refresh_token);
      showToast.success("Account created", `Welcome, ${user.name}!`);
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.push(redirect || "/workspace");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? "Registration failed. Please try again.";
      if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: "An account with this email already exists." }));
      } else {
        showToast.error("Sign up failed", msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--brand-maroon)", marginBottom: 10 }}>
          Get started
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--brand-maroon-deep)", margin: "0 0 8px" }}>
          Create an account.
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
          Start optimizing your workflows today.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <AuthInput label="First Name" name="firstName" type="text" placeholder="Ada"
              value={formData.firstName} onChange={handleChange} required error={errors.firstName} />
          </div>
          <div style={{ flex: 1 }}>
            <AuthInput label="Last Name" name="lastName" type="text" placeholder="Lovelace"
              value={formData.lastName} onChange={handleChange} required error={errors.lastName} />
          </div>
        </div>

        <AuthInput label="Email" name="email" type="email" placeholder="ada@company.com"
          value={formData.email} onChange={handleChange} required error={errors.email} />

        <AuthInput label="Organization" name="organizationName" type="text" placeholder="Acme Corp"
          value={formData.organizationName} onChange={handleChange} required error={errors.organizationName} />

        <AuthInput label="Password" name="password" type="password" placeholder="At least 8 characters"
          value={formData.password} onChange={handleChange} required error={errors.password} />

        <AuthInput label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat your password"
          value={formData.confirmPassword} onChange={handleChange} required error={errors.confirmPassword} />

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15, marginTop: 4, borderRadius: 8, opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? (
            <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
          ) : (
            "Get started"
          )}
        </button>
      </form>

      <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--brand-bone-deep)", textAlign: "center" as const }}>
        <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: 0 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--brand-maroon)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
