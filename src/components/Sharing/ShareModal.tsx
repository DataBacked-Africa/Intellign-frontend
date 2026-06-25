"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, Copy, Check, Trash2, Globe, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";

type Role = "viewer" | "editor";
interface Collaborator { id: string; email: string; role: Role; status: string }
interface ShareLink { share_token: string | null; url: string | null; public_role: Role | null }

const roleSelectCls =
  "h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c1427]/10 focus:border-[#5c1427]";

const ShareModal: React.FC<{ sessionId: string; onClose: () => void }> = ({ sessionId, onClose }) => {
  const [link, setLink] = useState<ShareLink>({ share_token: null, url: null, public_role: null });
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviting, setInviting] = useState(false);

  const base = `/api/v1/me/sessions/${sessionId}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, c] = await Promise.all([
        axiosInstance.get(`${base}/share`),
        axiosInstance.get(`${base}/collaborators`),
      ]);
      setLink(l.data);
      setCollaborators(c.data ?? []);
    } catch {
      showToast.error("Error", "Could not load share settings.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const enableLink = async (role: Role) => {
    try {
      const r = await axiosInstance.put(`${base}/share`, { public_role: role });
      setLink(r.data);
    } catch {
      showToast.error("Error", "Could not update public link.");
    }
  };

  const disableLink = async () => {
    try {
      await axiosInstance.delete(`${base}/share`);
      setLink({ share_token: null, url: null, public_role: null });
    } catch {
      showToast.error("Error", "Could not disable link.");
    }
  };

  const fullUrl = link.url ? `${window.location.origin}${new URL(link.url, window.location.origin).pathname}` : "";
  const copyLink = () => {
    if (!link.url) return;
    navigator.clipboard.writeText(link.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await axiosInstance.post(`${base}/collaborators`, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      showToast.success("Invited", `${inviteEmail.trim()} can now access this session.`);
      await load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast.error("Invite failed", err.response?.data?.detail ?? "Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (cid: string, role: Role) => {
    setCollaborators((prev) => prev.map((c) => (c.id === cid ? { ...c, role } : c)));
    try {
      await axiosInstance.patch(`${base}/collaborators/${cid}`, { role });
    } catch {
      showToast.error("Error", "Could not change role.");
      load();
    }
  };

  const removeCollab = async (cid: string) => {
    try {
      await axiosInstance.delete(`${base}/collaborators/${cid}`);
      setCollaborators((prev) => prev.filter((c) => c.id !== cid));
    } catch {
      showToast.error("Error", "Could not remove.");
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "var(--neutral-0,#fff)", borderRadius: 16, border: "1px solid var(--brand-bone-deep)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--brand-bone)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 20, color: "var(--brand-maroon-deep)", margin: 0 }}>Share session</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-secondary)" }}><X style={{ width: 20, height: 20 }} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} /></div>
        ) : (
          <div style={{ padding: 22 }}>
            {/* Public link */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Globe style={{ width: 16, height: 16, color: "var(--brand-maroon)" }} />
                <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-primary)" }}>Public link</span>
              </div>
              {link.share_token ? (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <code style={{ flex: 1, fontSize: 12.5, background: "var(--brand-bone)", border: "1px solid var(--brand-bone-deep)", borderRadius: 8, padding: "9px 11px", wordBreak: "break-all", color: "var(--fg-primary)" }}>{fullUrl}</code>
                    <button onClick={copyLink} className="btn btn-primary" style={{ height: 38, padding: "0 13px", borderRadius: 8, justifyContent: "center" }}>
                      {copied ? <Check style={{ width: 15, height: 15 }} /> : <Copy style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "var(--fg-secondary)" }}>Anyone with the link can</span>
                    <select value={link.public_role ?? "viewer"} onChange={(e) => enableLink(e.target.value as Role)} className={roleSelectCls}>
                      <option value="viewer">view</option>
                      <option value="editor">edit</option>
                    </select>
                    <button onClick={disableLink} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--brand-maroon)", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Disable</button>
                  </div>
                </>
              ) : (
                <button onClick={() => enableLink("viewer")} className="btn btn-secondary" style={{ height: 40, padding: "0 16px", borderRadius: 8, fontSize: 14 }}>
                  Create public link
                </button>
              )}
            </div>

            {/* Invite by email */}
            <div style={{ borderTop: "1px solid var(--brand-bone)", paddingTop: 18 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-primary)", marginBottom: 10 }}>Invite people</div>
              <form onSubmit={invite} style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <input type="email" required placeholder="email@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ flex: "1 1 180px", minWidth: 0 }}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c1427]/10 focus:border-[#5c1427]" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} className={roleSelectCls}>
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                </select>
                <button type="submit" disabled={inviting} className="btn btn-primary" style={{ height: 36, padding: "0 14px", borderRadius: 8, justifyContent: "center" }}>
                  {inviting ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : "Invite"}
                </button>
              </form>

              {collaborators.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--brand-bone)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: "var(--fg-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</div>
                    {c.status === "pending" && <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>pending</div>}
                  </div>
                  <select value={c.role} onChange={(e) => changeRole(c.id, e.target.value as Role)} className={roleSelectCls} style={{ height: 32 }}>
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                  </select>
                  <button onClick={() => removeCollab(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4 }}><Trash2 style={{ width: 15, height: 15 }} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
