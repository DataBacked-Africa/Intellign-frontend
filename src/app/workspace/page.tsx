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

  // Wait one tick for Zustand persist to rehydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    clearSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [hydrated, isAuthenticated, router]);

  const handleSessionCreated = useCallback((sessionId: string) => {
    window.history.replaceState(null, "", `/sessions/${sessionId}`);
  }, []);

  if (!hydrated || !isAuthenticated) return null;

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
