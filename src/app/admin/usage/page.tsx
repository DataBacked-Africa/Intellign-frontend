"use client";

import Link from "next/link";
import { adminPath } from "@/lib/adminPath";
import { useAdminData, PageHeader, StatTile, Table, StateBlock } from "@/components/admin/ui";

interface Usage {
    total_tokens: number;
    by_model: { model: string | null; total_tokens: number; avg_latency_s: number | null }[];
    by_org: { org_id: string; org_name: string; total_tokens: number }[];
}

export default function AdminUsagePage() {
    const { data, loading, error } = useAdminData<Usage>("/usage");
    return (
        <div>
            <PageHeader title="LLM Usage" subtitle="Token consumption by model and organization" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <StatTile label="Total tokens" value={(data.total_tokens ?? 0).toLocaleString()} />
                        <StatTile label="Models" value={data.by_model.length} />
                        <StatTile label="Orgs with usage" value={data.by_org.length} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <div className="text-sm font-medium text-neutral-700 mb-3">By model</div>
                            <Table
                                columns={["Model", "Total tokens", "Avg latency (s)"]}
                                rows={data.by_model.map((r) => [r.model || "—", r.total_tokens.toLocaleString(), r.avg_latency_s ?? "—"])}
                            />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-neutral-700 mb-3">By organization</div>
                            <Table
                                columns={["Organization", "Total tokens"]}
                                rows={data.by_org.map((r) => [
                                    <Link key={r.org_id} href={adminPath(`/orgs/${r.org_id}`)} className="text-blue-600 hover:underline">{r.org_name}</Link>,
                                    r.total_tokens.toLocaleString(),
                                ])}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
