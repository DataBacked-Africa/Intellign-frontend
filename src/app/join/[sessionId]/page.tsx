"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { useUserStore } from "@/store/useUserStore";

/**
 * Invite-accept entry point (the link in session-shared emails).
 * - Not signed in → bounce to signup, returning here afterwards.
 * - Signed in → claim the collaborator invite for this account, then open the session.
 */
export default function JoinPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const ran = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    params.then((p) => { sessionIdRef.current = p.sessionId; });
    const t = setTimeout(() => setHydrated(true), 60); // let zustand persist rehydrate
    return () => clearTimeout(t);
  }, [params]);

  useEffect(() => {
    if (!hydrated || ran.current) return;
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    ran.current = true;

    if (!isAuthenticated) {
      router.push(`/auth/signup?redirect=${encodeURIComponent(`/join/${sessionId}`)}`);
      return;
    }
    (async () => {
      try {
        await axiosInstance.post(`/api/v1/me/sessions/${sessionId}/claim`);
        router.push(`/sessions/${sessionId}`);
      } catch (e: unknown) {
        const err = e as { response?: { status?: number } };
        setError(
          err.response?.status === 404
            ? "This invite isn't for the account you're signed in as. Sign in with the invited email and try again."
            : "We couldn't open this shared session. The invite may have been revoked."
        );
      }
    })();
  }, [hydrated, isAuthenticated, router]);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--brand-bone)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {error ? (
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <XCircle style={{ width: 28, height: 28, color: "#B91C1C", margin: "0 auto 12px" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--brand-maroon-deep)", margin: "0 0 8px" }}>Can&apos;t open this session</h1>
          <p style={{ fontSize: 14.5, color: "var(--fg-secondary)", margin: "0 0 18px", lineHeight: 1.5 }}>{error}</p>
          <button onClick={() => router.push("/auth/login")} className="btn btn-primary" style={{ height: 44, padding: "0 22px", borderRadius: 8 }}>
            Switch account
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <Loader2 style={{ width: 26, height: 26, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} />
          <p style={{ marginTop: 14, fontSize: 15, color: "var(--fg-secondary)" }}>Opening the shared session…</p>
        </div>
      )}
    </main>
  );
}
