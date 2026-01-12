import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Logo / Header */}
            <div className="absolute top-8 left-8 z-10">
                <Link href="/">
                    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        {/* Replace with actual logo if available, for now using Next/Image placeholder or just text if preferred, but usually logo.png exists based on NavBar */}
                        <Image src="/logo.png" alt="Logo" width={100} height={40} className="object-contain" />
                    </div>
                </Link>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
                {children}
            </div>

            <div className="absolute bottom-6 text-xs text-gray-400">
                &copy; {new Date().getFullYear()} DataBackedAfrica. All rights reserved.
            </div>
        </div>
    );
}
