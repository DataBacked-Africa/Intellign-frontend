"use client";

import React from 'react';
import { Plus, MessageSquare, History, Settings, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { useSessionStore } from '@/store/useSessionStore';
import { motion, AnimatePresence } from 'framer-motion';

interface AppSidebarProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useUserStore();
    const { clearSession, sessions, loadSession, sessionId, fetchHistory } = useSessionStore();

    React.useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleNewChat = () => {
        clearSession();
        // Optional: close sidebar on mobile if needed
    };

    return (
        <motion.div
            initial={{ width: isOpen ? 260 : 60 }}
            animate={{ width: isOpen ? 260 : 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-screen bg-[#0F0F0F] border-r border-[#2A2A2A] flex flex-col flex-shrink-0 z-50 relative"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-6 bg-[#2A2A2A] text-gray-400 hover:text-white p-1 rounded-full border border-gray-700 shadow-sm z-50"
            >
                {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            {/* Header / New Chat */}
            <div className="p-3">
                <button
                    onClick={handleNewChat}
                    className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-lg border border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors group",
                        !isOpen && "justify-center px-0"
                    )}
                >
                    <Plus className="w-5 h-5 text-[#5c1427] group-hover:text-[#7a1b34]" />
                    {isOpen && (
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-medium text-gray-200">New Optimization</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Navigation / History */}
            <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
                {isOpen && (
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        History
                    </p>
                )}
                <div className="space-y-1">
                    {/* Mock History Items if empty */}
                    {sessions.length === 0 && isOpen && (
                        <p className="px-4 text-xs text-gray-600 italic">No past sessions</p>
                    )}

                    {sessions.map((session) => (
                        <button
                            key={session.sessionId || Math.random()}
                            onClick={() => session.sessionId && loadSession(session.sessionId)}
                            className={cn(
                                "flex items-center gap-3 w-full p-2.5 rounded-lg text-sm text-gray-400 hover:bg-[#1F1F1F] hover:text-white transition-colors text-left",
                                session.sessionId === sessionId && "bg-[#1F1F1F] text-white",
                                !isOpen && "justify-center"
                            )}
                        >
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            {isOpen && (
                                <span className="truncate">
                                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : "Session"} - {session.status}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-[#2A2A2A]">
                <div className={cn(
                    "flex items-center gap-3 p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors cursor-pointer text-gray-300",
                    !isOpen && "justify-center"
                )}>
                    <div className="w-8 h-8 rounded-full bg-[#5c1427]/20 flex items-center justify-center text-[#5c1427] border border-[#5c1427]/30">
                        <span className="font-bold text-xs">{user?.name?.charAt(0) || "U"}</span>
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.organizationName || "Organization"}</p>
                        </div>
                    )}
                    {isOpen && (
                        <button onClick={logout} className="text-gray-500 hover:text-red-400">
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AppSidebar;
