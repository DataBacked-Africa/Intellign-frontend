"use client";

import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface Activity { by_status: { status: string; count: number }[]; }

export default function AdminActivityPage() {
    const { data, loading, error } = useAdminData<Activity>("/activity");
    return (
        <div>
            <PageHeader title="Activity" subtitle="Optimization / action journal by status" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table columns={["Status", "Count"]} rows={data.by_status.map((r) => [r.status, r.count])} />
            )}
        </div>
    );
}
