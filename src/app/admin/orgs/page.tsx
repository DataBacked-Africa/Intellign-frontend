"use client";

import Link from "next/link";
import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface OrgRow { id: string; name: string; member_count: number; session_count: number; }

export default function AdminOrgsPage() {
    const { data, loading, error } = useAdminData<OrgRow[]>("/orgs?limit=100");
    return (
        <div>
            <PageHeader title="Organizations" subtitle="All organizations on the platform" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Name", "Members", "Sessions"]}
                    rows={data.map((o) => [
                        <Link key={o.id} href={`/admin/orgs/${o.id}`} className="text-blue-600 hover:underline">{o.name}</Link>,
                        o.member_count, o.session_count,
                    ])}
                />
            )}
        </div>
    );
}
