"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import AppShell from "@/components/Layout/AppShell";
import SmartUploadWizard from "@/components/AI-Components/SmartUploadWizard";

export default function WorkspacePage() {
  const { clearSession, newChatKey } = useSessionStore();
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to rehydrate (two ticks: one for mount, one for persist)
  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    clearSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydrated) return;
    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
    if (!isAuthenticated) {
      router.push(devBypass ? "/dev-login" : "/auth/login");
    }
  }, [hydrated, isAuthenticated, router]);

  const handleSessionCreated = useCallback((sessionId: string) => {
    window.history.replaceState(null, "", `/sessions/${sessionId}`);
  }, []);

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="w-full h-full">
        <SmartUploadWizard
          key={newChatKey}
          onSessionCreated={handleSessionCreated}
        />
      </div>
    </AppShell>
  );
}
