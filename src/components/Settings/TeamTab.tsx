"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AuthInput } from "@/components/AuthComponents/AuthInput";
import { Card, SaveButton } from "./ui";
import { Loader2, Trash2, Clock } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import type { Me } from "./SettingsView";

interface Member { id: string; name: string; email: string; role: string }
interface Invite { id: string; email: string; role: string; status: string; created_at: string }

const ROLES = ["RESEARCHER", "ADMIN", "CLIENT"];

const TeamTab: React.FC<{ me: Me }> = ({ me }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("RESEARCHER");
  const [inviting, setInviting] = useState(false);

  const canInvite = me.role === "ADMIN" || me.role === "RESEARCHER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        axiosInstance.get("/api/v1/orgs/me/members"),
        axiosInstance.get("/api/v1/orgs/me/invites"),
      ]);
      setMembers(m.data ?? []);
      setInvites((i.data ?? []).filter((x: Invite) => x.status === "pending"));
    } catch {
      // org endpoints may 403 for some roles — fail quietly to an empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await axiosInstance.post("/api/v1/orgs/invites", { email: email.trim(), role });
      showToast.success("Invite sent", `${email.trim()} has been invited.`);
      setEmail("");
      await load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast.error("Invite failed", err.response?.data?.detail ?? "Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/v1/orgs/invites/${id}`);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch {
      showToast.error("Failed", "Could not revoke invite.");
    }
  };

  return (
    <>
      <Card title="Members" description="People in your organization.">
        {loading ? (
          <div style={{ padding: 16 }}><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} /></div>
        ) : members.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--fg-secondary)", margin: 0 }}>No members to show.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--brand-bone)" }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-primary)" }}>{m.name} {m.id === me.id && <span style={{ color: "var(--fg-tertiary)", fontWeight: 400 }}>(you)</span>}</div>
                <div style={{ fontSize: 13, color: "var(--fg-secondary)" }}>{m.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--brand-maroon)", background: "var(--brand-maroon-50)", padding: "4px 9px", borderRadius: 6 }}>{m.role}</span>
            </div>
          ))
        )}
      </Card>

      {canInvite && (
        <Card title="Invite a teammate" description="They'll receive an email invitation to join your organization.">
          <form onSubmit={handleInvite} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <AuthInput label="Email" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ width: 150 }}>
              <label className="text-sm font-medium text-gray-700" style={{ display: "block", marginBottom: 8 }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c1427]/10 focus:border-[#5c1427]">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <SaveButton loading={inviting} disabled={!email.trim()}>Send invite</SaveButton>
          </form>

          {invites.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-tertiary)", marginBottom: 8 }}>Pending invites</div>
              {invites.map((inv) => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--brand-bone)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Clock style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />
                    <span style={{ fontSize: 14, color: "var(--fg-primary)" }}>{inv.email}</span>
                    <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>· {inv.role}</span>
                  </div>
                  <button onClick={() => handleRevoke(inv.id)} title="Revoke invite"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4 }}>
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default TeamTab;
