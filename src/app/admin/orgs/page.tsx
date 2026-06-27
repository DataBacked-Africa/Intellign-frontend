"use client";

import Link from "next/link";
import { adminPath } from "@/lib/adminPath";
import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface OrgRow { id: string; name: string; member_count: number; session_count: number; total_tokens?: number; }

export default function AdminOrgsPage() {
    const { data, loading, error } = useAdminData<OrgRow[]>("/orgs?limit=100");
    return (
        <div>
            <PageHeader title="Organizations" subtitle="All organizations on the platform" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Name", "Members", "Sessions", "Tokens"]}
                    rows={data.map((o) => [
                        <Link key={o.id} href={adminPath(`/orgs/${o.id}`)} className="text-blue-600 hover:underline">{o.name}</Link>,
                        o.member_count, o.session_count, (o.total_tokens ?? 0).toLocaleString(),
                    ])}
                />
            )}
        </div>
    );
}
