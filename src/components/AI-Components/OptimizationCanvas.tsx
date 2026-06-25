"use client";

/**
 * OptimizationCanvas — sliding 720px panel matching the DS design.
 * Tabs: Monitor | Results | Assignments | Goals | Config | Datasets
 * Goals tab: full CRUD (add, edit, delete).
 * Replaces the modal overlay for the optimization lifecycle.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Minimize2, Plus, Trash2, Save, Edit3, Check, Download,
    ChevronDown, Loader2, RefreshCcw, XCircle, CheckCircle2,
    ArrowRight, Search, ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvas, CanvasTab } from '@/contexts/CanvasContext';
import { useSessionStore } from '@/store/useSessionStore';
import { useSessionOrchestrator } from '@/hooks/useSessionOrchestrator';
import { resultsService } from '@/services/resultsService';
import { showToast } from '@/components/ui/CustomToast';
import { GoalDefinition, DataContext } from '@/types/models';
import axiosInstance from '@/lib/axiosConfig';
import { InsightsTab } from './InsightsTab';
import { DatasetPanel } from './DatasetPanel';
import { SolverConfigPanel } from './SolverConfigPanel';
import { CanvasGoalsTab } from './CanvasGoalsTab';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Assignment {
    assignment_id: string;
    resource: { id: string;[k: string]: any };
    target: { id: string;[k: string]: any };
    summary?: {
        resource_name?: string;
        resource_specialization?: string;
        target_name?: string;
        target_specialization?: string;
    };
    score: number;
    score_breakdown?: Record<string, any> | null;
    rationale?: string | null;
    approval_status: 'pending' | 'approved' | 'rejected' | 'modified';
    notes: string | null;
}

interface OptimizationData {
    job_id: string;
    status: string;
    metrics: { best_fitness: number; total_targets: number; assigned_count: number; generations_run: number; population_size: number; total_resources: number; elapsed_time_seconds: number; average_final_fitness: number; solution_quality?: number; coverage_pct?: number };
    assignments: Assignment[];
    pagination: { page: number; page_size: number; total_items: number; total_pages: number };
    status_counts: { pending: number; approved: number; modified: number; rejected: number };
    fitness_history: number[];
    average_history: number[];
}

// ── Fitness chart ──────────────────────────────────────────────────────────────

const FitnessChart: React.FC<{ history: number[]; average: number[] }> = ({ history, average }) => {
    if (!history?.length) return null;
    const w = 520; const h = 140; const pad = 26;
    const all = [...history, ...average];
    const max = Math.max(...all); const min = Math.min(...all); const range = max - min || 1;
    const gx = (i: number) => pad + (i / (history.length - 1 || 1)) * (w - 2 * pad);
    const gy = (v: number) => h - pad - ((v - min) / range) * (h - 2 * pad);
    const fitPath = history.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const avgPath = average.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const last = [gx(history.length - 1), gy(history[history.length - 1])];
    return (
        <div className="bg-[#14110F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-semibold">Fitness convergence</span>
                <div className="flex gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#D49AAA] inline-block" /> Best</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gray-500 opacity-50 inline-block" /> Average</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
                <defs><linearGradient id="cv-cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#D49AAA" stopOpacity="0.28" /><stop offset="100%" stopColor="#D49AAA" stopOpacity="0" /></linearGradient></defs>
                {[0.25, 0.5, 0.75].map(t => <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - 2 * pad)} y2={h - pad - t * (h - 2 * pad)} stroke="rgba(255,255,255,0.06)" />)}
                <path d={`${fitPath} L${last[0].toFixed(1)} ${(h - pad).toFixed(1)} L${pad} ${(h - pad).toFixed(1)} Z`} fill="url(#cv-cg)" />
                <path d={avgPath} fill="none" stroke="rgba(107,114,128,0.4)" strokeWidth="1.5" />
                <path d={fitPath} fill="none" stroke="#D49AAA" strokeWidth="2" />
                <circle cx={last[0]} cy={last[1]} r="3.5" fill="#14110F" stroke="#D49AAA" strokeWidth="1.5" />
            </svg>
        </div>
    );
};

// ── Monitor tab ────────────────────────────────────────────────────────────────

const TIMELINE = [
    { stage: 'ingest', label: 'Data ingested', sub: 'Resources & targets loaded' },
    { stage: 'translate', label: 'Problem translated', sub: 'Goals + constraints formalised' },
    { stage: 'init', label: 'Population seeded', sub: 'Candidate assignments created' },
    { stage: 'solve', label: 'Genetic algorithm running', sub: 'Mutating, crossing over, evaluating' },
    { stage: 'converge', label: 'Convergence detected', sub: 'Δ-fitness < 1e-4 for 50 generations' },
    { stage: 'explain', label: 'Rationale generated', sub: 'Per-assignment notes ready' },
];

const MonitorTab: React.FC = () => {
    const { logs, progress, sessionStatus, liveMetrics } = useSessionStore();
    const isDone = sessionStatus === 'COMPLETED';
    const isFailed = sessionStatus === 'FAILED';
    const isRunning = sessionStatus === 'PROCESSING' || sessionStatus === 'CONFIGURING';

    // Live elapsed clock while running
    const [elapsedS, setElapsedS] = useState(0);
    useEffect(() => {
        if (!isRunning || !liveMetrics?.startedAt) return;
        const tick = () => setElapsedS(Math.floor((Date.now() - (liveMetrics.startedAt ?? Date.now())) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [isRunning, liveMetrics?.startedAt]);

    const genLabel = liveMetrics && liveMetrics.totalGenerations > 0
        ? `${liveMetrics.currentGeneration}/${liveMetrics.totalGenerations}`
        : liveMetrics?.currentGeneration
            ? String(liveMetrics.currentGeneration)
            : '—';
    const fitnessLabel = liveMetrics?.bestFitness ? liveMetrics.bestFitness.toFixed(3) : '—';
    const elapsedLabel = liveMetrics?.startedAt
        ? `${Math.floor(elapsedS / 60)}m ${elapsedS % 60}s`
        : '—';

    // Timeline stage derived from real progress fraction (0–1 of generations)
    const genFraction = liveMetrics && liveMetrics.totalGenerations > 0
        ? liveMetrics.currentGeneration / liveMetrics.totalGenerations
        : 0;
    const stageIdx = isDone
        ? TIMELINE.length
        : isRunning
            ? (genFraction >= 1 ? 4 : genFraction > 0 ? 3 : 2)
            : 0;

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { lbl: 'Generation', val: genLabel },
                    { lbl: 'Coverage', val: liveMetrics?.coverage != null ? `${liveMetrics.coverage}%` : '—' },
                    { lbl: 'Best fitness', val: fitnessLabel },
                    { lbl: 'Elapsed', val: elapsedLabel },
                ].map(s => (
                    <div key={s.lbl} className="rounded-xl p-4" style={{ background: 'var(--neutral-50)', border: '1px solid var(--border-subtle)' }}>
                        <div className="text-[10px] uppercase tracking-[0.14em] mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>{s.lbl}</div>
                        <div className="text-3xl font-light" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-maroon-deep)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="rounded-xl p-4" style={{ background: 'var(--neutral-50)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-2 text-sm" style={{ color: 'var(--fg-secondary)' }}>
                    <span>{isFailed ? 'Failed' : isDone ? 'Converged' : isRunning ? 'Running…' : 'Waiting to start'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-maroon)' }}>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                    <motion.div className="h-full rounded-full" animate={{ width: `${Math.max(2, progress)}%` }} transition={{ duration: 0.4 }}
                        style={{ background: isFailed ? '#EF4444' : 'linear-gradient(90deg, var(--brand-maroon), var(--brand-maroon-rich))' }} />
                </div>
                {logs.length > 0 && (
                    <p className="text-xs mt-2 truncate" style={{ color: 'var(--fg-tertiary)' }}>{logs[logs.length - 1]}</p>
                )}
            </div>

            {/* Timeline */}
            <div className="space-y-2">
                {TIMELINE.map((t, i) => {
                    const done = i < stageIdx;
                    const active = i === stageIdx;
                    return (
                        <div key={t.stage} className="flex gap-3 items-start text-sm">
                            <div className="text-[11px] w-4 text-center pt-0.5 shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>
                                {done ? '✓' : active ? '…' : '·'}
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: done ? 'var(--brand-maroon)' : active ? '#F59E0B' : 'var(--brand-bone-deep)', border: `2px solid ${done || active ? (done ? 'var(--brand-maroon)' : '#F59E0B') : 'var(--border-default)'}` }} />
                            <div style={{ color: 'var(--fg-primary)' }}>
                                {t.label}
                                <span className="block text-xs mt-0.5" style={{ color: 'var(--fg-tertiary)' }}>{t.sub}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Results tab ────────────────────────────────────────────────────────────────

const ResultsTab: React.FC<{ jobId: string }> = ({ jobId }) => {
    const [data, setData] = useState<OptimizationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    // Grounded AI explanations, keyed by assignment_id
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [explainLoading, setExplainLoading] = useState<string | null>(null);

    const handleExplain = async (id: string, refresh = false) => {
        setExplainLoading(id);
        try {
            const r = await resultsService.explainAssignment(jobId, id, refresh);
            setExplanations(prev => ({ ...prev, [id]: r.explanation }));
        } catch {
            showToast.error('Explanation Failed', 'Could not generate a grounded explanation.');
        } finally { setExplainLoading(null); }
    };

    const loadData = async (p = 1) => {
        setLoading(true);
        try { setData(await resultsService.getResults(jobId, p, 50, true) as OptimizationData); }
        catch { /* keep */ } finally { setLoading(false); }
    };

    useEffect(() => { if (jobId) loadData(); }, [jobId]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try { await resultsService.approveAssignment(jobId, id); showToast.success('Approved', ''); loadData(); }
        catch { showToast.error('Failed', ''); } finally { setActionLoading(null); }
    };
    const handleReject = async (id: string) => {
        const reason = prompt('Rejection reason:');
        if (!reason) return;
        setActionLoading(id);
        try { await resultsService.rejectAssignment(jobId, id, reason); showToast.success('Rejected', ''); loadData(); }
        catch { showToast.error('Failed', ''); } finally { setActionLoading(null); }
    };
    const handleApproveAll = async () => {
        setActionLoading('all');
        try { const r = await resultsService.approveAll(jobId); showToast.success('All Approved', `${r.approved_count} assignments`); loadData(); }
        catch { showToast.error('Failed', ''); } finally { setActionLoading(null); }
    };
    const handleExport = async () => {
        try { await resultsService.downloadExportedCSV(jobId); showToast.success('Exported', ''); }
        catch { showToast.error('Export Failed', ''); }
    };

    if (loading && !data) return <div className="flex items-center justify-center py-12 text-sm" style={{ color: 'var(--fg-tertiary)' }}><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading results…</div>;
    if (!data) return <div className="py-12 text-center text-sm" style={{ color: 'var(--fg-tertiary)' }}>No optimization data yet.</div>;

    const { metrics, assignments = [], status_counts, fitness_history = [], average_history = [] } = data;

    const filtered = assignments.filter(a => {
        const q = searchQuery.toLowerCase();
        return (q === '' || a.resource.id.toLowerCase().includes(q) || a.target.id.toLowerCase().includes(q))
            && (statusFilter === 'all' || a.approval_status === statusFilter);
    });
    const PER_PAGE = 10;
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { lbl: 'Solution quality', val: typeof metrics?.solution_quality === 'number' ? `${metrics.solution_quality}%` : '—', hi: true },
                    { lbl: 'Resources assigned', val: metrics?.assigned_count ?? 0, sub: `of ${metrics?.total_resources ?? 0}` },
                    { lbl: 'Target pool', val: metrics?.total_targets ?? 0 },
                    { lbl: 'Best fitness', val: typeof metrics?.best_fitness === 'number' ? metrics.best_fitness.toFixed(3) : '—' },
                ].map(m => (
                    <div key={m.lbl} className="rounded-xl p-4" style={{ background: 'var(--neutral-0)', border: `1px solid ${m.hi ? 'rgba(92,20,39,0.22)' : 'var(--border-subtle)'}` }}>
                        <div className="text-[10px] uppercase tracking-[0.12em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>{m.lbl}</div>
                        <div className="flex items-baseline gap-1.5">
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: m.hi ? 'var(--brand-maroon)' : 'var(--brand-maroon-deep)', letterSpacing: '-0.02em', lineHeight: 1 }}>{m.val}</span>
                            {m.hi && <span className="text-xs" style={{ color: 'var(--fg-tertiary)' }}>of {metrics?.total_resources}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <FitnessChart history={fitness_history} average={average_history} />

            {/* Approval status */}
            <div className="rounded-xl p-4" style={{ background: 'var(--neutral-0)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg-primary)' }}>Approval status</h3>
                {status_counts && [
                    { lbl: 'Approved', n: status_counts.approved, c: '#10B981' },
                    { lbl: 'Pending', n: status_counts.pending, c: '#F59E0B' },
                    { lbl: 'Rejected', n: status_counts.rejected, c: '#EF4444' },
                    { lbl: 'Modified', n: status_counts.modified, c: '#3B82F6' },
                ].map(item => (
                    <div key={item.lbl} className="flex items-center justify-between mb-2 text-sm">
                        <span className="flex items-center gap-2" style={{ color: 'var(--fg-secondary)' }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.c }} />{item.lbl}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--fg-primary)' }}>{item.n}</span>
                    </div>
                ))}
                {status_counts && (
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden flex" style={{ background: 'var(--border-subtle)' }}>
                        {(() => { const t = (status_counts.approved + status_counts.pending + status_counts.rejected + status_counts.modified) || 1; return [['#10B981', status_counts.approved], ['#F59E0B', status_counts.pending], ['#EF4444', status_counts.rejected], ['#3B82F6', status_counts.modified]].map(([c, n], i) => <div key={i} style={{ background: c as string, width: `${((n as number) / t) * 100}%`, height: '100%' }} />); })()}
                    </div>
                )}
            </div>

            {/* Assignments table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--neutral-0)', border: '1px solid var(--border-subtle)' }}>
                <div className="p-3 flex flex-wrap items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm font-semibold flex-1" style={{ color: 'var(--fg-primary)' }}>Assignments ({filtered.length})</span>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--fg-tertiary)' }} />
                        <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            placeholder="Search…" className="pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none w-36"
                            style={{ border: '1px solid var(--border-subtle)', background: 'var(--brand-bone-deep)', color: 'var(--fg-primary)' }} />
                    </div>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-2.5 py-1.5 text-xs rounded-lg outline-none"
                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--brand-bone-deep)', color: 'var(--fg-primary)' }}>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="modified">Modified</option>
                    </select>
                    <button onClick={handleApproveAll} disabled={actionLoading === 'all'}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                        style={{ background: '#10B981' }}>
                        {actionLoading === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve All
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg"
                        style={{ border: '1px solid var(--border-default)', color: 'var(--fg-secondary)', background: 'transparent' }}>
                        <Download className="w-3 h-3" /> Export
                    </button>
                </div>
                <table className="w-full">
                    <thead style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <tr>
                            <th className="w-8 px-2 py-3" />
                            {['Resource', 'Target', 'Score', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-[0.12em] font-medium"
                                    style={{ color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(a => {
                            const isExp = expandedRow === a.assignment_id;
                            return (
                                <React.Fragment key={a.assignment_id}>
                                    <tr className="transition-colors" style={{ borderTop: '1px solid var(--border-subtle)', background: isExp ? 'var(--neutral-50)' : undefined }}>
                                        <td className="px-2 py-2">
                                            <button onClick={() => setExpandedRow(isExp ? null : a.assignment_id)}
                                                className="p-1 rounded" style={{ border: 0, background: 'transparent', color: 'var(--fg-tertiary)', cursor: 'pointer' }}>
                                                <ChevronDown size={13} style={{ transform: isExp ? 'rotate(180deg)' : undefined, transition: 'transform 140ms' }} />
                                            </button>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-xs font-medium" style={{ color: 'var(--fg-primary)' }}>{a.summary?.resource_name || a.resource.id}</div>
                                            <div className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>{a.resource.id}{a.summary?.resource_specialization ? ` · ${a.summary.resource_specialization}` : ''}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-xs" style={{ color: 'var(--fg-secondary)' }}>{a.summary?.target_name || a.target.id}</div>
                                            <div className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>{a.target.id}{a.summary?.target_specialization ? ` · ${a.summary.target_specialization}` : ''}</div>
                                        </td>
                                        <td className="px-3 py-2 text-xs font-semibold">
                                            {(() => {
                                                const n = typeof a.score === 'number' ? a.score : Number(a.score);
                                                const zero = !n || n === 0;
                                                return (
                                                    <div className="leading-tight">
                                                        <span style={{ color: zero ? 'var(--fg-tertiary)' : 'light-dark(#047857, #34D399)' }}>{typeof a.score === 'number' ? a.score.toFixed(3) : a.score}</span>
                                                        {zero && <div className="text-[9px] font-normal" style={{ color: 'var(--fg-tertiary)' }}>neutral</div>}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', {
                                                'bg-amber-100 text-amber-700': a.approval_status === 'pending',
                                                'bg-emerald-100 text-emerald-700': a.approval_status === 'approved',
                                                'bg-red-100 text-red-700': a.approval_status === 'rejected',
                                                'bg-blue-100 text-blue-700': a.approval_status === 'modified',
                                            })}>{a.approval_status}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                                <button onClick={() => handleApprove(a.assignment_id)} disabled={!!actionLoading} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 disabled:opacity-40" style={{ border: 0, background: 'transparent', cursor: 'pointer' }} title="Approve">
                                                    {actionLoading === a.assignment_id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                </button>
                                                <button onClick={() => handleReject(a.assignment_id)} disabled={!!actionLoading} className="p-1.5 rounded hover:bg-red-50 text-red-500 disabled:opacity-40" style={{ border: 0, background: 'transparent', cursor: 'pointer' }} title="Reject">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {isExp && (
                                        <tr>
                                            <td colSpan={6} className="px-5 pb-4 pt-2" style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>Why this pairing</p>
                                                    <button
                                                        onClick={() => handleExplain(a.assignment_id, !!explanations[a.assignment_id])}
                                                        disabled={explainLoading === a.assignment_id}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold disabled:opacity-50"
                                                        style={{ border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--brand-maroon)', cursor: 'pointer' }}
                                                        title="Generate a grounded explanation from the full conversation and data"
                                                    >
                                                        {explainLoading === a.assignment_id
                                                            ? <Loader2 size={11} className="animate-spin" />
                                                            : explanations[a.assignment_id] ? <RefreshCcw size={11} /> : <Sparkles size={11} />}
                                                        {explanations[a.assignment_id] ? 'Regenerate' : 'Explain with AI'}
                                                    </button>
                                                </div>
                                                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--fg-primary)' }}>
                                                    {explanations[a.assignment_id]
                                                        ?? a.rationale ?? a.notes
                                                        ?? `${a.summary?.resource_name || a.resource.id} assigned to ${a.summary?.target_name || a.target.id}. Score reflects the weighted objective function across all defined goals. Click "Explain with AI" for a grounded breakdown.`}
                                                </p>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>Match score</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[180px]" style={{ background: 'var(--border-subtle)' }}>
                                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((typeof a.score === 'number' ? a.score : 0) * 100)}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-700 tabular-nums">{typeof a.score === 'number' ? a.score.toFixed(3) : a.score}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {paginated.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--fg-tertiary)' }}>No assignments match your filter.</td></tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="p-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <span className="text-xs" style={{ color: 'var(--fg-tertiary)' }}>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded disabled:opacity-40" style={{ border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer' }}><ChevronLeft size={14} /></button>
                            <span className="text-xs" style={{ color: 'var(--fg-primary)' }}>{page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded disabled:opacity-40" style={{ border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer' }}><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



// ── Datasets tab ──────────────────────────────────────────────────────────────

const DatasetsTab: React.FC<{ sessionId: string | null; dataContext: DataContext | null }> = ({ sessionId, dataContext }) => {
    const [downloading, setDownloading] = useState<string | null>(null);

    const download = async (table: 'resources' | 'targets', format: 'csv' | 'xlsx' = 'csv') => {
        if (!sessionId) return;
        setDownloading(table);
        try {
            const res = await axiosInstance.get(`/ingest/chat/${sessionId}/datasets?table=${table}&format=${format}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = `${table}_${sessionId.slice(0, 8)}.${format}`; a.click();
            URL.revokeObjectURL(url);
            showToast.success('Downloaded', `${table}.${format}`);
        } catch {
            showToast.error('Download failed', `${table} dataset not available.`);
        } finally { setDownloading(null); }
    };

    const resCount = dataContext?.resources_metadata?.count;
    const tgtCount = dataContext?.targets_metadata?.count;
    const resCols = dataContext?.resources_metadata?.columns ?? [];
    const tgtCols = dataContext?.targets_metadata?.columns ?? [];
    const syntheticFlags = dataContext?.synthetic_flags ?? {};

    const noData = !sessionId || (!resCount && !tgtCount);

    if (noData) {
        return (
            <div className="py-12 text-center">
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--brand-maroon-deep)' }}>No datasets yet.</p>
                <p className="text-sm mt-1" style={{ color: 'var(--fg-tertiary)' }}>Upload data or generate a sample in the chat to see it here.</p>
            </div>
        );
    }

    const tables = [
        { key: 'resources' as const, label: 'Resources', count: resCount, cols: resCols },
        { key: 'targets' as const, label: 'Targets', count: tgtCount, cols: tgtCols },
    ].filter(t => t.count != null || t.cols.length > 0);

    return (
        <div className="space-y-5">
            {tables.map(t => (
                <div key={t.key} className="rounded-xl overflow-hidden" style={{ background: 'var(--neutral-0)', border: '1px solid var(--border-subtle)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--brand-maroon-50)', borderBottom: '1px solid var(--brand-maroon-100)' }}>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-maroon-deep)' }}>
                                {t.label}
                            </span>
                            {t.count != null && (
                                <span className="ml-2 text-[10px]" style={{ color: 'var(--fg-tertiary)' }}>
                                    {t.count.toLocaleString()} rows
                                </span>
                            )}
                            {syntheticFlags[t.key]?.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-violet-100 text-violet-700 font-semibold">synthetic cols</span>
                            )}
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={() => download(t.key, 'csv')} disabled={downloading === t.key || !sessionId}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50"
                                style={{ background: 'var(--brand-maroon)', color: 'var(--brand-bone)', border: 0, cursor: 'pointer' }}>
                                {downloading === t.key ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} CSV
                            </button>
                            <button onClick={() => download(t.key, 'xlsx')} disabled={!!downloading || !sessionId}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50"
                                style={{ background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--fg-secondary)', cursor: 'pointer' }}>
                                XLSX
                            </button>
                        </div>
                    </div>

                    {/* Column list */}
                    {t.cols.length > 0 && (
                        <div className="px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>
                                Columns ({t.cols.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {t.cols.map((col: string) => {
                                    const isSynthetic = syntheticFlags[t.key]?.includes(col);
                                    return (
                                        <span key={col} className="px-2 py-0.5 rounded text-[11px]"
                                            style={{
                                                fontFamily: 'var(--font-mono)',
                                                background: isSynthetic ? '#EDE9FE' : 'var(--neutral-50)',
                                                color: isSynthetic ? '#6D28D9' : 'var(--fg-secondary)',
                                                border: `1px solid ${isSynthetic ? '#C4B5FD' : 'var(--border-subtle)'}`,
                                            }}>
                                            {col}{isSynthetic && <span className="ml-1 opacity-60">~</span>}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {!sessionId && (
                <p className="text-xs text-center" style={{ color: 'var(--fg-tertiary)' }}>Session ID not available — navigate to an active session to download.</p>
            )}
        </div>
    );
};

// ── Config tab ─────────────────────────────────────────────────────────────────

const ConfigTab: React.FC = () => {
    const [solver, setSolver] = useState('ga');
    const solvers = [
        { id: 'ga', name: 'Genetic algorithm', desc: 'Best for large assignment problems with non-linear constraints.' },
        { id: 'greedy', name: 'Greedy solver', desc: 'Fast approximation for initial estimates.' },
        { id: 'ortools', name: 'OR-Tools CP', desc: 'When hard constraints dominate.' },
        { id: 'schedule', name: 'Schedule solver', desc: 'Shift and time-window problems.' },
    ];
    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>
                    <span>Solver</span><span style={{ color: 'var(--brand-maroon)' }}>Auto-selected</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {solvers.map(s => (
                        <button key={s.id} onClick={() => setSolver(s.id)}
                            className="text-left p-3 rounded-lg transition-all"
                            style={{ border: `1px solid ${solver === s.id ? 'var(--brand-maroon)' : 'var(--border-subtle)'}`, background: solver === s.id ? 'rgba(92,20,39,0.05)' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <div className="text-sm font-semibold" style={{ color: solver === s.id ? 'var(--brand-maroon-deep)' : 'var(--fg-primary)' }}>{s.name}</div>
                            <div className="text-[11.5px] mt-0.5 leading-snug" style={{ color: 'var(--fg-tertiary)' }}>{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main canvas component ──────────────────────────────────────────────────────

const TABS: { id: CanvasTab; label: string }[] = [
    { id: 'monitor', label: 'Monitor' },
    { id: 'results', label: 'Results' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'goals', label: 'Goals' },
    { id: 'config', label: 'Config' },
    { id: 'datasets', label: 'Datasets' },
    { id: 'insights', label: 'Insights' },
];

const OptimizationCanvas: React.FC = () => {
    const { isOpen, isMinimized, tab, setTab, close, minimize, sessionId, goals, preexistingJobId, dataContext, problemName } = useCanvas();
    const { sessionStatus, jobId: storeJobId, setStatus, setJobId, progress, chat } = useSessionStore();
    const { startOptimization, cancelOptimization, connectToProgress, disconnect } = useSessionOrchestrator();
    // Shared chat state — mirrored into the store by the single useUnifiedChat
    // instance in the chat panel. No second hook instance = no state drift.
    const { messages, artifactCount, solverConfig, isGenerating, dataContext: chatDataContext, latestJobId, phaseUiHint } = chat;
    const downloadDataset = useCallback(async (table: 'resources' | 'targets', format: 'csv' | 'xlsx' = 'csv') => {
        if (!sessionId) return;
        try {
            const res = await axiosInstance.get(
                `/ingest/chat/${sessionId}/datasets?table=${table}&format=${format}`,
                { responseType: 'blob' },
            );
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = `${table}_${sessionId.slice(0, 8)}.${format}`; a.click();
            URL.revokeObjectURL(url);
        } catch {
            showToast.error('Download failed', `${table} dataset not available.`);
        }
    }, [sessionId]);
    const [solverConfigLocal, setSolverConfigLocal] = useState<any>(null);
    const [reportedInsights, setReportedInsights] = useState<number | null>(null);
    const startedRef = useRef(false);

    // Insight badge must match the Insights tab exactly. `artifactCount` from /state
    // counts DB rows with any artifacts (inflated). Count the real insight cards from
    // the loaded messages; once the tab mounts it reports its precise total.
    const msgInsightCount = useMemo(
        () => messages.reduce((n, m) => n + (m.artifacts?.length ?? 0), 0),
        [messages],
    );
    const insightBadge = reportedInsights ?? msgInsightCount;

    const effectiveJobId = storeJobId ?? preexistingJobId ?? latestJobId ?? '';
    const isDone = sessionStatus === 'COMPLETED';
    const isRunning = sessionStatus === 'PROCESSING' || sessionStatus === 'CONFIGURING';
    const isFailed = sessionStatus === 'FAILED';

    // Adopt a job started from CHAT (RunOptimization → optimization_started → job_id).
    // The chat hook writes the job to the shared store; when storeJobId appears while
    // running, connect to the live progress stream so Monitor/Results fill.
    const connectedJobRef = useRef<string | null>(null);
    useEffect(() => {
        const jid = storeJobId ?? latestJobId;
        if (jid && connectedJobRef.current !== jid && sessionStatus !== 'COMPLETED') {
            connectedJobRef.current = jid;
            if (!storeJobId) setJobId(jid);
            setStatus('PROCESSING');
            setTab('monitor');
            connectToProgress(jid);
        }
    }, [storeJobId, latestJobId]); // eslint-disable-line

    // Auto-switch to results tab when done
    useEffect(() => {
        if (isDone && (tab === 'monitor')) setTab('results');
    }, [isDone]); // eslint-disable-line

    // Auto-switch to datasets tab when generation starts
    useEffect(() => {
        if (isGenerating) setTab('datasets');
    }, [isGenerating]); // eslint-disable-line

    // Server-driven tab: phase_ui_hint is the backend's single source of UI truth.
    useEffect(() => {
        if (phaseUiHint === 'running') setTab('monitor');
        else if (phaseUiHint === 'results' && sessionStatus !== 'PROCESSING') setTab('results');
    }, [phaseUiHint]); // eslint-disable-line

    // Auto-start optimization only when the canvas opens to the Monitor tab AND
    // the system is actually ready to run (goals defined). Opening to view data,
    // solver config, goals, or insights must NOT kick off an optimization —
    // that previously fired /optimizations/run prematurely and 404'd.
    useEffect(() => {
        if (!isOpen) { startedRef.current = false; return; }
        if (startedRef.current) return;
        startedRef.current = true;

        // Always reconnect to an existing/active job regardless of tab
        if (preexistingJobId) { setJobId(preexistingJobId); setStatus('PROCESSING'); connectToProgress(preexistingJobId); return; }
        if (storeJobId && (sessionStatus === 'PROCESSING' || sessionStatus === 'COMPLETED')) { if (sessionStatus === 'PROCESSING') connectToProgress(storeJobId); return; }
        if (!sessionId) return;

        const readyToOptimize = (goals?.length ?? 0) > 0;
        const openedToRun = tab === 'monitor';

        axiosInstance.get(`/optimizations/jobs/${sessionId}`)
            .then(res => {
                const jobs: any[] = res.data?.jobs ?? res.data ?? [];
                const active = jobs.find((j: any) => ['pending', 'running', 'processing'].includes((j.status ?? '').toLowerCase()));
                if (active?.job_id) { setJobId(active.job_id); setStatus('PROCESSING'); connectToProgress(active.job_id); return; }
                // Only auto-run when on the Monitor tab with goals ready
                if (openedToRun && readyToOptimize) {
                    startOptimization(sessionId, { configOverride: { goals, ga_params: null } });
                }
            })
            .catch(() => {
                if (openedToRun && readyToOptimize) {
                    startOptimization(sessionId, { configOverride: { goals, ga_params: null } });
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleClose = () => { if (isRunning) disconnect(); close(); };

    const statusColor = isDone ? 'bg-emerald-100 text-emerald-700' : isFailed ? 'bg-red-100 text-red-700' : isRunning ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
    const statusLabel = isDone ? 'Completed' : isFailed ? 'Failed' : isRunning ? 'Running' : 'Starting';

    if (!isOpen || isMinimized) return null;

    return (
        <aside className="opt-canvas" style={{ background: 'var(--neutral-0)', display: 'flex', flexDirection: 'column', animation: 'canvas-in 280ms cubic-bezier(0.2,0,0,1)' }}>
            {/* Head */}
            <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--neutral-50)' }}>
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: isDone ? '#10B981' : isRunning ? '#F59E0B' : 'var(--brand-maroon)', boxShadow: isRunning ? '0 0 0 4px rgba(245,158,11,0.18)' : undefined }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--brand-maroon-deep)', letterSpacing: '-0.015em', margin: 0 }}>{problemName || 'Optimization'}</h2>
                    {effectiveJobId && <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>· {effectiveJobId.slice(0, 8)}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', statusColor)}>{statusLabel}</span>
                    <button onClick={minimize} className="p-1.5 rounded-lg" style={{ border: 0, background: 'transparent', color: 'var(--fg-secondary)', cursor: 'pointer' }} title="Minimize"><Minimize2 size={15} /></button>
                    <button onClick={handleClose} className="p-1.5 rounded-lg" style={{ border: 0, background: 'transparent', color: 'var(--fg-secondary)', cursor: 'pointer' }} title="Close"><X size={15} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--neutral-0)' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className="relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-1.5"
                        style={{ border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: tab === t.id ? 'var(--brand-maroon)' : 'var(--fg-secondary)', borderBottom: `2px solid ${tab === t.id ? 'var(--brand-maroon)' : 'transparent'}`, marginBottom: -1 }}>
                        {t.id === 'insights' && <Sparkles className="w-3 h-3" />}
                        {t.label}
                        {t.id === 'insights' && insightBadge > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--brand-maroon)] text-white font-bold min-w-[18px] text-center">
                                {insightBadge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        {tab === 'monitor' && <MonitorTab />}
                        {tab === 'results' && (
                            isDone && effectiveJobId
                                ? <ResultsTab jobId={effectiveJobId} />
                                : <div className="py-12 text-center"><p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--brand-maroon-deep)' }}>Results appear once converged.</p><p className="text-sm mt-1" style={{ color: 'var(--fg-tertiary)' }}>Watch the Monitor tab — we'll switch automatically.</p></div>
                        )}
                        {tab === 'assignments' && (
                            isDone && effectiveJobId
                                ? <ResultsTab jobId={effectiveJobId} />
                                : <div className="py-12 text-center"><p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--brand-maroon-deep)' }}>No assignments yet.</p><p className="text-sm mt-1" style={{ color: 'var(--fg-tertiary)' }}>Once converged, every resource → target pairing lands here.</p></div>
                        )}
                        {tab === 'goals' && <CanvasGoalsTab goals={goals} sessionId={sessionId} />}
                        {tab === 'config' && (
                            sessionId
                                ? <SolverConfigPanel
                                    sessionId={sessionId}
                                    config={(solverConfigLocal ?? solverConfig) as any}
                                    onConfigUpdated={(cfg) => setSolverConfigLocal(cfg)}
                                  />
                                : <ConfigTab />
                        )}
                        {tab === 'datasets' && (
                            sessionId
                                ? <DatasetPanel
                                    sessionId={sessionId}
                                    dataContext={chatDataContext ?? dataContext}
                                    onDownload={(table, format) => downloadDataset(table, format)}
                                    isGenerating={isGenerating}
                                  />
                                : <DatasetsTab sessionId={sessionId} dataContext={dataContext} />
                        )}
                        {tab === 'insights' && <InsightsTab messages={messages} jobId={effectiveJobId || undefined} sessionId={sessionId} onCountChange={setReportedInsights} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer when done */}
            {isDone && (
                <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--neutral-50)' }}>
                    <p className="text-xs" style={{ color: 'var(--fg-tertiary)' }}>Review and approve assignments above to finalise.</p>
                    <button onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{ border: '1px solid var(--border-default)', color: 'var(--fg-secondary)', background: 'transparent', cursor: 'pointer' }}>Back to Chat</button>
                </div>
            )}

            {isFailed && (
                <div className="flex-shrink-0 flex items-center justify-center gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => { startedRef.current = false; if (sessionId) startOptimization(sessionId); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: 'var(--brand-maroon)', border: 0, cursor: 'pointer' }}>
                        <RefreshCcw size={14} /> Retry
                    </button>
                    <button onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ border: '1px solid var(--border-default)', color: 'var(--fg-secondary)', background: 'transparent', cursor: 'pointer' }}>Back to Chat</button>
                </div>
            )}
        </aside>
    );
};

export default OptimizationCanvas;
