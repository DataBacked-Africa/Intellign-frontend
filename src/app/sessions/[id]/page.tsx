"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';
import SmartUploadWizard from '@/components/AI-Components/SmartUploadWizard';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;

    const { setSessionId } = useSessionStore();

    useEffect(() => {
        if (sessionId) setSessionId(sessionId);
    }, [sessionId, setSessionId]);

    return (
        <div className="w-full h-full">
            <SmartUploadWizard initialSessionId={sessionId} />
        </div>
    );
}
