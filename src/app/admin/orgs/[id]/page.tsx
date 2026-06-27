"use client";

import { use, useState } from "react";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { useAdminStore } from "@/store/useAdminStore";
import { useAdminData, PageHeader, Card, StatTile, Table, StateBlock } from "@/components/admin/ui";

interface Member {
    id: string; email: string; name: string; role: string; is_active: boolean;
}
interface OrgDetail { id: string; name: string; plan?: string; plan_status?: string; total_tokens?: number; members: Member[]; }

const PLANS = ["free", "pro", "enterprise"];

export default function AdminOrgDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data, loading, error, reload } = useAdminData<OrgDetail>(`/orgs/${id}`);
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const [busy, setBusy] = useState(false);

    const act = async (fn: () => Promise<unknown>, ok: string) => {
        setBusy(true);
        try { await fn(); toast.success(ok); reload(); }
        catch (e: unknown) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
        finally { setBusy(false); }
    };

    return (
        <div>
            <PageHeader
                title={data?.name || "Organization"}
                subtitle={data?.plan ? `Plan: ${data.plan.toUpperCase()} · ${data.plan_status ?? "active"}` : undefined}
                right={isSuperuser && (
                    <button disabled={busy} onClick={() => act(() => adminApi.post(`/orgs/${id}/deactivate`), "Organization deactivated")}
                        className="rounded-md border border-red-300 text-red-600 text-sm px-3 py-1.5 hover:bg-red-50">
                        Deactivate org
                    </button>
                )}
            />
            <StateBlock loading={loading} error={error} />
            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <StatTile label="Members" value={data.members.length} />
                        <StatTile label="Plan" value={(data.plan || "free").toUpperCase()} />
                        <StatTile label="Tokens used" value={(data.total_tokens ?? 0).toLocaleString()} />
                    </div>

                    {isSuperuser && (
                        <Card title="Subscription plan">
                            <div className="flex flex-wrap items-center gap-2">
                                {PLANS.map((p) => (
                                    <button key={p} disabled={busy || data.plan === p}
                                        onClick={() => act(() => adminApi.post(`/orgs/${id}/plan`, { plan: p }), `Plan set to ${p.toUpperCase()}`)}
                                        className={`rounded-md text-sm px-3 py-1.5 border capitalize ${data.plan === p ? "bg-[var(--brand-maroon)] text-[var(--brand-bone)] border-transparent" : "border-neutral-300 hover:bg-neutral-50"}`}>
                                        {p}
                                    </button>
                                ))}
                                <span className="text-xs text-neutral-400 ml-2">Changing the plan resets the billing period and recomputes caps.</span>
                            </div>
                        </Card>
                    )}

                    <div className="mt-6">
                        <div className="text-sm font-medium text-neutral-700 mb-3">Members</div>
                        <Table
                            columns={["Email", "Name", "Role", "Status"]}
                            rows={data.members.map((m) => [m.email, m.name, m.role, m.is_active ? "Active" : "Disabled"])}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
