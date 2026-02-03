"use client";

import React, { useEffect } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import SessionOrchestratorView from '@/components/AI-Components/SessionOrchestratorView';
import { useParams } from 'next/navigation';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const { loadSession, fetchSessionStatus, sessionId: currentSessionId } = useSessionStore();

    useEffect(() => {
        if (sessionId && sessionId !== currentSessionId) {
            // First try to load from local history for speed
            loadSession(sessionId);
            // Then fetch fresh status from API to ensure sync
            fetchSessionStatus(sessionId);
        }
    }, [sessionId, currentSessionId, loadSession, fetchSessionStatus]);

    // Changed to min-h-screen and justify-start to allow scrolling
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start py-8 px-4 md:px-8 bg-gray-50/30">
            <div className="w-full max-w-6xl z-10">
                <SessionOrchestratorView />
            </div>
        </div>
    );
}
