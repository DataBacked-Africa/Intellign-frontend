"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { ADMIN_BASE } from "@/lib/adminApi";
import { adminPath } from "@/lib/adminPath";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://intellign.up.railway.app").replace(/\/$/, "");

type Phase = "checking" | "need_login" | "accepting" | "done" | "error";

function AcceptInner() {
    const params = useSearchParams();
    const token = params.get("token") || "";

    const [phase, setPhase] = useState<Phase>("checking");
    const [error, setError] = useState<string | null>(null);
    const [grantedTier, setGrantedTier] = useState<string | null>(null);
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [name, setName] = useState("");
    const [orgName, setOrgName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const accept = async () => {
        setBusy(true);
        setError(null);
        try {
            const r = await axios.post(
                `${ADMIN_BASE}/invites/accept`,
                { token },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setGrantedTier(r.data?.granted ?? null);
            setPhase("done");
        } catch (e: unknown) {
            const detail = (e as { response?: { data?: { detail?: string }; status?: number } })?.response;
            if (detail?.status === 401) { setPhase("need_login"); return; }
            setError(detail?.data?.detail || "Could not accept the invite.");
            setPhase("error");
        } finally {
            setBusy(false);
        }
    };

    // On mount: if there's no token → error; if already signed in → accept directly.
    useEffect(() => {
        if (!token) { setError("This invite link is missing its token."); setPhase("error"); return; }
        if (typeof window !== "undefined" && localStorage.getItem("token")) {
            setPhase("accepting");
            accept();
        } else {
            setPhase("need_login");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const authThenAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            // The invitee isn't an admin yet, so /admin/login would 403. They either
            // sign in to an existing Intellign account or register a new one, then accept.
            let tokens;
            if (mode === "signup") {
                const r = await axios.post(`${API_URL}/api/v1/auth/register`, {
                    name, email, password, organization_name: orgName || `${name}'s org`,
                });
                tokens = r.data?.tokens;
            } else {
                const r = await axios.post(`${API_URL}/api/v1/auth/login`, { email, password });
                tokens = r.data?.tokens;
            }
            localStorage.setItem("token", tokens.access_token);
            if (tokens.refresh_token) localStorage.setItem("refreshToken", tokens.refresh_token);
            setPhase("accepting");
            await accept();
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (mode === "signup" && status === 409) setError("An account with that email already exists — sign in instead.");
            else if (status === 401) setError("Invalid email or password.");
            else setError(mode === "signup" ? "Sign-up failed. Try again." : "Sign-in failed. Try again.");
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-bone)] p-6">
            <div className="w-full max-w-sm rounded-xl border border-[var(--brand-maroon)]/12 bg-white p-8 shadow-sm">
                <div className="text-xs tracking-[0.2em] uppercase text-[var(--brand-maroon)] mb-1">Intellign</div>
                <h1 className="text-2xl text-neutral-900" style={{ fontFamily: "var(--font-display)" }}>
                    Admin invitation
                </h1>

                {(phase === "checking" || phase === "accepting") && (
                    <p className="mt-4 text-sm text-neutral-500">Processing your invite…</p>
                )}

                {phase === "need_login" && (
                    <>
                        <p className="mt-2 mb-4 text-sm text-neutral-500">
                            {mode === "signin"
                                ? "Sign in with your Intellign account to accept this invitation."
                                : "Create your Intellign account to accept this invitation."}
                        </p>

                        <div className="mb-5 inline-flex rounded-lg border border-neutral-200 p-0.5 text-sm">
                            <button type="button" onClick={() => { setMode("signin"); setError(null); }}
                                className={`px-3 py-1 rounded-md ${mode === "signin" ? "bg-[var(--brand-maroon)] text-[var(--brand-bone)]" : "text-neutral-600"}`}>Sign in</button>
                            <button type="button" onClick={() => { setMode("signup"); setError(null); }}
                                className={`px-3 py-1 rounded-md ${mode === "signup" ? "bg-[var(--brand-maroon)] text-[var(--brand-bone)]" : "text-neutral-600"}`}>Sign up</button>
                        </div>

                        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5">{error}</div>}
                        <form onSubmit={authThenAccept} className="space-y-4">
                            {mode === "signup" && (
                                <>
                                    <input type="text" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-2 focus:ring-[var(--brand-maroon)]/15" />
                                    <input type="text" placeholder="Organization name (optional)" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-2 focus:ring-[var(--brand-maroon)]/15" />
                                </>
                            )}
                            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-2 focus:ring-[var(--brand-maroon)]/15" />
                            <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-2 focus:ring-[var(--brand-maroon)]/15" />
                            <button type="submit" disabled={busy}
                                className="w-full rounded-lg bg-[var(--brand-maroon)] text-[var(--brand-bone)] text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-60">
                                {busy ? "Accepting…" : mode === "signup" ? "Create account & accept" : "Sign in & accept"}
                            </button>
                        </form>
                    </>
                )}

                {phase === "done" && (
                    <>
                        <p className="mt-4 text-sm text-neutral-600">
                            You now have <strong>{grantedTier === "is_superuser" ? "superuser" : "platform admin"}</strong> access.
                        </p>
                        <a href={adminPath("/login")}
                            className="mt-6 inline-block rounded-lg bg-[var(--brand-maroon)] text-[var(--brand-bone)] text-sm font-medium px-4 py-2.5 hover:opacity-90">
                            Go to the admin panel
                        </a>
                    </>
                )}

                {phase === "error" && (
                    <div className="mt-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--brand-bone)] text-neutral-400 text-sm">Loading…</div>}>
            <AcceptInner />
        </Suspense>
    );
}
