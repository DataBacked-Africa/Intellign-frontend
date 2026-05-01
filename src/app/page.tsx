"use client";

import React, { useCallback, useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import AppShell from "@/components/Layout/AppShell";
import SmartUploadWizard from "@/components/AI-Components/SmartUploadWizard";

export default function Home() {
    const { clearSession } = useSessionStore();

    // Always start with a clean slate on the home page
    useEffect(() => {
        clearSession();
    }, [clearSession]);

    // Silently update the URL after the first message — no navigation, no re-render
    const handleSessionCreated = useCallback((sessionId: string) => {
        window.history.replaceState(null, '', `/sessions/${sessionId}`);
    }, []);

    return (
        <AppShell>
            <div className="w-full h-full">
                <SmartUploadWizard onSessionCreated={handleSessionCreated} />
            </div>
        </AppShell>
    );
}
