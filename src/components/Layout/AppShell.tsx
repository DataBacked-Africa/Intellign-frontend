"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from './AppSidebar';
import { Menu, PanelLeftOpen, ChevronDown, Share, Check } from 'lucide-react';

interface AppShellProps {
    children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<'smart' | 'manual'>('smart');

    const pathname = usePathname();
    // Assuming '/' is the new session page where the user can switch modes
    const isSessionOngoing = pathname !== '/';

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
                        <div className="relative">
                            <button 
                                onClick={() => !isSessionOngoing && setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-gray-700 font-semibold text-[15px] ml-1 md:ml-0 ${!isSessionOngoing ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}`}
                            >
                                Intellign AI {selectedMode === 'manual' ? 'Manual' : ''}
                                {!isSessionOngoing && <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>

                            {isDropdownOpen && !isSessionOngoing && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <button 
                                            onClick={() => { setSelectedMode('smart'); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                        >
                                            Smart Chat
                                            {selectedMode === 'smart' && <Check className="w-4 h-4 text-[#5C1427]" />}
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedMode('manual'); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                        >
                                            Manual Method
                                            {selectedMode === 'manual' && <Check className="w-4 h-4 text-[#5C1427]" />}
                                        </button>
                                    </div>
                                </>
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
