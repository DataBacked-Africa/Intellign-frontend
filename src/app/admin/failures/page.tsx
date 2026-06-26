"use client";

import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface Failures { by_signature: { error: string | null; count: number }[]; }

export default function AdminFailuresPage() {
    const { data, loading, error } = useAdminData<Failures>("/failures");
    return (
        <div>
            <PageHeader title="Failures" subtitle="Recent failed actions grouped by error signature" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Error", "Count"]}
                    rows={data.by_signature.map((r) => [<span key="e" className="font-mono text-xs">{r.error || "(none)"}</span>, r.count])}
                />
            )}
        </div>
    );
}
