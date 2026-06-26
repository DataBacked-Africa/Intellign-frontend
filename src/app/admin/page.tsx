"use client";

import { useEffect, useRef, useState } from "react";
import { ADMIN_BASE } from "@/lib/adminApi";
import { PageHeader, StatTile, Card, StateBlock } from "@/components/admin/ui";

interface Overview {
    total_users: number; signups_today: number; signups_7d: number;
    total_optimization_runs: number; runs_today: number; run_success_rate: number;
    total_llm_tokens: number; tokens_today: number; tokens_7d: number;
    total_orgs: number;
    active_users: Record<string, number>;
    failed_runs_24h: number; stuck_actions: number;
}

const fmt = (n: number) => (n ?? 0).toLocaleString();

export default function AdminDashboard() {
    const [data, setData] = useState<Overview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [live, setLive] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    // Live overview via fetch-streaming SSE (keeps the Bearer token out of URLs).
    useEffect(() => {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        (async () => {
            try {
                const res = await fetch(`${ADMIN_BASE}/stream`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: ctrl.signal,
                });
                if (!res.ok || !res.body) { setError(`Stream error ${res.status}`); return; }
                setLive(true);
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buf = "";
                for (; ;) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });
                    const frames = buf.split("\n\n");
                    buf = frames.pop() || "";
                    for (const f of frames) {
                        const line = f.split("\n").find((l) => l.startsWith("data:"));
                        if (line) {
                            try { setData(JSON.parse(line.slice(5).trim())); } catch { /* ignore */ }
                        }
                    }
                }
            } catch (e: unknown) {
                if ((e as { name?: string })?.name !== "AbortError") setLive(false);
            }
        })();

        return () => ctrl.abort();
    }, []);

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Platform health at a glance"
                right={<span className={`text-xs px-2 py-1 rounded ${live ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>{live ? "● Live" : "○ Offline"}</span>}
            />

            <StateBlock loading={!data && !error} error={error} />

            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatTile label="Total users" value={fmt(data.total_users)} sub={`+${fmt(data.signups_today)} today · +${fmt(data.signups_7d)} 7d`} />
                        <StatTile label="Optimization runs" value={fmt(data.total_optimization_runs)} sub={`${fmt(data.runs_today)} today · ${data.run_success_rate}% success 24h`} />
                        <StatTile label="LLM tokens" value={fmt(data.total_llm_tokens)} sub={`${fmt(data.tokens_today)} today · ${fmt(data.tokens_7d)} 7d`} />
                        <StatTile label="Organizations" value={fmt(data.total_orgs)} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {(["24h", "7d", "30d", "1y"] as const).map((w) => (
                            <StatTile key={w} label={`Active users (${w})`} value={fmt(data.active_users?.[w] ?? 0)} />
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card title="Failed runs (24h)"><div className="text-2xl font-semibold text-red-600">{fmt(data.failed_runs_24h)}</div></Card>
                        <Card title="Stuck actions"><div className="text-2xl font-semibold text-amber-600">{fmt(data.stuck_actions)}</div></Card>
                        <Card title="Success rate (24h)"><div className="text-2xl font-semibold text-neutral-900">{data.run_success_rate}%</div></Card>
                    </div>
                </>
            )}
        </div>
    );
}
