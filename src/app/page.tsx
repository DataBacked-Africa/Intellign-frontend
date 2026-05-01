"use client";

import React, { useCallback, useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import AppShell from "@/components/Layout/AppShell";
import SmartUploadWizard from "@/components/AI-Components/SmartUploadWizard";

export default function Home() {
    const { clearSession, newChatKey } = useSessionStore();

    // Always start with a clean slate on the home page
    useEffect(() => {
        clearSession();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Silently update the URL after the first message — no navigation, no re-render
    const handleSessionCreated = useCallback((sessionId: string) => {
        window.history.replaceState(null, '', `/sessions/${sessionId}`);
    }, []);

    return (
        <AppShell>
            <div className="w-full h-full">
                {/* key={newChatKey} forces a full remount when "New Chat" is clicked,
                    even if the URL hasn't actually changed (due to history.replaceState). */}
                <SmartUploadWizard
                    key={newChatKey}
                    onSessionCreated={handleSessionCreated}
                />
            </div>
        </AppShell>
    );
}
