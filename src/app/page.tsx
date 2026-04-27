"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import AppShell from "@/components/Layout/AppShell";
import MainWorkspace from "@/components/AI-Components/MainWorkspace";

export default function Home() {
    const router = useRouter();
    const { clearSession, setSessionId } = useSessionStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Generate a new session ID and navigate to the session page
        const newSessionId = crypto.randomUUID();
        clearSession();
        setSessionId(newSessionId);
        router.replace(`/sessions/${newSessionId}`);
    }, [router, clearSession, setSessionId]);

    // Show nothing while redirecting
    return null;
}
