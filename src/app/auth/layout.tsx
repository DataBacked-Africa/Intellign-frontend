import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
    
        <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900">
            {/* Left Side - Visual Feature */}
            <div className="hidden md:flex flex-col justify-between w-1/2 lg:w-[45%] bg-[#171717] text-white p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                {/* Logo Area */}
                <div className="relative z-10">
                    <Link href="/">
                        <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            {/* Replace with actual logo or text */}
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                                <span className="font-bold text-lg">D</span>
                            </div>
                            <span className="font-medium text-lg tracking-tight">DataBackedAfrica</span>
                        </div>
                    </Link>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-3xl font-light mb-6 leading-tight">
                        Transform your data ingestion into a <span className="text-white font-medium">strategic advantage</span>.
                    </h2>
                    <div className="flex gap-4">
                        <div className="h-1 w-12 bg-white/20 rounded-full" />
                        <div className="h-1 w-2 bg-white/10 rounded-full" />
                        <div className="h-1 w-2 bg-white/10 rounded-full" />
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-xs text-white/40">
                    &copy; {new Date().getFullYear()} DataBackedAfrica.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
                {/* Mobile Logo (visible only on small screens) */}
                <div className="md:hidden absolute top-6 left-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">D</div>
                    </Link>
                </div>

                <div className="w-full max-w-[420px]">
                    {children}
                </div>
            </div>
        </div>
    );
}
