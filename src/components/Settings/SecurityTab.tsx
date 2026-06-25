"use client";

import React, { useState } from "react";
import { AuthInput } from "@/components/AuthComponents/AuthInput";
import { Card, SaveButton } from "./ui";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";

const SecurityTab: React.FC = () => {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (next.length < 8) errs.next = "Password must be at least 8 characters.";
    if (next !== confirm) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await axiosInstance.post("/api/v1/me/change-password", {
        current_password: current,
        new_password: next,
      });
      showToast.success("Password changed", "Please sign in again with your new password.");
      // Backend revokes all refresh tokens — force a clean re-login.
      await logout();
      router.push("/auth/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail ?? "Could not change password.";
      if (detail.toLowerCase().includes("incorrect")) {
        setErrors({ current: "Current password is incorrect." });
      } else {
        showToast.error("Failed", detail);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Password" description="Changing your password signs you out of all other sessions.">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 }}>
        <AuthInput label="Current password" type="password" value={current} onChange={(e) => { setCurrent(e.target.value); setErrors((p) => ({ ...p, current: "" })); }} required error={errors.current} />
        <AuthInput label="New password" type="password" placeholder="At least 8 characters" value={next} onChange={(e) => { setNext(e.target.value); setErrors((p) => ({ ...p, next: "" })); }} required error={errors.next} />
        <AuthInput label="Confirm new password" type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }} required error={errors.confirm} />
        <div>
          <SaveButton loading={saving} disabled={!current || !next || !confirm}>Update password</SaveButton>
        </div>
      </form>
    </Card>
  );
};

export default SecurityTab;
