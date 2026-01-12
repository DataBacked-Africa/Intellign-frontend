"use client";

import React from "react";
import AppShell from "@/components/Layout/AppShell";
import MainWorkspace from "@/components/AI-Components/MainWorkspace";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, isLoading } = useUserStore();
  const router = useRouter();

  // Basic route protection
  // Note: Middleware is usually better for this, but keeping it client-side for consistency with current patterns
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
        // Optional: Redirect to login if explicit auth is required for landing
        // router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);


  return (
    <AppShell>
       <MainWorkspace />
    </AppShell>
  );
}