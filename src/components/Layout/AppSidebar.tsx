"use client";

import React, { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { Plus, MessageSquare, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { useSessionStore } from '@/store/useSessionStore';
import { motion } from 'framer-motion';
import axiosInstance from '@/lib/axiosConfig';

interface AppSidebarProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useUserStore();
    const { clearSession, sessions, sessionId, fetchHistory } = useSessionStore();

    // Local map of sessionId → generated name (fills in async)
    const [generatingFor, setGeneratingFor] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // For each session without a name, call the backend once to generate + persist it
    const requestName = useCallback(async (sid: string) => {
        if (generatingFor.has(sid)) return;
        setGeneratingFor(prev => new Set(prev).add(sid));

        try {
            const res = await axiosInstance.post(`/sessions/${sid}/name`);
            const name: string = res.data?.data?.name ?? res.data?.name ?? '';
            if (!name) return;

            // Patch the sessions list in the store with the returned name
            useSessionStore.setState(state => ({
                sessions: state.sessions.map(s =>
                    s.sessionId === sid ? { ...s, name } : s
                ),
            }));
        } catch {
            // silently ignore — name stays as fallback
        } finally {
            setGeneratingFor(prev => {
                const next = new Set(prev);
                next.delete(sid);
                return next;
            });
        }
    }, [generatingFor]);

    // Fire generation for unnamed sessions whenever the list changes
    useEffect(() => {
        sessions
            .filter(s => !s.name)
            .forEach(s => requestName(s.sessionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessions]);

    return (
        <motion.div
            initial={{ width: isOpen ? 260 : 0 }}
            animate={{ width: isOpen ? 260 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
                'h-screen bg-[#171717] flex flex-col shrink-0 z-40 relative border-r border-white/5',
                !isOpen && 'hidden md:flex md:w-0 overflow-hidden'
            )}
        >
            {/* New Chat */}
            <div className="p-3 pt-4">
                <Link
                    href="/"
                    onClick={clearSession}
                    className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-white/10 text-sm text-white"
                >
                    <div className="bg-white text-black p-0.5 rounded-sm">
                        <Plus className="w-4 h-4" />
                    </div>
                    {isOpen && <span className="font-medium">New chat</span>}
                </Link>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto py-2 px-3">
                {sessions.length > 0 && isOpen && (
                    <p className="mb-2 px-2 text-xs font-medium text-gray-500">Recent</p>
                )}

                <div className="space-y-1">
                    {sessions.map(session => {
                        const isActive = session.sessionId === sessionId;
                        const isGenerating = generatingFor.has(session.sessionId);
                        const label = session.name
                            || (isGenerating ? null : `Session ${session.sessionId.substring(0, 8)}`);

                        return (
                            <Link
                                key={session.sessionId}
                                href={`/sessions/${session.sessionId}`}
                                className={cn(
                                    'flex items-center gap-3 w-full p-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2A2B32] transition-colors group',
                                    isActive && 'bg-[#2A2B32] text-white'
                                )}
                            >
                                <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" />
                                {isOpen && (
                                    <span className="truncate flex-1 text-left">
                                        {isGenerating && !session.name ? (
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span className="text-xs">Naming…</span>
                                            </span>
                                        ) : (
                                            label
                                        )}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* User profile */}
            <div className="p-3 border-t border-white/5">
                <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#2A2B32] transition-colors text-gray-300">
                    <div className="w-8 h-8 rounded-sm bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        title="Sign out"
                        className="p-1 hover:text-white transition-colors shrink-0"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AppSidebar;
