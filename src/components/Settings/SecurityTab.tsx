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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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

      <DeleteAccountCard />
    </div>
  );
};

const DeleteAccountCard: React.FC = () => {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const requestDeletion = async () => {
    setBusy(true);
    try {
      await axiosInstance.post("/api/v1/account/request-deletion");
      showToast.success(
        "Account scheduled for deletion",
        "You have 30 days to export your data or cancel — check your email."
      );
      await logout();
      router.push("/auth/login");
    } catch {
      showToast.error("Failed", "Could not schedule account deletion. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Delete account" description="Permanently remove your account and data.">
      <div style={{ maxWidth: 520, fontSize: 14, color: "var(--text-secondary, #555)", lineHeight: 1.6 }}>
        <p style={{ margin: "0 0 12px" }}>
          When you delete your account we keep your data for a <strong>30-day grace period</strong>,
          then remove it permanently. We&apos;ll email you a link to export everything and a link
          to cancel if you change your mind. Your account is deactivated immediately.
        </p>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            style={{ border: "1px solid #DC2626", color: "#DC2626", background: "transparent", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}
          >
            Delete my account…
          </button>
        ) : (
          <div style={{ border: "1px solid #FCA5A5", background: "#FEF2F2", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 10px", color: "#7F1D1D" }}>
              This deactivates your account now and schedules deletion in 30 days. Type{" "}
              <code style={{ fontFamily: "var(--font-mono, monospace)" }}>DELETE</code> to confirm.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 12px", fontSize: 14 }}
              />
              <button
                disabled={busy || confirmText !== "DELETE"}
                onClick={requestDeletion}
                style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: confirmText === "DELETE" ? "pointer" : "not-allowed", opacity: confirmText === "DELETE" && !busy ? 1 : 0.5 }}
              >
                {busy ? "Scheduling…" : "Confirm deletion"}
              </button>
              <button
                onClick={() => { setOpen(false); setConfirmText(""); }}
                style={{ border: "1px solid #D1D5DB", background: "transparent", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SecurityTab;
