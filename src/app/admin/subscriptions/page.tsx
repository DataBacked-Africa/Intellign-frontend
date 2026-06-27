"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { adminPath } from "@/lib/adminPath";
import { useAdminStore } from "@/store/useAdminStore";
import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface CapEntry { used: number; cap: number | null; exceeded: boolean; }
interface SubRow {
    org_id: string; name: string; plan: string; plan_status: string;
    usage: Record<string, CapEntry>; near_limit: boolean;
}

const PLANS = ["free", "pro", "enterprise"];

const cell = (e?: CapEntry) => {
    if (!e) return "—";
    const cap = e.cap === null ? "∞" : e.cap;
    const cls = e.exceeded ? "text-red-600 font-medium" : "text-neutral-700";
    return <span className={cls}>{e.used}/{cap}</span>;
};

export default function AdminSubscriptionsPage() {
    const { data, loading, error, reload } = useAdminData<SubRow[]>("/subscriptions?limit=100");
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const [busyId, setBusyId] = useState<string | null>(null);

    const setPlan = async (orgId: string, plan: string) => {
        setBusyId(orgId);
        try { await adminApi.post(`/orgs/${orgId}/plan`, { plan }); toast.success(`Plan set to ${plan.toUpperCase()}`); reload(); }
        catch (e: unknown) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
        finally { setBusyId(null); }
    };

    const planControl = (s: SubRow) => {
        if (!isSuperuser) return <span className="uppercase text-xs px-2 py-0.5 rounded bg-neutral-200">{s.plan}</span>;
        return (
            <select
                value={s.plan}
                disabled={busyId === s.org_id}
                onChange={(e) => setPlan(s.org_id, e.target.value)}
                className="text-xs rounded border border-neutral-300 px-1.5 py-1 capitalize bg-white"
            >
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
        );
    };

    return (
        <div>
            <PageHeader title="Subscriptions" subtitle="Plan usage vs. caps per organization" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Org", "Plan", "Status", "Runs", "Seats", "Tokens", "Datasets", ""]}
                    rows={data.map((s) => [
                        <Link key="o" href={adminPath(`/orgs/${s.org_id}`)} className="text-blue-600 hover:underline">{s.name}</Link>,
                        planControl(s),
                        s.plan_status,
                        cell(s.usage.runs_per_month),
                        cell(s.usage.seats),
                        cell(s.usage.tokens_per_month),
                        cell(s.usage.datasets),
                        s.near_limit ? <span key="n" className="text-amber-600 text-xs">Near limit</span> : "",
                    ])}
                />
            )}
        </div>
    );
}
