"use client";

import React, { useState } from "react";
import { Card, Row, Toggle } from "./ui";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import type { Me } from "./SettingsView";

// Email notification types the user can toggle. `type` matches the backend
// notification type stored in User.email_prefs. Missing/true = receive.
const EMAIL_TYPES: { type: string; label: string; hint: string }[] = [
  { type: "optimization_complete", label: "Optimization complete", hint: "Email me when one of my optimization runs finishes." },
  { type: "job_failed", label: "Job failed", hint: "Email me when an optimization or data job fails." },
  { type: "data_expiring", label: "Data expiring", hint: "Warn me before my uploaded data is purged by retention." },
  { type: "session_shared", label: "Session shared", hint: "Email me when someone shares a session with me." },
];

const NotificationsTab: React.FC<{ me: Me; refresh: () => Promise<void> }> = ({ me, refresh }) => {
  // Toggles are framed positively ("email me"), so enabled = NOT opted out.
  const [prefs, setPrefs] = useState<Record<string, boolean>>(me.email_prefs ?? {});
  const [savingType, setSavingType] = useState<string | null>(null);

  const isEnabled = (type: string) => prefs[type] !== false;

  const handleToggle = async (type: string, next: boolean) => {
    const prev = prefs;
    setPrefs((p) => ({ ...p, [type]: next }));
    setSavingType(type);
    try {
      await axiosInstance.patch("/api/v1/me", { email_prefs: { [type]: next } });
      await refresh();
    } catch {
      setPrefs(prev); // revert on failure
      showToast.error("Failed", "Could not update your preference. Please try again.");
    } finally {
      setSavingType(null);
    }
  };

  return (
    <Card title="Email notifications" description="Choose which emails Intellign sends you. Account and security emails are always sent.">
      {EMAIL_TYPES.map(({ type, label, hint }) => (
        <Row key={type} label={label} hint={hint}>
          <Toggle checked={isEnabled(type)} onChange={(v) => handleToggle(type, v)} disabled={savingType === type} />
        </Row>
      ))}
    </Card>
  );
};

export default NotificationsTab;
