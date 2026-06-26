"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { useAdminStore } from "@/store/useAdminStore";
import { useAdminData, PageHeader, Card, Table, StateBlock } from "@/components/admin/ui";

interface AuditRow {
    id: string; actor_user_id: string; action: string;
    target_type: string; target_id: string | null; created_at: string | null;
}
interface InviteRow {
    id: string; email: string; tier: string; status: string;
    created_at: string | null; expires_at: string | null;
}

export default function AdminAdminsPage() {
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const audit = useAdminData<AuditRow[]>("/audit-log?limit=100");
    const invites = useAdminData<InviteRow[]>("/invites?limit=100");

    const [grantId, setGrantId] = useState("");
    const [grantFlag, setGrantFlag] = useState("is_platform_admin");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteTier, setInviteTier] = useState("is_platform_admin");
    const [busy, setBusy] = useState(false);

    const run = async (fn: () => Promise<unknown>, ok: string, reloadFn?: () => void) => {
        setBusy(true);
        try { await fn(); toast.success(ok); reloadFn?.(); }
        catch (e: unknown) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
        finally { setBusy(false); }
    };

    return (
        <div>
            <PageHeader title="Admins" subtitle="Grant access, invite admins, and review the audit log" />

            {isSuperuser && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card title="Grant / revoke (existing user)">
                        <input value={grantId} onChange={(e) => setGrantId(e.target.value)} placeholder="User ID"
                            className="w-full mb-2 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                        <select value={grantFlag} onChange={(e) => setGrantFlag(e.target.value)}
                            className="w-full mb-3 rounded-md border border-neutral-300 px-3 py-2 text-sm">
                            <option value="is_platform_admin">Platform admin (view-only)</option>
                            <option value="is_superuser">Superuser (full)</option>
                        </select>
                        <div className="flex gap-2">
                            <button disabled={busy} onClick={() => run(() => adminApi.post("/grant", { user_id: grantId, flag: grantFlag }), "Granted")}
                                className="rounded-md bg-neutral-900 text-white text-sm px-3 py-1.5">Grant</button>
                            <button disabled={busy} onClick={() => run(() => adminApi.post("/revoke", { user_id: grantId, flag: grantFlag }), "Revoked")}
                                className="rounded-md border border-red-300 text-red-600 text-sm px-3 py-1.5">Revoke</button>
                        </div>
                    </Card>

                    <Card title="Invite a new admin (by email)">
                        <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com"
                            className="w-full mb-2 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                        <select value={inviteTier} onChange={(e) => setInviteTier(e.target.value)}
                            className="w-full mb-3 rounded-md border border-neutral-300 px-3 py-2 text-sm">
                            <option value="is_platform_admin">Platform admin (view-only)</option>
                            <option value="is_superuser">Superuser (full)</option>
                        </select>
                        <button disabled={busy} onClick={() => run(
                            () => adminApi.post("/invites", { email: inviteEmail, tier: inviteTier }),
                            "Invite sent", () => { invites.reload(); setInviteEmail(""); }
                        )} className="rounded-md bg-neutral-900 text-white text-sm px-3 py-1.5">Send invite</button>
                    </Card>
                </div>
            )}

            <Card title="Pending & past invites">
                <StateBlock loading={invites.loading} error={invites.error} />
                {invites.data && (
                    <Table
                        columns={["Email", "Tier", "Status", "Expires", ""]}
                        rows={invites.data.map((i) => [
                            i.email, i.tier, i.status,
                            i.expires_at ? new Date(i.expires_at).toLocaleDateString() : "—",
                            isSuperuser && i.status === "pending"
                                ? <button key="r" onClick={() => run(() => adminApi.post(`/invites/${i.id}/revoke`), "Revoked", invites.reload)} className="text-red-600 text-xs hover:underline">Revoke</button>
                                : "",
                        ])}
                    />
                )}
            </Card>

            <div className="mt-8">
                <div className="text-sm font-medium text-neutral-700 mb-3">Audit log</div>
                <StateBlock loading={audit.loading} error={audit.error} />
                {audit.data && (
                    <Table
                        columns={["When", "Actor", "Action", "Target"]}
                        rows={audit.data.map((a) => [
                            a.created_at ? new Date(a.created_at).toLocaleString() : "—",
                            a.actor_user_id,
                            a.action,
                            a.target_id ? `${a.target_type}:${a.target_id}` : a.target_type,
                        ])}
                    />
                )}
            </div>
        </div>
    );
}
