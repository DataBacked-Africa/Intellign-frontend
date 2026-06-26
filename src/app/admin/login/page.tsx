"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAdminStore } from "@/store/useAdminStore";
import { ADMIN_BASE } from "@/lib/adminApi";

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
            router.replace("/admin");
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403) setError("This account is not a platform admin.");
            else if (status === 401) setError("Invalid email or password.");
            else setError("Login failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100">
            <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h1 className="text-lg font-semibold text-neutral-900">Intellign Admin</h1>
                <p className="text-sm text-neutral-500 mt-1 mb-6">Sign in to the platform admin panel.</p>

                {error && <div className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

                <label className="block text-xs text-neutral-500 mb-1">Email</label>
                <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full mb-4 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />

                <label className="block text-xs text-neutral-500 mb-1">Password</label>
                <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full mb-6 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />

                <button
                    type="submit" disabled={loading}
                    className="w-full rounded-md bg-neutral-900 text-white text-sm py-2 hover:bg-neutral-800 disabled:opacity-60"
                >
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}
