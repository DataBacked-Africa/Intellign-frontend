"use client";

import React from 'react';
import Link from 'next/link';
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
    const { clearSession, sessions, sessionId } = useSessionStore();

    return (
        <motion.div
            initial={{ width: isOpen ? 260 : 0 }} // 0 width for closed state on mobile, but here 60 or 0
            animate={{ width: isOpen ? 260 : 0 }} // ChatGPT hides it completely usually or just icon
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "h-screen bg-[#171717] flex flex-col flex-shrink-0 z-40 relative border-r border-white/5",
                !isOpen && "hidden md:flex md:w-[0px] overflow-hidden" // Simply hide if closed for that crisp look
            )}
        >
            {/* Toggle Button - Floating outside if closed, or inside? ChatGPT puts it top left of main content. 
                For now, let's keep it simple: if open, show content. If closed, user opens via top navbar usually. 
                But let's keep the toggle absolute like before but cleaner.
             */}

            {/* New Chat Button */}
            <div className="p-3 px-3 pt-4">
                <Link
                    href="/"
                    onClick={clearSession}
                    className={cn(
                        "flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-white/5 transition-colors group border border-white/10 text-sm text-white",
                    )}
                >
                    <div className="bg-white text-black p-0.5 rounded-sm">
                        <Plus className="w-4 h-4" />
                    </div>
                    {isOpen && <span className="font-medium">New chat</span>}
                </Link>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
                {sessions.length > 0 && (
                    <div className="mb-2 px-2 text-xs font-medium text-gray-500">Today</div>
                )}

                <div className="space-y-1">
                    {sessions.map((session) => (
                        <Link
                            key={session.sessionId || Math.random()}
                            href={`/sessions/${session.sessionId}`}
                            className={cn(
                                "flex items-center gap-3 w-full p-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2A2B32] transition-colors text-left group",
                                session.sessionId === sessionId && "bg-[#2A2B32] text-white"
                            )}
                        >
                            <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-white" />
                            {isOpen && (
                                <span className="truncate flex-1">
                                    {/* Mock Title Logic */}
                                    Optimization {session.sessionId?.substring(0, 4)}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-white/5">
                <button
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#2A2B32] transition-colors text-gray-300 text-left"
                >
                    <div className="w-8 h-8 rounded-sm bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                        {user?.name?.charAt(0) || "U"}
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                        </div>
                    )}
                    <div onClick={(e) => { e.stopPropagation(); logout(); }} className="p-1 hover:text-white">
                        <LogOut className="w-4 h-4" />
                    </div>
                </button>
            </div>
        </motion.div>
    );
};

export default AppSidebar;
