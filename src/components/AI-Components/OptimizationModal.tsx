"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Loader2, CheckCircle2, XCircle, Zap, RefreshCcw,
    Search, ChevronLeft, ChevronRight, ChevronDown, Check, Edit3, Download, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/useSessionStore';
import { useSessionOrchestrator } from '@/hooks/useSessionOrchestrator';
import { resultsService } from '@/services/resultsService';
import { showToast } from '@/components/ui/CustomToast';
import axiosInstance from '@/lib/axiosConfig';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Assignment {
    assignment_id: string;
    resource: { id: string };
    target: { id: string };
    score: number;
    approval_status: 'pending' | 'approved' | 'rejected' | 'modified';
    notes: string | null;
}

interface OptimizationMetrics {
    best_fitness: number;
    total_targets: number;
    assigned_count: number;
    generations_run: number;
    population_size: number;
    total_resources: number;
    elapsed_time_seconds: number;
    average_final_fitness: number;
}

interface StatusCounts {
    pending: number;
    approved: number;
    modified: number;
    rejected: number;
}

interface OptimizationData {
    job_id: string;
    status: string;
    metrics: OptimizationMetrics;
    assignments: Assignment[];
    pagination: { page: number; page_size: number; total_items: number; total_pages: number };
    status_counts: StatusCounts;
    fitness_history: number[];
    average_history: number[];
}

// ── Mini sub-components ───────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        modified: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold capitalize', styles[status] ?? 'bg-gray-100 text-gray-600')}>
            {status}
        </span>
    );
};

const MetricCard = ({ label, value, subtext, highlight }: { label: string; value: string | number; subtext?: string; highlight?: boolean }) => (
    <div className={cn('bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1', highlight && 'border-emerald-200 bg-emerald-50/30')}>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-end gap-1.5">
            <span className={cn('text-2xl font-bold tracking-tight', highlight ? 'text-emerald-600' : 'text-gray-900')}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {subtext && <span className="text-xs text-gray-400 mb-0.5">{subtext}</span>}
        </div>
    </div>
);

const FitnessChart = ({ fitnessHistory, averageHistory }: { fitnessHistory: number[]; averageHistory: number[] }) => {
    if (!fitnessHistory?.length) return null;
    const w = 560; const h = 160; const pad = 32;
    const maxVal = Math.max(...fitnessHistory, ...averageHistory);
    const minVal = Math.min(...fitnessHistory, ...averageHistory);
    const range = maxVal - minVal || 1;
    const gx = (i: number) => pad + (i / (fitnessHistory.length - 1 || 1)) * (w - 2 * pad);
    const gy = (v: number) => h - pad - ((v - minVal) / range) * (h - 2 * pad);
    const fitPath = fitnessHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i)} ${gy(v)}`).join(' ');
    const avgPath = averageHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i)} ${gy(v)}`).join(' ');
    return (
        <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-semibold">Fitness Convergence</span>
                <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-400"><span className="w-3 h-0.5 bg-emerald-400 inline-block" />Best</span>
                    <span className="flex items-center gap-1.5 text-gray-400"><span className="w-3 h-0.5 bg-gray-500 inline-block opacity-50" />Average</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
                {[0, 1, 2, 3].map(i => (
                    <line key={i} x1={pad} y1={pad + i * (h - 2 * pad) / 3} x2={w - pad} y2={pad + i * (h - 2 * pad) / 3} stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />
                ))}
                <path d={avgPath} fill="none" stroke="rgba(107,114,128,0.4)" strokeWidth="1.5" />
                <path d={fitPath} fill="none" stroke="#34d399" strokeWidth="2" />
                <path d={fitPath} fill="none" stroke="#34d399" strokeWidth="5" opacity="0.15" />
            </svg>
        </div>
    );
};

// ── Modify Assignment Modal ────────────────────────────────────────────────────

