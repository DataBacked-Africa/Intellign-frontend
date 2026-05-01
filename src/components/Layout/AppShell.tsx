"use client";

import React, { useState, useRef, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import { Menu, PanelLeftOpen, ChevronDown, Share, Check } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';

interface AppShellProps {
    children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'Smart Chat' | 'Manual Method'>('Smart Chat');
    const { sessionId } = useSessionStore();
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
        <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-[260px] bg-[#F9F9F9] animate-in slide-in-from-left duration-300">
                        <AppSidebar isOpen={true} setIsOpen={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Sticky Top Bar */}
                <header className="sticky top-0 z-10 h-14 bg-white flex items-center justify-between px-2 sm:px-4 flex-shrink-0 border-b border-transparent hover:border-gray-100 transition-colors">
                    {/* Left: Toggles & Title */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 rounded-md hover:bg-gray-100 md:hidden text-gray-500 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Desktop Toggle (Closed state only) */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="hidden md:flex p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                                title="Open Sidebar"
                            >
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>
                        )}

                        {/* Title Dropdown */}
                        <div className="relative ml-1 md:ml-0" ref={dropdownRef}>
                            <button 
                                onClick={() => !sessionId && setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-gray-700 font-semibold text-[15px] ${!sessionId ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}`}
                            >
                                Intellign AI
                                {!sessionId && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && !sessionId && (
                                <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50">
                                    <button 
                                        onClick={() => { setSelectedMethod('Smart Chat'); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Smart Chat</div>
                                            <div className="text-xs text-gray-500">AI-assisted optimization</div>
                                        </div>
                                        {selectedMethod === 'Smart Chat' && <Check className="w-4 h-4 text-[#5C1427]" />}
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedMethod('Manual Method'); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Manual Method</div>
                                            <div className="text-xs text-gray-500">Traditional configuration</div>
                                        </div>
                                        {selectedMethod === 'Manual Method' && <Check className="w-4 h-4 text-[#5C1427]" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
                            <Share className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 h-full overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
