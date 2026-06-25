"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, User, Lock, Bell, Users, KeyRound } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import NotificationsTab from "./NotificationsTab";
import TeamTab from "./TeamTab";
import ApiKeysTab from "./ApiKeysTab";

export interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  email_prefs: Record<string, boolean>;
  organization?: { id: string; name: string; slug: string } | null;
}

type TabId = "profile" | "security" | "notifications" | "team" | "api-keys";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "api-keys", label: "API keys", icon: KeyRound },
];

const SettingsView: React.FC = () => {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("profile");

  const refresh = useCallback(async () => {
    const r = await axiosInstance.get("/api/v1/me");
    setMe(r.data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(20px, 5vw, 32px) clamp(14px, 4vw, 20px) 64px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(24px, 6vw, 30px)", letterSpacing: "-0.02em", color: "var(--brand-maroon-deep)", margin: "0 0 24px" }}>
          Settings
        </h1>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--brand-bone-deep)", marginBottom: 24, overflowX: "auto" }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "10px 14px",
                  background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  color: active ? "var(--brand-maroon)" : "var(--fg-secondary)",
                  borderBottom: active ? "2px solid var(--brand-maroon)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </button>
            );
          })}
        </div>

        {loading || !me ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} />
          </div>
        ) : (
          <>
            {tab === "profile" && <ProfileTab me={me} refresh={refresh} />}
            {tab === "security" && <SecurityTab />}
            {tab === "notifications" && <NotificationsTab me={me} refresh={refresh} />}
            {tab === "team" && <TeamTab me={me} />}
            {tab === "api-keys" && <ApiKeysTab />}
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
