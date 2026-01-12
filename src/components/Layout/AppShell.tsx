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
        <div className="flex h-screen w-full bg-[#F5F5F5] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-[280px] bg-[#0F0F0F] animate-in slide-in-from-left duration-300">
                        <AppSidebar isOpen={true} setIsOpen={() => { }} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
                    <button onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                    <span className="font-semibold text-gray-800">DBA Intelligence</span>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto relative scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
