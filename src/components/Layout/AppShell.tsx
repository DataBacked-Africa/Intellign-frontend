"use client";

import React, { useState, useRef, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import { Menu, PanelLeftOpen, ChevronDown, Share, Check, Zap, Target, LayoutTemplate } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import { CanvasProvider, useCanvas } from '@/contexts/CanvasContext';
import OptimizationCanvas from '@/components/AI-Components/OptimizationCanvas';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import ShareModal from '@/components/Sharing/ShareModal';
import PresenceBar from '@/components/Sharing/PresenceBar';
import CursorOverlay from '@/components/Sharing/CursorOverlay';
import { useUserStore } from '@/store/useUserStore';
import { useSessionPresence } from '@/hooks/useSessionPresence';

interface AppShellProps {
    children: React.ReactNode;
}

const AppShellInner: React.FC<AppShellProps> = ({ children }) => {
    const canvasCtx = useCanvas();
    const { isOpen: canvasOpen, isMinimized: canvasMinimized, restore } = canvasCtx;
    const canvasVisible = canvasOpen && !canvasMinimized;
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'Smart Chat' | 'Manual Method'>('Smart Chat');
    const [shareOpen, setShareOpen] = useState(false);
    const { sessionId } = useSessionStore();
    const authToken = useUserStore(s => s.token);
    const { participants, cursors, sendCursor } = useSessionPresence({ sessionId, authToken });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex h-dvh w-full overflow-hidden" style={{ background: 'var(--brand-bone)', color: 'var(--fg-primary)' }}>

            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-[260px] animate-in slide-in-from-left duration-300" style={{ background: 'var(--brand-bone)' }}>
                        <AppSidebar isOpen={true} setIsOpen={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Sticky Top Bar */}
                <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-2 sm:px-4 flex-shrink-0 border-b transition-colors" style={{ background: 'var(--bg-header)', backdropFilter: 'blur(12px)', borderColor: 'transparent' }}>
                    {/* Left: Toggles & Title */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 rounded-md md:hidden transition-colors"
                            style={{ color: 'var(--fg-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-bone-deep)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Desktop Toggle (Closed state only) */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="hidden md:flex p-2 rounded-md transition-colors"
                                style={{ color: 'var(--fg-secondary)' }}
                                title="Open Sidebar"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-bone-deep)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>
                        )}

                        {/* Title Dropdown */}
                        <div className="relative ml-1 md:ml-0" ref={dropdownRef}>
                            <button
                                onClick={() => !sessionId && setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors font-semibold text-[15px]"
                                style={{ color: 'var(--brand-maroon-deep)', cursor: !sessionId ? 'pointer' : 'default' }}
                            >
                                Intellign AI
                                {!sessionId && (
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        style={{ color: 'var(--fg-tertiary)' }}
                                    />
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && !sessionId && (
                                <div className="absolute top-full left-0 mt-1 w-60 border shadow-xl rounded-xl p-1 z-50"
                                    style={{ background: 'var(--brand-bone)', borderColor: 'var(--border-subtle)' }}>
                                    {(['Smart Chat', 'Manual Method'] as const).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => { setSelectedMethod(m); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors"
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-bone-deep)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div>
                                                <div className="text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>{m}</div>
                                                <div className="text-xs" style={{ color: 'var(--fg-tertiary)' }}>
                                                    {m === 'Smart Chat' ? 'AI-assisted optimization' : 'Traditional configuration'}
                                                </div>
                                            </div>
                                            {selectedMethod === m && <Check className="w-4 h-4 text-[var(--brand-maroon)]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Goals button — always accessible, opens canvas Goals tab */}
                        <button
                            onClick={() => canvasCtx.open('goals')}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                            style={{ color: 'var(--fg-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-bone-deep)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            title="Manage optimization goals"
                        >
                            <Target className="w-4 h-4" />
                            Goals
                        </button>
                        {/* Canvas toggle */}
                        <button
                            onClick={() => canvasCtx.isOpen ? canvasCtx.close() : canvasCtx.open('monitor')}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                            style={{ color: canvasCtx.isOpen ? 'var(--brand-maroon)' : 'var(--fg-secondary)', background: canvasCtx.isOpen ? 'rgba(92,20,39,0.08)' : 'transparent' }}
                            onMouseEnter={e => { if (!canvasCtx.isOpen) (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-bone-deep)'; }}
                            onMouseLeave={e => { if (!canvasCtx.isOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                            title="Toggle optimization canvas"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Canvas
                        </button>
                        <button
                            onClick={() => sessionId && setShareOpen(true)}
                            disabled={!sessionId}
                            title={sessionId ? 'Share this session' : 'Start a session to share'}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                            style={{ color: 'var(--fg-secondary)', opacity: sessionId ? 1 : 0.5, cursor: sessionId ? 'pointer' : 'not-allowed' }}
                            onMouseEnter={e => { if (sessionId) e.currentTarget.style.background = 'var(--brand-bone-deep)'; }}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Share className="w-4 h-4" />
                            Share
                        </button>
                        {participants.length > 1 && <PresenceBar participants={participants} />}
                        <ThemeToggle />
                        <NotificationBell />
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 h-full overflow-hidden relative">
                    {children}
                </main>
            </div>

            {/* Optimization canvas — slides in from right */}
            {canvasVisible && <OptimizationCanvas />}

            {/* Realtime cursors (only meaningful when others are present) */}
            {participants.length > 1 && <CursorOverlay cursors={cursors} sendCursor={sendCursor} />}

            {/* Share modal */}
            {shareOpen && sessionId && <ShareModal sessionId={sessionId} onClose={() => setShareOpen(false)} />}

            {/* Minimized dock */}
            {canvasOpen && canvasMinimized && (
                <button onClick={restore}
                    className="fixed right-5 bottom-5 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full shadow-lg"
                    style={{ background: 'var(--brand-maroon)', color: 'var(--brand-bone)', border: 0, cursor: 'pointer' }}>
                    <span className="w-2 h-2 rounded-full bg-[#FFD08A] animate-pulse inline-block" />
                    Optimization running
                    <Zap size={14} />
                </button>
            )}
        </div>
    );
};

const AppShell: React.FC<AppShellProps> = ({ children }) => (
    <CanvasProvider>
        <AppShellInner>{children}</AppShellInner>
    </CanvasProvider>
);

export default AppShell;
