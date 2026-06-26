"use client";

import { use, useState } from "react";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { useAdminStore } from "@/store/useAdminStore";
import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface Member {
    id: string; email: string; name: string; role: string; is_active: boolean;
}
interface OrgDetail { id: string; name: string; members: Member[]; }

export default function AdminOrgDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data, loading, error } = useAdminData<OrgDetail>(`/orgs/${id}`);
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const [busy, setBusy] = useState(false);

    const deactivate = async () => {
        setBusy(true);
        try { await adminApi.post(`/orgs/${id}/deactivate`); toast.success("Organization deactivated"); }
        catch (e: unknown) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
        finally { setBusy(false); }
    };

    return (
        <div>
            <PageHeader
                title={data?.name || "Organization"}
                right={isSuperuser && (
                    <button disabled={busy} onClick={deactivate}
                        className="rounded-md border border-red-300 text-red-600 text-sm px-3 py-1.5 hover:bg-red-50">
                        Deactivate org
                    </button>
                )}
            />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Email", "Name", "Role", "Status"]}
                    rows={data.members.map((m) => [m.email, m.name, m.role, m.is_active ? "Active" : "Disabled"])}
                />
            )}
        </div>
    );
}
