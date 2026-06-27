"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { adminPath } from "@/lib/adminPath";
import { useAdminStore } from "@/store/useAdminStore";
import { useAdminData, PageHeader, Card, StatTile, StateBlock } from "@/components/admin/ui";

interface UserDetail {
    id: string; name: string; email: string; role: string;
    organization_id: string | null; organization_name?: string | null;
    is_active: boolean; email_verified: boolean;
    is_superuser: boolean; is_platform_admin: boolean;
    created_at: string | null; last_login_at: string | null;
    session_count?: number; total_tokens?: number;
}

const ROLES = ["CLIENT", "RESEARCHER", "ADMIN"];

export default function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data, loading, error, reload } = useAdminData<UserDetail>(`/users/${id}`);
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const [busy, setBusy] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [showDelete, setShowDelete] = useState(false);

    const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
        setBusy(true);
        try { await fn(); toast.success(ok); if (after) after(); else reload(); }
        catch (e: unknown) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Action failed");
        } finally { setBusy(false); }
    };

    return (
        <div>
            <PageHeader title={data?.email || "User"} subtitle={data?.name} />
            <StateBlock loading={loading} error={error} />
            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatTile label="Role" value={data.role} />
                        <StatTile label="Status" value={data.is_active ? "Active" : "Disabled"} />
                        <StatTile label="Sessions" value={data.session_count ?? 0} />
                        <StatTile label="Tokens used" value={(data.total_tokens ?? 0).toLocaleString()} />
                    </div>

                    <Card title="Details">
                        <dl className="grid grid-cols-2 gap-y-2 text-sm">
                            <dt className="text-neutral-500">Organization</dt>
                            <dd>{data.organization_name || (data.organization_id ? data.organization_id : "—")}</dd>
                            <dt className="text-neutral-500">Email verified</dt><dd>{data.email_verified ? "Yes" : "No"}</dd>
                            <dt className="text-neutral-500">Admin tier</dt><dd>{data.is_superuser ? "Superuser" : data.is_platform_admin ? "Platform admin" : "—"}</dd>
                            <dt className="text-neutral-500">Created</dt><dd>{data.created_at ? new Date(data.created_at).toLocaleString() : "—"}</dd>
                            <dt className="text-neutral-500">Last login</dt><dd>{data.last_login_at ? new Date(data.last_login_at).toLocaleString() : "—"}</dd>
                        </dl>
                    </Card>

                    {isSuperuser ? (
                        <>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card title="Role">
                                    <div className="flex flex-wrap gap-2">
                                        {ROLES.map((r) => (
                                            <button key={r} disabled={busy || r === data.role}
                                                onClick={() => act(() => adminApi.post(`/users/${id}/role`, { role: r }), `Role set to ${r}`)}
                                                className={`rounded-md text-sm px-3 py-1.5 border ${r === data.role ? "bg-[var(--brand-maroon)] text-[var(--brand-bone)] border-transparent" : "border-neutral-300 hover:bg-neutral-50"}`}>
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                                <Card title="Admin tier">
                                    <div className="flex flex-wrap gap-2">
                                        <button disabled={busy} onClick={() => act(() => adminApi.post(`/grant`, { user_id: id, flag: "is_platform_admin" }), "Granted platform admin")}
                                            className="rounded-md border border-neutral-300 text-sm px-3 py-1.5 hover:bg-neutral-50">Make platform admin</button>
                                        <button disabled={busy} onClick={() => act(() => adminApi.post(`/grant`, { user_id: id, flag: "is_superuser" }), "Granted superuser")}
                                            className="rounded-md border border-neutral-300 text-sm px-3 py-1.5 hover:bg-neutral-50">Make superuser</button>
                                        <button disabled={busy} onClick={() => act(() => adminApi.post(`/revoke`, { user_id: id, flag: "is_platform_admin" }), "Revoked platform admin")}
                                            className="rounded-md border border-neutral-300 text-sm px-3 py-1.5 hover:bg-neutral-50">Revoke admin</button>
                                    </div>
                                </Card>
                            </div>

                            <div className="mt-6">
                                <div className="text-sm font-medium text-neutral-700 mb-3">Account actions</div>
                                <div className="flex flex-wrap gap-2">
                                    <button disabled={busy} onClick={() => act(() => adminApi.post(`/users/${id}/active`, { active: !data.is_active }), data.is_active ? "User disabled" : "User enabled")}
                                        className="rounded-md border border-neutral-300 text-sm px-3 py-1.5 hover:bg-neutral-50">
                                        {data.is_active ? "Disable user" : "Enable user"}
                                    </button>
                                    <button disabled={busy} onClick={() => act(() => adminApi.post(`/users/${id}/resend-verification`), "Verification sent")}
                                        className="rounded-md border border-neutral-300 text-sm px-3 py-1.5 hover:bg-neutral-50">Resend verification</button>
                                    <button disabled={busy} onClick={() => act(() => adminApi.post(`/users/${id}/reset-password`), "Reset email sent")}
                                        className="rounded-md border border-neutral-300 text-sm px-3 py-1.5 hover:bg-neutral-50">Trigger password reset</button>
                                    <button disabled={busy} onClick={() => act(() => adminApi.post(`/users/${id}/revoke-tokens`), "Tokens revoked")}
                                        className="rounded-md border border-amber-300 text-amber-700 text-sm px-3 py-1.5 hover:bg-amber-50">Revoke tokens</button>
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl border border-red-200 bg-red-50/40 p-4">
                                <div className="text-sm font-medium text-red-700 mb-1">Danger zone</div>
                                <p className="text-xs text-neutral-500 mb-3">
                                    Scheduling gives the user a 30-day grace window (with an export + cancel email).
                                    Deleting now is immediate and permanent.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button disabled={busy} onClick={() => act(() => adminApi.post(`/users/${id}/schedule-deletion`), "Scheduled for deletion (30 days)")}
                                        className="rounded-md border border-red-300 text-red-600 text-sm px-3 py-1.5 hover:bg-red-50">Schedule deletion (30d)</button>
                                    <button disabled={busy} onClick={() => setShowDelete((v) => !v)}
                                        className="rounded-md bg-red-600 text-white text-sm px-3 py-1.5 hover:bg-red-700">Delete now…</button>
                                </div>

                                {showDelete && (
                                    <div className="rounded-lg border border-red-300 bg-white p-3">
                                        <p className="text-sm text-neutral-700 mb-2">
                                            This permanently deletes <strong>{data.email}</strong>. Type <code className="font-mono">DELETE</code> to confirm.
                                        </p>
                                        <div className="flex gap-2">
                                            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
                                                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
                                            <button disabled={busy || confirmText !== "DELETE"}
                                                onClick={() => act(() => adminApi.delete(`/users/${id}`), "User deleted", () => router.replace(adminPath("/users")))}
                                                className="rounded-md bg-red-600 text-white text-sm px-3 py-1.5 disabled:opacity-50 hover:bg-red-700">
                                                Permanently delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="mt-6 text-xs text-neutral-400">Mutating actions require superuser access.</p>
                    )}
                </>
            )}
        </div>
    );
}
