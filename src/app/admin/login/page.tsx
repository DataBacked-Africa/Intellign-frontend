"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAdminStore } from "@/store/useAdminStore";
import { ADMIN_BASE } from "@/lib/adminApi";
import { adminPath } from "@/lib/adminPath";

export default function AdminLoginPage() {
    const router = useRouter();
    const login = useAdminStore((s) => s.login);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const r = await axios.post(`${ADMIN_BASE}/login`, { email, password });
            const { tier, user, tokens } = r.data;
            login(user, tier, tokens.access_token, tokens.refresh_token);
            router.replace(adminPath("/"));
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403) setError("This account doesn't have admin access.");
            else if (status === 401) setError("Invalid email or password.");
            else setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#FBF8F4]">
            {/* Left — brand panel */}
            <div className="hidden lg:flex flex-col justify-between bg-[#3E0E1A] text-[#FBF8F4] p-12 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, #FBF8F4 1px, transparent 0)",
                        backgroundSize: "22px 22px",
                    }}
                />
                <div className="relative flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/intellign-mark.svg" alt="Intellign" className="h-9 w-9 rounded-lg ring-1 ring-[#FBF8F4]/15" />
                    <div>
                        <div className="text-sm tracking-[0.2em] uppercase text-[#E8C9A0]/80">Intellign</div>
                        <div className="mt-0.5 text-xs text-[#FBF8F4]/50">Platform Administration</div>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <h2
                        className="text-4xl leading-tight"
                        style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
                    >
                        The control room for everything happening inside Intellign.
                    </h2>
                    <p className="mt-4 text-[#FBF8F4]/60 text-sm leading-relaxed">
                        Monitor usage, users, optimizations, cost and system health — and act on it,
                        all in one place.
                    </p>
                </div>

                <div className="relative text-xs text-[#FBF8F4]/40">
                    Authorized personnel only · Access is audited
                </div>
            </div>

            {/* Right — form */}
            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8 text-center">
                        <div className="text-sm tracking-[0.2em] uppercase text-[#3E0E1A]">Intellign</div>
                        <div className="text-xs text-neutral-400 mt-0.5">Platform Administration</div>
                    </div>

                    <h1
                        className="text-2xl text-neutral-900"
                        style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
                    >
                        Welcome back
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1 mb-8">
                        Sign in to the admin panel.
                    </p>

                    {error && (
                        <div className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="you@databackedafrica.com"
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#3E0E1A] focus:ring-2 focus:ring-[#3E0E1A]/15 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#3E0E1A] focus:ring-2 focus:ring-[#3E0E1A]/15 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#3E0E1A] text-[#FBF8F4] text-sm font-medium py-2.5 hover:bg-[#511426] active:bg-[#330b16] disabled:opacity-60 transition flex items-center justify-center gap-2"
                        >
                            {loading && (
                                <span className="h-3.5 w-3.5 rounded-full border-2 border-[#FBF8F4]/40 border-t-[#FBF8F4] animate-spin" />
                            )}
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-8 text-xs text-neutral-400 text-center">
                        Access is restricted to platform administrators and is audited.
                    </p>
                </div>
            </div>
        </div>
    );
}
