"use client";

import React, { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    SquarePen, Search, LogOut, Loader2,
    PanelLeftClose, Link2, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { useSessionStore } from '@/store/useSessionStore';
import { motion } from 'framer-motion';
import axiosInstance from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';

interface AppSidebarProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useUserStore();
    const router = useRouter();
    const { clearSession, sessions, sessionId, fetchHistory, removeSession } = useSessionStore();

    const [generatingFor, setGeneratingFor] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // ── Grok name generation ──────────────────────────────────────────────────
    const requestName = useCallback(async (sid: string) => {
        if (generatingFor.has(sid)) return;
        setGeneratingFor(prev => new Set(prev).add(sid));

        try {
            const res = await axiosInstance.post(`/api/v1/me/sessions/${sid}/name`);
            const name: string = res.data?.data?.name ?? res.data?.name ?? '';
            if (!name) return;
            useSessionStore.setState(state => ({
                sessions: state.sessions.map(s => s.sessionId === sid ? { ...s, name } : s),
            }));
        } catch {
            // silently ignore
        } finally {
            setGeneratingFor(prev => {
                const next = new Set(prev);
                next.delete(sid);
                return next;
            });
        }
    }, [generatingFor]);

    useEffect(() => {
        sessions.filter(s => !s.name).forEach(s => requestName(s.sessionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessions]);

    // ── Share ─────────────────────────────────────────────────────────────────
    const handleShare = useCallback((sid: string) => {
        const url = `${window.location.origin}/sessions/${sid}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast.success('Link copied', 'Session link copied to clipboard.');
        }).catch(() => {
            showToast.error('Failed', 'Could not copy link.');
        });
    }, []);

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = useCallback(async (sid: string) => {
        setDeletingId(sid);
        try {
            await axiosInstance.delete(`/api/v1/me/sessions/${sid}`);
            removeSession(sid);
            if (sid === sessionId) {
                router.push('/');
            }
        } catch {
            showToast.error('Delete failed', 'Could not delete this chat.');
        } finally {
            setDeletingId(null);
        }
    }, [sessionId, removeSession, router]);

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filteredSessions = sessions.filter(s => {
        if (!searchQuery) return true;
        const label = s.name ?? `Session ${s.sessionId.substring(0, 8)}`;
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
            {/* Header */}
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

            {/* New chat + Search */}
            <div className="px-3 pb-2 space-y-0.5">
                <Link
                    href="/workspace"
                    onClick={clearSession}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-900"
                >
                    <SquarePen className="w-4 h-4 text-gray-700" />
                    {isOpen && <span>New chat</span>}
                </Link>

                <div className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 focus-within:ring-2 focus-within:ring-gray-300 transition-colors text-sm text-gray-900">
                    <Search className="w-4 h-4 text-gray-700 shrink-0" />
                    {isOpen && (
                        <input
                            type="text"
                            placeholder="Search chats"
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500 min-w-0"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    )}
                </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3">
                {sessions.length > 0 && isOpen && (
                    <p className="mb-2 px-2 text-xs font-semibold text-gray-900 mt-2">Recents</p>
                )}

                <div className="space-y-0.5">
                    {filteredSessions.length === 0 && searchQuery && isOpen ? (
                        <p className="px-2 text-sm text-gray-500 py-4 text-center">No chats found.</p>
                    ) : filteredSessions.map(session => {
                        const isActive = session.sessionId === sessionId;
                        const isGenerating = generatingFor.has(session.sessionId);
                        const isDeleting = deletingId === session.sessionId;
                        const label = session.name
                            ?? (isGenerating ? null : `Session ${session.sessionId.substring(0, 8)}`);

                        return (
                            <div
                                key={session.sessionId}
                                className={cn(
                                    'group relative flex items-center rounded-lg transition-colors',
                                    isActive ? 'bg-[#E5E5E5]' : 'hover:bg-gray-200',
                                    isDeleting && 'opacity-50 pointer-events-none'
                                )}
                            >
                                {/* Main link area */}
                                <Link
                                    href={`/sessions/${session.sessionId}`}
                                    className="flex-1 flex items-center p-2.5 min-w-0"
                                >
                                    {isOpen && (
                                        <span className="truncate text-sm text-gray-800">
                                            {isGenerating && !session.name ? (
                                                <span className="flex items-center gap-1.5 text-gray-500">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span className="text-xs">Naming…</span>
                                                </span>
                                            ) : isDeleting ? (
                                                <span className="flex items-center gap-1.5 text-gray-400">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span className="text-xs">Deleting…</span>
                                                </span>
                                            ) : (
                                                label
                                            )}
                                        </span>
                                    )}
                                </Link>

                                {/* Hover actions */}
                                {isOpen && !isDeleting && (
                                    <div className="flex items-center gap-0.5 pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="Copy link"
                                            onClick={e => { e.preventDefault(); handleShare(session.sessionId); }}
                                            className="p-1.5 rounded-md hover:bg-gray-300 text-gray-400 hover:text-gray-700 transition-colors"
                                        >
                                            <Link2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            title="Delete chat"
                                            onClick={e => { e.preventDefault(); handleDelete(session.sessionId); }}
                                            className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
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
                        onClick={async () => { await logout(); router.push('/auth/login'); }}
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
