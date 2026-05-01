"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';
import SmartUploadWizard from '@/components/AI-Components/SmartUploadWizard';
import OptimizationResultsView from '@/components/AI-Components/OptimizationResultsView';
import ProcessingConsole from '@/components/AI-Components/ProcessingConsole';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;

    const { sessionStatus, jobId, setSessionId } = useSessionStore();

    useEffect(() => {
        if (sessionId) setSessionId(sessionId);
    }, [sessionId, setSessionId]);

    const showResults = sessionStatus === 'COMPLETED' && !!jobId;
    const showProgress = sessionStatus === 'PROCESSING';
    const chatHeight = showResults || showProgress ? '420px' : '90vh';

    return (
        <div className="w-full h-full overflow-y-auto flex flex-col items-center pt-8 pb-8 px-4 gap-6">
            {/* Unified chat — handles ingestion + goal definition + triggers optimization */}
            <div className="w-full max-w-2xl" style={{ height: chatHeight, minHeight: '420px' }}>
                <SmartUploadWizard initialSessionId={sessionId} />
            </div>

            {/* Live optimization progress */}
            {showProgress && (
                <div className="w-full max-w-2xl">
                    <ProcessingConsole />
                </div>
            )}

            {/* Results panel */}
            {showResults && (
                <div className="w-full max-w-6xl">
                    <OptimizationResultsView />
                </div>
            )}
        </div>
    );
}
