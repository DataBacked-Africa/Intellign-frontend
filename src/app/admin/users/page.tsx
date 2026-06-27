"use client";

import { useState } from "react";
import Link from "next/link";
import { ADMIN_BASE } from "@/lib/adminApi";
import { adminPath } from "@/lib/adminPath";
import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface UserRow {
    id: string; name: string; email: string; role: string;
    organization_id: string | null; organization_name?: string | null;
    is_active: boolean; email_verified: boolean;
    is_superuser: boolean; is_platform_admin: boolean;
    created_at: string | null; last_login_at: string | null; session_count?: number;
}

export default function AdminUsersPage() {
    const [q, setQ] = useState("");
    const [query, setQuery] = useState("");
    const { data, loading, error } = useAdminData<UserRow[]>(
        `/users?limit=100${query ? `&q=${encodeURIComponent(query)}` : ""}`, [query]
    );

    const exportCsv = () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        // Open CSV with auth via a fetch+blob (header can't go on a plain link).
        fetch(`${ADMIN_BASE}/users?format=csv&limit=1000${query ? `&q=${encodeURIComponent(query)}` : ""}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.blob())
            .then((b) => {
                const url = URL.createObjectURL(b);
                const a = document.createElement("a");
                a.href = url; a.download = "users.csv"; a.click();
                URL.revokeObjectURL(url);
            });
    };

    return (
        <div>
            <PageHeader
                title="Users"
                subtitle="All platform users"
                right={
                    <div className="flex gap-2">
                        <input
                            value={q} onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && setQuery(q)}
                            placeholder="Search email/name…"
                            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                        />
                        <button onClick={() => setQuery(q)} className="rounded-md bg-neutral-900 text-white text-sm px-3">Search</button>
                        <button onClick={exportCsv} className="rounded-md border border-neutral-300 text-sm px-3">Export CSV</button>
                    </div>
                }
            />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["Email", "Name", "Organization", "Role", "Status", "Verified", "Admin", "Last login"]}
                    rows={data.map((u) => [
                        <Link key={u.id} href={adminPath(`/users/${u.id}`)} className="text-blue-600 hover:underline">{u.email}</Link>,
                        u.name,
                        u.organization_name || (u.organization_id ? "—" : "—"),
                        u.role,
                        u.is_active ? "Active" : <span className="text-red-600">Disabled</span>,
                        u.email_verified ? "✓" : "—",
                        u.is_superuser ? "Superuser" : u.is_platform_admin ? "Admin" : "—",
                        u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "—",
                    ])}
                />
            )}
        </div>
    );
}
