"use client";

import React, { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import SessionOrchestratorView from '@/components/AI-Components/SessionOrchestratorView';
import AgentConversationPanel from '@/components/AI-Components/AgentConversationPanel';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const { loadSession, fetchSessionStatus, sessionId: currentSessionId } = useSessionStore();
    const [agentOpen, setAgentOpen] = useState(false);

    useEffect(() => {
        if (sessionId && sessionId !== currentSessionId) {
            loadSession(sessionId);
            fetchSessionStatus(sessionId);
        }
    }, [sessionId, currentSessionId, loadSession, fetchSessionStatus]);

    return (
        <div className="w-full h-full overflow-y-auto">
            <SessionOrchestratorView />

            {/* Floating trigger */}
            <button
                onClick={() => setAgentOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5"
            >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Assistant</span>
            </button>

            {/* Backdrop */}
            <AnimatePresence>
                {agentOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                        onClick={() => setAgentOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Drawer */}
            <AnimatePresence>
                {agentOpen && (
                    <motion.div
                        key="drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="fixed top-0 right-0 h-full w-[380px] xl:w-[420px] z-50 shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setAgentOpen(false)}
                            className="absolute top-3 left-[-44px] z-10 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <AgentConversationPanel />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
