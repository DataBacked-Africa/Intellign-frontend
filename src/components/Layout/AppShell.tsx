"use client";

import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import { Menu } from 'lucide-react';

interface AppShellProps {
    children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                    <div className="absolute left-0 top-0 h-full w-[280px] bg-[#171717] animate-in slide-in-from-left duration-300">
                        <AppSidebar isOpen={true} setIsOpen={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Header / Toggles */}
                <div className="sticky top-0 z-10 p-2 flex items-center md:absolute md:top-2 md:left-2">
                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 rounded-md hover:bg-gray-100 md:hidden text-gray-500"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Desktop Toggle (Closed state only? Or always?) 
                        ChatGPT puts it top-left. If sidebar is open, it might obscure or be inside.
                        Let's put it here. If sidebar is open, we might want to hide THIS button if the sidebar has one?
                        Actually, sidebar doesn't have one anymore. So this button controls it.
                    */}
                    <div className="hidden md:flex items-center gap-2">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                                title="Open Sidebar"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                                title="Close Sidebar"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <main className="flex-1 h-full overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
