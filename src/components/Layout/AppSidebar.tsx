"use client";

import React, { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import {
    SquarePen,
    Search,
    LogOut,
    Loader2,
    PanelLeftClose
} from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredSessions = sessions.filter(session => {
        if (!searchQuery) return true;
        const isGenerating = generatingFor.has(session.sessionId);
        const label = session.name || (isGenerating ? '' : `Session ${session.sessionId.substring(0, 8)}`);
        return label.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <motion.div
            initial={{ width: isOpen ? 260 : 0 }}
            animate={{ width: isOpen ? 260 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
                'h-screen bg-[#F9F9F9] flex flex-col shrink-0 z-40 relative',
                !isOpen && 'hidden md:flex md:w-0 overflow-hidden'
            )}
        >
            {/* Top Header */}
            <div className="p-3 pt-4 flex items-center justify-between">
                {isOpen && (
                    <div className="flex items-center gap-2 px-2">
                        <img src="/logo.png" alt="Logo" className="h-7 object-contain" />
                    </div>
                )}
                {isOpen && (
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                        title="Close sidebar"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Main Links */}
            <div className="px-3 pb-2 space-y-0.5">
                <Link
                    href="/"
                    onClick={clearSession}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-900 group"
                >
                    <SquarePen className="w-4 h-4 text-gray-700" />
                    {isOpen && <span>New chat</span>}
                </Link>
                <div className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 focus-within:ring-2 focus-within:ring-gray-300 transition-colors text-sm text-gray-900 group">
                    <Search className="w-4 h-4 text-gray-700 shrink-0" />
                    {isOpen && (
                        <input
                            type="text"
                            placeholder="Search chats"
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500 min-w-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    )}
                </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto py-2 px-3">
                {sessions.length > 0 && isOpen && (
                    <p className="mb-2 px-2 text-xs font-semibold text-gray-900 mt-2">Recents</p>
                )}

                <div className="space-y-0.5">
                    {filteredSessions.length === 0 && searchQuery && isOpen ? (
                        <p className="px-2 text-sm text-gray-500 py-4 text-center">No chats found.</p>
                    ) : filteredSessions.map(session => {
                        const isActive = session.sessionId === sessionId;
                        const isGenerating = generatingFor.has(session.sessionId);
                        const label = session.name
                            || (isGenerating ? null : `Session ${session.sessionId.substring(0, 8)}`);

                        return (
                            <Link
                                key={session.sessionId}
                                href={`/sessions/${session.sessionId}`}
                                className={cn(
                                    'flex items-center w-full p-2.5 rounded-lg text-sm text-gray-800 hover:bg-gray-200 transition-colors group',
                                    isActive && 'bg-[#E5E5E5] font-medium'
                                )}
                            >
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
            <div className="p-3">
                <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-800">
                    <div className="w-8 h-8 rounded-full bg-[#5C1427]/10 flex items-center justify-center text-[#5C1427] font-medium shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        title="Sign out"
                        className="p-1 hover:text-gray-900 text-gray-500 transition-colors shrink-0"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AppSidebar;
