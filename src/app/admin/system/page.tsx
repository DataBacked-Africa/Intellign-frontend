"use client";

import { useState } from "react";
import { useAdminData, PageHeader, Card, StatTile, StateBlock } from "@/components/admin/ui";

type Tab = "sharing" | "email" | "security" | "health";
const TABS: { key: Tab; label: string; path: string }[] = [
    { key: "sharing", label: "Sharing", path: "/sharing" },
    { key: "email", label: "Email", path: "/email" },
    { key: "security", label: "Security", path: "/security" },
    { key: "health", label: "Health", path: "/health" },
];

export default function AdminSystemPage() {
    const [tab, setTab] = useState<Tab>("sharing");
    const active = TABS.find((t) => t.key === tab)!;
    const { data, loading, error } = useAdminData<Record<string, unknown>>(active.path, [tab]);

    return (
        <div>
            <PageHeader title="System / Ops" subtitle="Sharing · Email · Security · Health" />
            <div className="flex gap-1 mb-6 border-b border-neutral-200">
                {TABS.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm -mb-px border-b-2 ${tab === t.key ? "border-neutral-900 text-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <StateBlock loading={loading} error={error} />
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(data).map(([k, v]) => (
                        <StatTile key={k} label={k.replace(/_/g, " ")} value={typeof v === "number" ? v.toLocaleString() : String(v ?? "—")} />
                    ))}
                </div>
            )}
            {data && Object.keys(data).length === 0 && <Card>No data.</Card>}
        </div>
    );
}
