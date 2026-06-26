"use client";

import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface Usage { by_model: { model: string | null; total_tokens: number; avg_latency_s: number | null }[]; }

export default function AdminUsagePage() {
    const { data, loading, error } = useAdminData<Usage>("/usage");
    return (
        <div>
            <PageHeader title="LLM Usage" subtitle="Tokens and latency by model" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Model", "Total tokens", "Avg latency (s)"]}
                    rows={data.by_model.map((r) => [r.model || "—", r.total_tokens.toLocaleString(), r.avg_latency_s ?? "—"])}
                />
            )}
        </div>
    );
}
