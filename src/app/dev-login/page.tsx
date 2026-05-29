"use client";

// Dev-only bypass page — only works when NEXT_PUBLIC_DEV_BYPASS=true
// Lets you inject a real JWT token OR use a mock user for pure UI testing.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';

const BYPASS_ENABLED = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

const MOCK_USER = {
    id: 'dev-user-001',
    name: 'Dev User',
    email: 'dev@intellign.local',
    role: 'admin',
    organizationId: 'dev-org-001',
    organizationName: 'Dev Org',
};

// A non-expiring mock JWT (payload: { sub: "dev", exp: 9999999999 })
const MOCK_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiJkZXYiLCJleHAiOjk5OTk5OTk5OTl9.' +
    'mock_signature_for_dev_only';

export default function DevLoginPage() {
    const { login, isAuthenticated } = useUserStore();
    const router = useRouter();
    const [token, setToken] = useState('');
    const [mode, setMode] = useState<'mock' | 'token'>('mock');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!BYPASS_ENABLED) {
            router.replace('/auth/login');
        }
    }, [router]);

    useEffect(() => {
        if (isAuthenticated && done) {
            router.replace('/workspace');
        }
    }, [isAuthenticated, done, router]);

    if (!BYPASS_ENABLED) return null;

    const handleMockLogin = () => {
        login(MOCK_USER, MOCK_TOKEN, MOCK_TOKEN);
        setDone(true);
    };

    const handleTokenLogin = () => {
        const t = token.trim();
        if (!t) return;
        login(MOCK_USER, t, t);
        setDone(true);
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6">

                {/* Header */}
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Dev bypass</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">Skip Login</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Only available when <code className="text-amber-400 text-[11px]">NEXT_PUBLIC_DEV_BYPASS=true</code>
                    </p>
                </div>

                {/* Mode toggle */}
                <div className="flex rounded-xl overflow-hidden border border-gray-700">
                    <button
                        onClick={() => setMode('mock')}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            mode === 'mock'
                                ? 'bg-[#5C1427] text-white'
                                : 'bg-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Mock user
                    </button>
                    <button
                        onClick={() => setMode('token')}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            mode === 'token'
                                ? 'bg-[#5C1427] text-white'
                                : 'bg-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Paste JWT
                    </button>
                </div>

                {mode === 'mock' ? (
                    <div className="space-y-4">
                        <div className="bg-gray-800 rounded-xl p-3 space-y-1 text-xs text-gray-400">
                            <p><span className="text-gray-500">Name:</span> <span className="text-white font-medium">{MOCK_USER.name}</span></p>
                            <p><span className="text-gray-500">Email:</span> <span className="text-white font-medium">{MOCK_USER.email}</span></p>
                            <p className="text-amber-400/70 pt-1">API calls will use a mock token — backend endpoints will return 401. Use "Paste JWT" for real API testing.</p>
                        </div>
                        <button
                            onClick={handleMockLogin}
                            className="w-full py-3 bg-[#5C1427] hover:bg-[#7a1b35] text-white font-semibold rounded-xl transition-colors"
                        >
                            Enter as Dev User →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                Your JWT access token
                            </label>
                            <textarea
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                rows={4}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-mono placeholder-gray-600 outline-none focus:border-[#5C1427]/60 resize-none"
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                                Get this from <code className="text-gray-400">POST /api/v1/auth/login</code> or copy from browser localStorage.
                            </p>
                        </div>
                        <button
                            onClick={handleTokenLogin}
                            disabled={!token.trim()}
                            className="w-full py-3 bg-[#5C1427] hover:bg-[#7a1b35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                        >
                            Enter with Token →
                        </button>
                    </div>
                )}

                <p className="text-center text-[10px] text-gray-600">
                    Remove <code>NEXT_PUBLIC_DEV_BYPASS</code> from .env.local before shipping.
                </p>
            </div>
        </div>
    );
}