const ModifyModal = ({ isOpen, onClose, assignment, jobId, onSuccess }: {
    isOpen: boolean; onClose: () => void; assignment: Assignment | null; jobId: string; onSuccess: () => void;
}) => {
    const [newTargetId, setNewTargetId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    if (!isOpen || !assignment) return null;
    const handleModify = async () => {
        if (!newTargetId.trim() || !reason.trim()) return;
        setLoading(true);
        try {
            await resultsService.modifyAssignment(jobId, assignment.assignment_id, { newTargetId, reason });
            showToast.success('Modified', `Reassigned to target ${newTargetId}`);
            onSuccess(); onClose(); setNewTargetId(''); setReason('');
        } catch { showToast.error('Failed', 'Could not modify assignment.'); }
        finally { setLoading(false); }
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 bg-black/70 z-[70]" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-full max-w-md px-4">
                        <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl p-6">
                            <h2 className="text-base font-semibold text-blue-400 mb-1">Modify Assignment</h2>
                            <p className="text-sm text-gray-400 mb-5 flex items-center gap-2">
                                <span className="text-white font-medium">{assignment.resource.id}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                                <span>Target {assignment.target.id}</span>
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">New Target ID</label>
                                    <input type="text" placeholder="Enter new target ID..." value={newTargetId}
                                        onChange={e => setNewTargetId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Reason</label>
                                    <textarea placeholder="Why are you reassigning?" value={reason}
                                        onChange={e => setReason(e.target.value)} rows={3}
                                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none resize-none text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-5">
                                <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleModify} disabled={!newTargetId.trim() || !reason.trim() || loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Modify
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ── Results Panel ─────────────────────────────────────────────────────────────

const ResultsPanel = ({ jobId }: { jobId: string }) => {
    const [data, setData] = useState<OptimizationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [modifyOpen, setModifyOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const loadData = async (p = page) => {
        setIsLoading(true);
        try {
            const res = await resultsService.getResults(jobId, p, 50, true);
            setData(res as OptimizationData);
        } catch { /* keep existing data */ }
        finally { setIsLoading(false); }
    };

    useEffect(() => { if (jobId) loadData(); }, [jobId, page]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try { await resultsService.approveAssignment(jobId, id); showToast.success('Approved', ''); loadData(); }
        catch { showToast.error('Failed', 'Could not approve.'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        setActionLoading(id);
        try { await resultsService.rejectAssignment(jobId, id, reason); showToast.success('Rejected', ''); loadData(); }
        catch { showToast.error('Failed', 'Could not reject.'); }
        finally { setActionLoading(null); }
    };

    const handleApproveAll = async () => {
        setActionLoading('all');
        try {
            const r = await resultsService.approveAll(jobId);
            showToast.success('All Approved', `${r.approved_count} assignments approved.`); loadData();
        } catch { showToast.error('Failed', ''); }
        finally { setActionLoading(null); }
    };

    const handleExport = async () => {
        setActionLoading('export');
        try { await resultsService.downloadExportedCSV(jobId); showToast.success('Exported', ''); }
        catch { showToast.error('Export Failed', ''); }
        finally { setActionLoading(null); }
    };

    if (isLoading && !data) return (
        <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
        </div>
    );
    if (!data) return (
        <div className="flex-1 flex items-center justify-center text-gray-400">No optimization data.</div>
    );

    const { metrics, assignments = [], status_counts, fitness_history, average_history } = data;

    const filtered = assignments.filter(a => {
        const q = searchQuery.toLowerCase();
        return (q === '' || a.resource.id.toLowerCase().includes(q) || a.target.id.toLowerCase().includes(q))
            && (statusFilter === 'all' || a.approval_status === statusFilter);
    });

    const PER_PAGE = 10;
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="p-5 space-y-5">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricCard label="Assigned" value={metrics?.assigned_count ?? 0} subtext={`of ${metrics?.total_resources ?? 0}`} highlight />
                <MetricCard label="Target Pool" value={metrics?.total_targets ?? 0} />
                <MetricCard label="Best Fitness" value={metrics?.best_fitness ?? 0} />
                <MetricCard label="Generations" value={metrics?.generations_run ?? 0} />
                <MetricCard label="Time" value={`${(metrics?.elapsed_time_seconds ?? 0).toFixed(1)}s`} />
            </div>

            {/* Chart + status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <FitnessChart fitnessHistory={fitness_history ?? []} averageHistory={average_history ?? []} />
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Approval Status</h3>
                    {([
                        { label: 'Approved', count: status_counts?.approved ?? 0, color: 'bg-emerald-500' },
                        { label: 'Pending', count: status_counts?.pending ?? 0, color: 'bg-amber-500' },
                        { label: 'Rejected', count: status_counts?.rejected ?? 0, color: 'bg-red-500' },
                        { label: 'Modified', count: status_counts?.modified ?? 0, color: 'bg-blue-500' },
                    ] as const).map(item => (
                        <div key={item.label} className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', item.color)} />
                                <span className="text-sm text-gray-600">{item.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                        </div>
                    ))}
                    {status_counts && (
                        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                            {(() => {
                                const total = (status_counts.approved + status_counts.pending + status_counts.rejected + status_counts.modified) || 1;
                                return (
                                    <>
                                        <div className="bg-emerald-500 h-full" style={{ width: `${(status_counts.approved / total) * 100}%` }} />
                                        <div className="bg-amber-500 h-full" style={{ width: `${(status_counts.pending / total) * 100}%` }} />
                                        <div className="bg-red-500 h-full" style={{ width: `${(status_counts.rejected / total) * 100}%` }} />
                                        <div className="bg-blue-500 h-full" style={{ width: `${(status_counts.modified / total) * 100}%` }} />
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Assignments table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900 text-sm">Assignments ({filtered.length})</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" placeholder="Search…" value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none w-44" />
                        </div>
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none">
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="modified">Modified</option>
                        </select>
                        <button onClick={handleApproveAll} disabled={actionLoading === 'all'}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                            {actionLoading === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve All
                        </button>
                        <button onClick={handleExport} disabled={actionLoading === 'export'}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
                            {actionLoading === 'export' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Export
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="w-8 px-3 py-3"></th>
                                {['Resource ID', 'Target ID', 'Score', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.map(a => {
                                const isExpanded = expandedRow === a.assignment_id;
                                return (
                                    <React.Fragment key={a.assignment_id}>
                                        <tr className={cn('transition-colors', isExpanded ? 'bg-gray-50/80' : 'hover:bg-gray-50/50')}>
                                            <td className="px-3 py-2.5 w-8">
                                                <button
                                                    onClick={() => setExpandedRow(isExpanded ? null : a.assignment_id)}
                                                    title={isExpanded ? 'Hide rationale' : 'Show rationale'}
                                                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                                >
                                                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-2.5 text-sm font-medium text-[#2E2D2A] font-mono">{a.resource.id}</td>
                                            <td className="px-4 py-2.5 text-sm text-[#4A4945]">{a.target.id}</td>
                                            <td className="px-4 py-2.5 text-sm font-semibold text-emerald-700">{typeof a.score === 'number' ? a.score.toFixed(3) : a.score}</td>
                                            <td className="px-4 py-2.5"><StatusBadge status={a.approval_status} /></td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleApprove(a.assignment_id)} disabled={!!actionLoading}
                                                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 disabled:opacity-40" title="Approve">
                                                        {actionLoading === a.assignment_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => { setSelectedAssignment(a); setModifyOpen(true); }} disabled={!!actionLoading}
                                                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 disabled:opacity-40" title="Modify">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleReject(a.assignment_id)} disabled={!!actionLoading}
                                                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-40" title="Reject">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="px-6 pb-4 pt-2 bg-gray-50/60 border-b border-gray-100">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Why this pairing</p>
                                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                                {a.notes ?? `Resource ${a.resource.id} assigned to Target ${a.target.id}. Score reflects weighted objective function across all defined goals.`}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Match score</p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                                                                    <div
                                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                                                        style={{ width: `${Math.round((typeof a.score === 'number' ? a.score : 0) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-bold text-emerald-700 tabular-nums">
                                                                    {typeof a.score === 'number' ? a.score.toFixed(3) : a.score}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {paginated.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No assignments match your filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-medium text-gray-700">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ModifyModal isOpen={modifyOpen} onClose={() => { setModifyOpen(false); setSelectedAssignment(null); }}
                assignment={selectedAssignment} jobId={jobId} onSuccess={() => loadData()} />
        </div>
    );
};

// ── Processing view ───────────────────────────────────────────────────────────

const ProcessingView = ({ onCancel }: { onCancel: () => void }) => {
    const { logs, progress, sessionStatus, error } = useSessionStore();
    const latestLog = logs[logs.length - 1] ?? 'Initializing...';

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="relative">
                {sessionStatus === 'PROCESSING' && (
                    <>
                        <div className="absolute inset-0 bg-[#5c1427] blur-xl opacity-20 animate-pulse rounded-full" />
                        <Loader2 className="w-10 h-10 text-[#5c1427] animate-spin relative z-10" />
                    </>
                )}
                {sessionStatus === 'COMPLETED' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </motion.div>
                )}
                {sessionStatus === 'FAILED' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-12 h-12 text-red-500" />
                    </motion.div>
                )}
            </div>

            <div className="w-full max-w-md flex flex-col items-center gap-3">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        className={cn('h-full rounded-full', sessionStatus === 'FAILED' ? 'bg-red-400' : 'bg-gradient-to-r from-[#5c1427] to-[#9d2b4e]')}
                        initial={{ width: 0 }} animate={{ width: `${Math.max(3, progress)}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
                <div className="h-5 overflow-hidden flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                        <motion.p key={latestLog}
                            initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
                            className={cn('text-sm font-medium text-center', error ? 'text-red-500' : 'text-gray-500')}>
                            {error || latestLog}
                        </motion.p>
                    </AnimatePresence>
                </div>
                <p className="text-xs text-gray-400">{progress}% complete</p>
            </div>

            {sessionStatus === 'PROCESSING' && (
                <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    onClick={onCancel}
                    className="flex items-center gap-2 px-5 py-2 border border-red-200 rounded-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel Optimization
                </motion.button>
            )}
        </div>
    );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

interface OptimizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string | null;
    /** Job ID already started by the ML API (from a chat response) — skip the POST, just connect to SSE. */
    preexistingJobId?: string | null;
    /** Goals defined during the chat session — sent as config_override so the ML API has context. */
    goals?: any[];
    /** GA parameters defined during the chat session. */
    gaParams?: Record<string, any> | null;
}

const OptimizationModal: React.FC<OptimizationModalProps> = ({ isOpen, onClose, sessionId, preexistingJobId, goals, gaParams }) => {
    const { sessionStatus, jobId: storeJobId, setStatus, setJobId } = useSessionStore();
    const { startOptimization, cancelOptimization, connectToProgress, disconnect } = useSessionOrchestrator();

    const startedRef = useRef(false);

    // Trigger optimization (or reconnect) when the modal opens
    useEffect(() => {
        if (!isOpen) {
            startedRef.current = false;
            return;
        }
        if (startedRef.current) return;
        startedRef.current = true;

        const connect = (jId: string) => {
            setJobId(jId);
            setStatus('PROCESSING');
            connectToProgress(jId);
        };

        if (preexistingJobId) {
            // ML API already started a job from the chat flow — just attach to it
            connect(preexistingJobId);
            return;
        }

        if (storeJobId && (sessionStatus === 'PROCESSING' || sessionStatus === 'COMPLETED')) {
            // There's already an active job in the store — resume it
            if (sessionStatus === 'PROCESSING') connectToProgress(storeJobId);
            return;
        }

        // No known job ID — query for existing jobs on this session
        if (!sessionId) return;

        const configOverride = (goals && goals.length > 0)
            ? { goals, ga_params: gaParams ?? null }
            : undefined;

        axiosInstance.get(`/optimizations/jobs/${sessionId}`)
            .then(res => {
                const jobs: any[] = res.data?.jobs ?? res.data ?? [];
                const active = jobs.find((j: any) =>
                    ['pending', 'running', 'processing'].includes((j.status ?? '').toLowerCase())
                );
                if (active?.job_id) {
                    connect(active.job_id);
                } else {
                    startOptimization(sessionId, { configOverride });
                }
            })
            .catch(() => {
                startOptimization(sessionId, { configOverride });
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Disconnect SSE when modal closes (job keeps running server-side)
    const handleClose = () => {
        if (sessionStatus === 'PROCESSING') {
            disconnect();
        }
        onClose();
    };

    const handleCancel = () => {
        if (storeJobId) cancelOptimization(storeJobId);
    };

    const effectiveJobId = storeJobId ?? preexistingJobId ?? '';
    const isProcessing = sessionStatus === 'PROCESSING' || sessionStatus === 'CONFIGURING';
    const isCompleted = sessionStatus === 'COMPLETED';
    const isFailed = sessionStatus === 'FAILED';

    const statusLabel = isProcessing ? 'Running' : isCompleted ? 'Completed' : isFailed ? 'Failed' : 'Starting';
    const statusColor = isProcessing ? 'bg-amber-100 text-amber-700' : isCompleted ? 'bg-emerald-100 text-emerald-700' : isFailed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 24 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-5xl h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--brand-maroon)]/10 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-[var(--brand-maroon)]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Optimization</h2>
                                    {effectiveJobId && (
                                        <p className="text-[10px] text-gray-400 font-mono">{effectiveJobId}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', statusColor)}>
                                    {statusLabel}
                                </span>
                                <button onClick={handleClose}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                    title="Close">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                {isCompleted && effectiveJobId ? (
                                    <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <ResultsPanel jobId={effectiveJobId} />
                                    </motion.div>
                                ) : isFailed ? (
                                    <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex-1 flex flex-col items-center justify-center gap-4 p-8 min-h-[400px]">
                                        <XCircle className="w-12 h-12 text-red-400" />
                                        <p className="text-gray-600 text-sm text-center max-w-sm">
                                            The optimization job failed. You can try again or return to the chat to adjust your goals.
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={() => {
                                startedRef.current = false;
                                if (sessionId) {
                                    const configOverride = (goals && goals.length > 0)
                                        ? { goals, ga_params: gaParams ?? null }
                                        : undefined;
                                    startOptimization(sessionId, { configOverride });
                                }
                            }}
                                                className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-maroon)] hover:bg-[#7a1b35] text-white rounded-lg text-sm font-medium transition-colors">
                                                <RefreshCcw className="w-3.5 h-3.5" /> Retry
                                            </button>
                                            <button onClick={handleClose}
                                                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                                                Back to Chat
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex flex-col h-full min-h-[400px]">
                                        <ProcessingView onCancel={handleCancel} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer (only when complete) */}
                        {isCompleted && (
                            <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
                                <p className="text-xs text-gray-400">Review and approve the assignments above to finalise.</p>
                                <button onClick={handleClose}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                                    Back to Chat
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default OptimizationModal;
