"use client";

import React, { useState } from "react";
import { AuthInput } from "@/components/AuthComponents/AuthInput";
import { Card, SaveButton } from "./ui";
import { CheckCircle2, AlertCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import { useUserStore } from "@/store/useUserStore";
import type { Me } from "./SettingsView";

const ProfileTab: React.FC<{ me: Me; refresh: () => Promise<void> }> = ({ me, refresh }) => {
  const updateUser = useUserStore((s) => s.updateUser);
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const dirty = name.trim() !== me.name || email.trim() !== me.email;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.patch("/api/v1/me", { name: name.trim(), email: email.trim() });
      updateUser({ name: name.trim(), email: email.trim() });
      showToast.success("Saved", "Your profile has been updated.");
      await refresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; message?: string } } };
      showToast.error("Update failed", err.response?.data?.detail ?? err.response?.data?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axiosInstance.post("/api/v1/auth/resend-verification", { email: me.email });
      showToast.success("Sent", "Check your inbox for a verification link.");
    } catch {
      showToast.error("Failed", "Could not send the link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card title="Profile" description="Your name and email. Changing your email requires re-verification.">
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 }}>
        <AuthInput label="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <AuthInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {/* verification status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 8,
            background: me.email_verified ? "rgba(16,122,87,0.08)" : "rgba(185,28,28,0.06)",
            fontSize: 13.5,
          }}
        >
          {me.email_verified ? (
            <>
              <CheckCircle2 style={{ width: 16, height: 16, color: "#0E7A57" }} />
              <span style={{ color: "#0E7A57" }}>Email verified</span>
            </>
          ) : (
            <>
              <AlertCircle style={{ width: 16, height: 16, color: "#B91C1C" }} />
              <span style={{ color: "#B91C1C" }}>Email not verified</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--brand-maroon)", fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                {resending ? "Sending…" : "Resend link"}
              </button>
            </>
          )}
        </div>

        <div>
          <SaveButton loading={saving} disabled={!dirty}>Save changes</SaveButton>
        </div>
      </form>
    </Card>
  );
};

export default ProfileTab;
