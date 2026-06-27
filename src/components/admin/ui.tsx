"use client";

import { useEffect, useState, useCallback } from "react";
import adminApi from "@/lib/adminApi";

// ── Data hook ────────────────────────────────────────────────────────────────
export function useAdminData<T = unknown>(path: string | null, deps: unknown[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (path === null) return;
        setLoading(true);
        setError(null);
        try {
            const r = await adminApi.get<T>(path);
            setData(r.data);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { detail?: string } }; message?: string })
                ?.response?.data?.detail || (e as { message?: string })?.message || "Request failed";
            setError(msg);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path]);

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, ...deps]);

    return { data, loading, error, reload };
}

// ── Layout primitives ────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-2xl text-neutral-900" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
                {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
            </div>
            {right}
        </div>
    );
}

export function StatTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
    return (
        <div className="rounded-xl border border-[#5C1427]/12 bg-white p-4 shadow-[0_1px_2px_rgba(92,20,39,0.05)]">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="text-3xl text-neutral-900 mt-1.5" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
            {sub && <div className="text-xs text-neutral-400 mt-1.5">{sub}</div>}
        </div>
    );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[#5C1427]/12 bg-white p-4 shadow-[0_1px_2px_rgba(92,20,39,0.05)]">
            {title && <div className="text-sm font-medium text-neutral-700 mb-3">{title}</div>}
            {children}
        </div>
    );
}

export function Table({ columns, rows }: { columns: string[]; rows: (React.ReactNode[])[] }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500">
                    <tr>{columns.map((c) => <th key={c} className="text-left font-medium px-3 py-2">{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-neutral-400">No data</td></tr>
                    ) : rows.map((r, i) => (
                        <tr key={i} className="border-t border-neutral-100 hover:bg-neutral-50">
                            {r.map((cell, j) => <td key={j} className="px-3 py-2 text-neutral-700">{cell}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function StateBlock({ loading, error }: { loading: boolean; error: string | null }) {
    if (loading) return <div className="text-sm text-neutral-400 py-8 text-center">Loading…</div>;
    if (error) return <div className="text-sm text-red-600 py-8 text-center">{error}</div>;
    return null;
}
