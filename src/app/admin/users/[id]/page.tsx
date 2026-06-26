"use client";

import { use, useState } from "react";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { useAdminStore } from "@/store/useAdminStore";
import { useAdminData, PageHeader, Card, StatTile, StateBlock } from "@/components/admin/ui";

interface UserDetail {
    id: string; name: string; email: string; role: string;
    organization_id: string | null; is_active: boolean; email_verified: boolean;
    is_superuser: boolean; is_platform_admin: boolean;
    created_at: string | null; last_login_at: string | null;
    session_count?: number; total_tokens?: number;
}

export default function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data, loading, error, reload } = useAdminData<UserDetail>(`/users/${id}`);
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const [busy, setBusy] = useState(false);

    const act = async (fn: () => Promise<unknown>, ok: string) => {
        setBusy(true);
        try { await fn(); toast.success(ok); reload(); }
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
                            <dt className="text-neutral-500">Email verified</dt><dd>{data.email_verified ? "Yes" : "No"}</dd>
                            <dt className="text-neutral-500">Admin tier</dt><dd>{data.is_superuser ? "Superuser" : data.is_platform_admin ? "Platform admin" : "—"}</dd>
                            <dt className="text-neutral-500">Created</dt><dd>{data.created_at ? new Date(data.created_at).toLocaleString() : "—"}</dd>
                            <dt className="text-neutral-500">Last login</dt><dd>{data.last_login_at ? new Date(data.last_login_at).toLocaleString() : "—"}</dd>
                        </dl>
                    </Card>

                    {isSuperuser ? (
                        <div className="mt-6">
                            <div className="text-sm font-medium text-neutral-700 mb-3">Actions</div>
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
                                    className="rounded-md border border-red-300 text-red-600 text-sm px-3 py-1.5 hover:bg-red-50">Revoke tokens</button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-6 text-xs text-neutral-400">Mutating actions require superuser access.</p>
                    )}
                </>
            )}
        </div>
    );
}
