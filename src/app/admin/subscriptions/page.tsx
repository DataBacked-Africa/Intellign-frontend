"use client";

import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface CapEntry { used: number; cap: number | null; exceeded: boolean; }
interface SubRow {
    org_id: string; name: string; plan: string; plan_status: string;
    usage: Record<string, CapEntry>; near_limit: boolean;
}

const cell = (e?: CapEntry) => {
    if (!e) return "—";
    const cap = e.cap === null ? "∞" : e.cap;
    const cls = e.exceeded ? "text-red-600 font-medium" : "text-neutral-700";
    return <span className={cls}>{e.used}/{cap}</span>;
};

export default function AdminSubscriptionsPage() {
    const { data, loading, error } = useAdminData<SubRow[]>("/subscriptions?limit=100");
    return (
        <div>
            <PageHeader title="Subscriptions" subtitle="Plan usage vs. caps per organization" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Org", "Plan", "Status", "Runs", "Seats", "Tokens", "Datasets", ""]}
                    rows={data.map((s) => [
                        s.name,
                        <span key="p" className="uppercase text-xs px-2 py-0.5 rounded bg-neutral-200">{s.plan}</span>,
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
