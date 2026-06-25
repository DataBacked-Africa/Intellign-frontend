"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import AppShell from "@/components/Layout/AppShell";
import SettingsView from "@/components/Settings/SettingsView";

export default function SettingsPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to rehydrate before checking auth.
  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";
    if (!isAuthenticated) router.push(devBypass ? "/dev-login" : "/auth/login");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <AppShell>
      <SettingsView />
    </AppShell>
  );
}
