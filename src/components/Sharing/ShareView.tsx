"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Eye, Pencil } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { useUserStore } from "@/store/useUserStore";
import { useSessionPresence } from "@/hooks/useSessionPresence";
import PresenceBar from "./PresenceBar";

interface SharedSession {
  session: {
    id: string;
    name: string | null;
    status: string;
    phase: string;
    problem_type: string | null;
    optimization_goals: { goals?: unknown[] } | null;
    result_data: Record<string, unknown> | null;
    version: number;
  };
  role: string;
  requires_signup_to_edit: boolean;
}

const ShareView: React.FC<{ token: string }> = ({ token }) => {
  const router = useRouter();
  const { isAuthenticated, token: authToken } = useUserStore();
  const [data, setData] = useState<SharedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get(`/api/v1/shared/${token}`);
      setData(r.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Realtime: presence + refetch on session_updated (anonymous uses the share token).
  const { participants } = useSessionPresence({
    sessionId: data?.session.id ?? null,
    authToken: isAuthenticated ? authToken : null,
    shareToken: token,
    onSessionUpdated: load,
  });

  const gateToSignup = () => router.push(`/auth/signup?redirect=${encodeURIComponent(`/share/${token}`)}`);

  const [opening, setOpening] = useState(false);
  const joinAndOpen = async () => {
    if (!data) return;
    setOpening(true);
    try {
      // Convert public-link access into a real collaborator row so /sessions/{id} resolves.
      await axiosInstance.post(`/api/v1/shared/${token}/join`);
    } catch {
      // owner or already a collaborator — proceed regardless
    } finally {
      router.push(`/sessions/${data.session.id}`);
    }
  };

  if (loading) {
    return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 style={{ width: 26, height: 26, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} /></div>;
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
        <Lock style={{ width: 28, height: 28, color: "var(--fg-tertiary)" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--brand-maroon-deep)", margin: 0 }}>Link unavailable</h1>
        <p style={{ color: "var(--fg-secondary)", margin: 0 }}>This share link is invalid or has been disabled.</p>
      </div>
    );
  }

  const s = data.session;
  const goalCount = s.optimization_goals?.goals?.length ?? 0;
  const canEdit = data.role === "editor" || data.role === "owner";

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 64px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand-maroon)", marginBottom: 6 }}>Shared session</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 30, letterSpacing: "-0.02em", color: "var(--brand-maroon-deep)", margin: 0 }}>{s.name ?? "Untitled session"}</h1>
        </div>
        <PresenceBar participants={participants} />
      </div>

      {/* Role badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-secondary)", background: "var(--brand-bone)", borderRadius: 999, padding: "5px 11px", marginBottom: 24 }}>
        {canEdit ? <Pencil style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
        {canEdit ? "You can edit" : "View only"}
      </div>

      {/* Read-only summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Status", value: s.status },
          { label: "Phase", value: s.phase },
          { label: "Problem", value: s.problem_type ?? "—" },
          { label: "Goals", value: String(goalCount) },
        ].map((c) => (
          <div key={c.label} style={{ background: "var(--neutral-0,#fff)", border: "1px solid var(--brand-bone-deep)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--fg-tertiary)", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-primary)" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {s.result_data ? (
        <div style={{ background: "var(--neutral-0,#fff)", border: "1px solid var(--brand-bone-deep)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-maroon-deep)", marginBottom: 10 }}>Results available</div>
          <p style={{ fontSize: 13.5, color: "var(--fg-secondary)", margin: 0 }}>This session has optimization results. {canEdit ? "Open it to explore in full." : "Sign up to open and interact with the full session."}</p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: "var(--fg-secondary)" }}>This session hasn&apos;t produced results yet.</p>
      )}

      {/* Signup / open gate */}
      <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--brand-bone-deep)" }}>
        {data.requires_signup_to_edit || (!isAuthenticated) ? (
          <>
            <p style={{ fontSize: 14.5, color: "var(--fg-primary)", margin: "0 0 12px" }}>
              {data.requires_signup_to_edit ? "This link lets you edit — sign up to start collaborating." : "Sign up to open and interact with this session."}
            </p>
            <button onClick={gateToSignup} className="btn btn-primary" style={{ height: 46, padding: "0 24px", borderRadius: 8, fontSize: 15 }}>
              Sign up to continue
            </button>
          </>
        ) : (
          <button onClick={joinAndOpen} disabled={opening} className="btn btn-primary" style={{ height: 46, padding: "0 24px", borderRadius: 8, fontSize: 15, justifyContent: "center" }}>
            {opening ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : "Open full session"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ShareView;
