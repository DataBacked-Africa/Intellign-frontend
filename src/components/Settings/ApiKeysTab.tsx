"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AuthInput } from "@/components/AuthComponents/AuthInput";
import { Card, SaveButton } from "./ui";
import { Loader2, Trash2, Copy, Check, KeyRound } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";

interface ApiKey { id: string; name: string; key_prefix: string; is_active: boolean; created_at: string; last_used_at: string | null }

const ApiKeysTab: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get("/api/v1/me/api-keys");
      setKeys(r.data ?? []);
    } catch {
      // ignore — empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await axiosInstance.post("/api/v1/me/api-keys", { name: name.trim(), scopes: [] });
      setRawKey(r.data.raw_key); // shown once
      setName("");
      await load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast.error("Failed", err.response?.data?.detail ?? "Could not create key.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/v1/me/api-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      showToast.error("Failed", "Could not revoke key.");
    }
  };

  const copyRaw = () => {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Card title="API keys" description="Programmatic access to the Intellign API. Keys are shown once at creation — store them securely.">
      {/* One-time reveal banner */}
      {rawKey && (
        <div style={{ background: "var(--brand-maroon-50)", border: "1px solid var(--brand-maroon-100)", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-maroon-deep)", marginBottom: 8 }}>
            Copy your key now — you won&apos;t see it again.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, fontSize: 13, fontFamily: "var(--font-mono, monospace)", background: "#fff", border: "1px solid var(--brand-bone-deep)", borderRadius: 7, padding: "9px 11px", wordBreak: "break-all", color: "var(--fg-primary)" }}>{rawKey}</code>
            <button onClick={copyRaw} className="btn btn-primary" style={{ height: 38, padding: "0 14px", borderRadius: 7, justifyContent: "center" }}>
              {copied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          <button onClick={() => setRawKey(null)} style={{ marginTop: 10, background: "none", border: "none", color: "var(--fg-secondary)", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>Done</button>
        </div>
      )}

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px" }}>
          <AuthInput label="Key name" type="text" placeholder="e.g. Production server" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <SaveButton loading={creating} disabled={!name.trim()}>Create key</SaveButton>
      </form>

      {loading ? (
        <div style={{ padding: 8 }}><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} /></div>
      ) : keys.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--fg-secondary)", margin: 0 }}>No API keys yet.</p>
      ) : (
        keys.map((k) => (
          <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--brand-bone)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <KeyRound style={{ width: 16, height: 16, color: "var(--fg-tertiary)" }} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-primary)" }}>{k.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--fg-secondary)", fontFamily: "var(--font-mono, monospace)" }}>{k.key_prefix}…{k.last_used_at ? " · used" : " · never used"}</div>
              </div>
            </div>
            <button onClick={() => handleDelete(k.id)} title="Revoke key"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4 }}>
              <Trash2 style={{ width: 15, height: 15 }} />
            </button>
          </div>
        ))
      )}
    </Card>
  );
};

export default ApiKeysTab;
