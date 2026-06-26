"use client";

import { use } from "react";
import { useAdminData, PageHeader, Card, StatTile, Table, StateBlock } from "@/components/admin/ui";

interface Msg { role: string; content: string; created_at: string | null; }
interface Act { action: string; status: string; error: string | null; created_at: string | null; }
interface Trace { session_id: string; messages: Msg[]; actions: Act[]; total_tokens: number; }

export default function AdminSessionTrace({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data, loading, error } = useAdminData<Trace>(`/sessions/${id}`);

    return (
        <div>
            <PageHeader title="Session trace" subtitle={id} />
            <StateBlock loading={loading} error={error} />
            {data && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatTile label="Messages" value={data.messages.length} />
                        <StatTile label="Actions" value={data.actions.length} />
                        <StatTile label="Tokens" value={data.total_tokens.toLocaleString()} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Chat">
                            <div className="space-y-3 max-h-[480px] overflow-y-auto">
                                {data.messages.map((m, i) => (
                                    <div key={i} className="text-sm">
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${m.role === "user" ? "bg-blue-100 text-blue-700" : "bg-neutral-200 text-neutral-700"}`}>{m.role}</span>
                                        <p className="mt-1 text-neutral-700 whitespace-pre-wrap">{m.content}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card title="Action journal">
                            <Table
                                columns={["Action", "Status", "Error"]}
                                rows={data.actions.map((a) => [
                                    a.action,
                                    <span key="s" className={a.status === "failed" ? "text-red-600" : a.status === "completed" ? "text-green-600" : "text-neutral-600"}>{a.status}</span>,
                                    a.error ? <span key="e" className="font-mono text-xs text-red-500">{a.error}</span> : "—",
                                ])}
                            />
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
