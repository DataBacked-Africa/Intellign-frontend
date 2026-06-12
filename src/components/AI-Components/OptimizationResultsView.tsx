"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/useSessionStore';
import { resultsService } from '@/services/resultsService';
import { showToast } from '@/components/ui/CustomToast';
import {
    Users, Target, TrendingUp, Layers, CheckCircle2, Clock, XCircle, Edit3,
    Search, Filter, ChevronLeft, ChevronRight, Check, X, Download, ArrowRight, Loader2
} from 'lucide-react';

// Types for the optimization data
interface Assignment {
    assignment_id: string;
    resource: { id: string };
    target: { id: string };
    score: number;
    approval_status: 'pending' | 'approved' | 'rejected' | 'modified';
    notes: string | null;
    modified_at: string | null;
    modified_by: string | null;
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
    degraded?: boolean;                    // primary solver failed; fallback produced this result
    fallback_errors?: string[] | null;
    is_synthetic?: boolean;
}

interface OptimizationData {
    job_id: string;
    status: string;
    metrics: OptimizationMetrics;
    assignments: Assignment[];
    pagination: {
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
    };
    status_counts: {
        pending: number;
        approved: number;
        modified: number;
        rejected: number;
    };
    fitness_history: number[];
    average_history: number[];
    optimization_status: string;
}

// Metric Card Component
const MetricCard = ({ label, value, subtext, icon: Icon, highlight }: {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: any;
    highlight?: boolean;
}) => (
    <div className={cn(
        "bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-1",
        highlight && "border-emerald-200 bg-emerald-50/30"
    )}>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-end gap-2">
            <span className={cn(
                "text-3xl font-bold tracking-tight",
                highlight ? "text-emerald-600" : "text-gray-900"
            )}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {subtext && <span className="text-sm text-gray-400 mb-1">{subtext}</span>}
        </div>
    </div>
);

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        modified: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
            styles[status] || 'bg-gray-100 text-gray-600'
        )}>
            {status}
        </span>
    );
};

// Simple Line Chart (SVG-based)
const FitnessChart = ({ fitnessHistory, averageHistory }: { fitnessHistory: number[], averageHistory: number[] }) => {
    if (!fitnessHistory || fitnessHistory.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = 40;

    const maxVal = Math.max(...fitnessHistory, ...averageHistory);
    const minVal = Math.min(...fitnessHistory, ...averageHistory);
    const range = maxVal - minVal || 1;

    const getX = (index: number) => padding + (index / (fitnessHistory.length - 1)) * (width - 2 * padding);
    const getY = (value: number) => height - padding - ((value - minVal) / range) * (height - 2 * padding);

    const fitnessPath = fitnessHistory.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
    const averagePath = averageHistory.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');

    return (
        <div className="w-full bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Fitness Convergence</h3>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-emerald-400"></span>
                        <span className="text-gray-400">Best</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-gray-500 opacity-50"></span>
                        <span className="text-gray-400">Average</span>
                    </div>
                </div>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + i * (height - 2 * padding) / 4}
                        x2={width - padding}
                        y2={padding + i * (height - 2 * padding) / 4}
                        stroke="rgba(255,255,255,0.1)"
                        strokeDasharray="4"
                    />
                ))}
                {/* Average line */}
                <path d={averagePath} fill="none" stroke="rgba(107, 114, 128, 0.5)" strokeWidth="2" />
                {/* Fitness line */}
                <path d={fitnessPath} fill="none" stroke="#34d399" strokeWidth="2.5" />
                {/* Glow effect */}
                <path d={fitnessPath} fill="none" stroke="#34d399" strokeWidth="6" opacity="0.2" />
            </svg>
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
                <span>Gen 1</span>
                <span>Gen {Math.floor(fitnessHistory.length / 2)}</span>
                <span>Gen {fitnessHistory.length}</span>
            </div>
        </div>
    );
};

// Approval Status Sidebar
const ApprovalStatusPanel = ({ statusCounts }: { statusCounts: { pending: number; approved: number; modified: number; rejected: number } }) => {
    const total = statusCounts.pending + statusCounts.approved + statusCounts.modified + statusCounts.rejected;
    const items = [
        { label: 'Approved', count: statusCounts.approved, color: 'bg-emerald-500', icon: CheckCircle2 },
        { label: 'Pending', count: statusCounts.pending, color: 'bg-amber-500', icon: Clock },
        { label: 'Rejected', count: statusCounts.rejected, color: 'bg-red-500', icon: XCircle },
        { label: 'Modified', count: statusCounts.modified, color: 'bg-blue-500', icon: Edit3 },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Approval Status</h3>
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", item.color)}></span>
                            <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                    </div>
                ))}
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                {total > 0 && (
                    <>
                        <div className="bg-emerald-500 h-full" style={{ width: `${(statusCounts.approved / total) * 100}%` }} />
                        <div className="bg-amber-500 h-full" style={{ width: `${(statusCounts.pending / total) * 100}%` }} />
                        <div className="bg-red-500 h-full" style={{ width: `${(statusCounts.rejected / total) * 100}%` }} />
                        <div className="bg-blue-500 h-full" style={{ width: `${(statusCounts.modified / total) * 100}%` }} />
                    </>
                )}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Approved {statusCounts.approved}</span>
                <span>Pending {statusCounts.pending}</span>
            </div>
        </div>
    );
};

// Modify Assignment Modal Component
const ModifyAssignmentModal = ({
    isOpen,
    onClose,
    assignment,
    jobId,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
    jobId: string;
    onSuccess: () => void;
}) => {
    const [newTargetId, setNewTargetId] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !assignment) return null;

    const handleModify = async () => {
        if (!newTargetId.trim() || !reason.trim()) return;

        setIsLoading(true);
        try {
            await resultsService.modifyAssignment(
                jobId,
                assignment.assignment_id,
                newTargetId,
                reason
            );
            showToast.success('Assignment Modified', `Reassigned to target ${newTargetId}`);
            onSuccess();
            onClose();
            setNewTargetId('');
            setReason('');
        } catch (error) {
            showToast.error('Failed to Modify', 'Could not modify the assignment.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl p-6">
                            {/* Header */}
                            <h2 className="text-lg font-semibold text-blue-400 mb-1">Modify Assignment</h2>
                            <p className="text-sm text-gray-400 mb-6 flex items-center gap-2">
                                <span className="text-white font-medium">{assignment.resource.id}</span>
                                <ArrowRight className="w-4 h-4 text-gray-500" />
                                <span>currently assigned to Target {assignment.target.id}</span>
                            </p>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        New Target ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter new target ID..."
                                        value={newTargetId}
                                        onChange={(e) => setNewTargetId(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        Reason
                                    </label>
                                    <textarea
                                        placeholder="Why are you reassigning?"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModify}
                                    disabled={!newTargetId.trim() || !reason.trim() || isLoading}
                                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Modify
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Main Component
const OptimizationResultsView = () => {
    const { resultData, jobId: storeJobId, chat } = useSessionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sortKey, setSortKey] = useState<'resource' | 'target' | 'score' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Debounce the search so 1000-row filters don't run per keystroke.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const toggleSort = (key: 'resource' | 'target' | 'score') => {
        if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir(key === 'score' ? 'desc' : 'asc'); }
    };
    const ariaSort = (key: string): 'ascending' | 'descending' | 'none' =>
        sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [modifyModalOpen, setModifyModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Local state for optimization data (fetched from API for freshness)
    const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);

    // Prefer jobId from the store (set when optimization run returns job_id)
    const storeOptimization = (resultData as any)?.optimization as OptimizationData | undefined;
    const jobId = storeJobId || optimizationData?.job_id || storeOptimization?.job_id || '';

    // Fetch fresh data from API
    const fetchOptimizationData = useCallback(async () => {
        if (!jobId) return;

        setIsLoading(true);
        try {
            const data = await resultsService.getResults(jobId, currentPage, 50, true);
            console.log('Optimization data:', data);
            setOptimizationData(data);
        } catch (error) {
            console.error('Failed to fetch optimization data:', error);
            // Fall back to store data if API fails
            if (storeOptimization) {
                setOptimizationData(storeOptimization);
            }
        } finally {
            setIsLoading(false);
        }
    }, [jobId, currentPage, storeOptimization]);

    // Initial load: use store data, then fetch fresh data
    useEffect(() => {
        if (storeOptimization && !optimizationData) {
            setOptimizationData(storeOptimization);
        }
    }, [storeOptimization, optimizationData]);

    // Fetch fresh data when jobId is available or page changes
    useEffect(() => {
        if (jobId) {
            fetchOptimizationData();
        }
    }, [jobId, currentPage]);

    const refreshData = useCallback(() => {
        fetchOptimizationData();
    }, [fetchOptimizationData]);

    const openModifyModal = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setModifyModalOpen(true);
    };

    const closeModifyModal = () => {
        setModifyModalOpen(false);
        setSelectedAssignment(null);
    };

    // Action Handlers
    const handleApprove = async (assignmentId: string) => {
        if (!jobId) return;
        setActionLoading(assignmentId);
        try {
            await resultsService.approveAssignment(jobId, assignmentId);
            showToast.success('Approved', 'Assignment has been approved.');
            refreshData();
        } catch (error) {
            showToast.error('Failed', 'Could not approve assignment.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (assignmentId: string) => {
        if (!jobId) return;
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setActionLoading(assignmentId);
        try {
            await resultsService.rejectAssignment(jobId, assignmentId, reason);
            showToast.success('Rejected', 'Assignment has been rejected.');
            refreshData();
        } catch (error) {
            showToast.error('Failed', 'Could not reject assignment.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveAll = async () => {
        if (!jobId) return;
        setActionLoading('approve-all');
        try {
            const result = await resultsService.approveAll(jobId);
            showToast.success('All Approved', `${result.approved_count} assignments approved.`);
            refreshData();
        } catch (error) {
            showToast.error('Failed', 'Could not approve all assignments.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExport = async () => {
        if (!jobId) return;
        setActionLoading('export');
        try {
            await resultsService.downloadExportedCSV(jobId);
            showToast.success('Exported', 'Results downloaded successfully.');
        } catch (error) {
            showToast.error('Export Failed', 'Could not export results.');
        } finally {
            setActionLoading(null);
        }
    };

    // Show loading state or empty state
    if (!optimizationData && isLoading) {
        return (
            <div className="w-full flex items-center justify-center p-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading optimization data...
            </div>
        );
    }

    if (!optimizationData) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-12 gap-4 text-center">
                <Target className="w-10 h-10 text-gray-300" />
                <div>
                    <p className="text-sm font-semibold text-gray-600">No results yet</p>
                    <p className="text-xs text-gray-400 mt-1">Run an optimization to view the results dashboard.</p>
                </div>
                <button
                    disabled={!chat?.readyToRun}
                    onClick={async () => {
                        const sid = useSessionStore.getState().sessionId;
                        if (!sid) return;
                        try {
                            const axios = (await import('@/lib/axiosConfig')).default;
                            const res = await axios.post(`/optimizations/run/${sid}`, { quality_mode: useSessionStore.getState().qualityMode, auto_approve: false });
                            if (res.data?.job_id) {
                                useSessionStore.getState().setJobId(res.data.job_id);
                                useSessionStore.getState().setStatus('PROCESSING');
                                showToast.success('Optimization Started', 'Running the engine...');
                            }
                        } catch {
                            showToast.error('Run failed', 'Could not start the optimization.');
                        }
                    }}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {chat?.readyToRun ? 'Run optimization' : 'Run optimization (waiting for data/goals)'}
                </button>
            </div>
        );
    }

    const { metrics, assignments, status_counts, fitness_history, average_history, pagination } = optimizationData;

    // Filter assignments
    const filteredAssignments = assignments?.filter(a => {
        const matchesSearch = debouncedQuery === '' ||
            a.resource.id.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            a.target.id.toLowerCase().includes(debouncedQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.approval_status === statusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    if (sortKey) {
        filteredAssignments.sort((a, b) => {
            const av = sortKey === 'score' ? a.score : sortKey === 'resource' ? a.resource.id : a.target.id;
            const bv = sortKey === 'score' ? b.score : sortKey === 'resource' ? b.resource.id : b.target.id;
            const cmp = typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
    const paginatedAssignments = filteredAssignments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="w-full space-y-6 p-4 md:p-6">
            {/* Degraded-result banner — fallback solver produced this result */}
            {metrics?.degraded && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <div className="flex-1">
                        <span className="font-semibold">Approximate result: </span>
                        <span>
                            the primary solver was unavailable, so a fallback method
                            {(metrics as any)?.solver_used ? ` (${(metrics as any).solver_used})` : ''} produced these
                            assignments. Valid but may not be optimal.
                        </span>
                    </div>
                    <button
                        onClick={async () => {
                            const sid = useSessionStore.getState().sessionId;
                            if (!sid) return;
                            try {
                                const { useSessionOrchestrator } = await import('@/hooks/useSessionOrchestrator');
                                // Hook can't be called here — post directly with best mode.
                                const axios = (await import('@/lib/axiosConfig')).default;
                                const res = await axios.post(`/optimizations/run/${sid}`, { quality_mode: 'best', auto_approve: false });
                                if (res.data?.job_id) {
                                    useSessionStore.getState().setJobId(res.data.job_id);
                                    useSessionStore.getState().setStatus('PROCESSING');
                                    showToast.success('Re-running', 'Started a fresh run with the best solver.');
                                }
                            } catch {
                                showToast.error('Re-run failed', 'Could not start a new run.');
                            }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors shrink-0 cursor-pointer">
                        Re-run with best
                    </button>
                </div>
            )}
            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard
                    label="Resources Assigned"
                    value={metrics?.assigned_count || 0}
                    subtext={`of ${metrics?.total_resources || 0} total`}
                    highlight
                />
                <MetricCard
                    label="Target Pool Size"
                    value={metrics?.total_targets || 0}
                    subtext="available"
                />
                <MetricCard
                    label="Best Fitness"
                    value={metrics?.best_fitness || 0}
                />
                <MetricCard
                    label="Generations"
                    value={metrics?.generations_run || 0}
                    subtext="completed"
                />
                <MetricCard
                    label="Processing Time"
                    value={`${(metrics?.elapsed_time_seconds || 0).toFixed(2)}s`}
                />
            </div>

            {/* Chart + Status Panel Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <FitnessChart
                        fitnessHistory={fitness_history || []}
                        averageHistory={average_history || []}
                    />
                </div>
                <div>
                    <ApprovalStatusPanel statusCounts={status_counts || { pending: 0, approved: 0, modified: 0, rejected: 0 }} />
                </div>
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        Assignments ({filteredAssignments.length})
                        {metrics?.is_synthetic && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium">synthetic</span>
                        )}
                    </h3>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search ID, target, resource..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-0 outline-none w-64"
                            />
                        </div>
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-0 outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="modified">Modified</option>
                        </select>
                        {/* Actions */}
                        <button
                            onClick={handleApproveAll}
                            disabled={actionLoading === 'approve-all'}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'approve-all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Approve All Pending
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={actionLoading === 'export'}
                            className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'export' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {([['resource', 'Resource ID'], ['target', 'Target ID'], ['score', 'Score']] as const).map(([key, label]) => (
                                    <th key={key} aria-sort={ariaSort(key)}
                                        className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                                        <button onClick={() => toggleSort(key)}
                                            className="inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer hover:text-gray-800 transition-colors">
                                            {label}
                                            <span aria-hidden="true" className="text-[10px]">
                                                {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                                            </span>
                                        </button>
                                    </th>
                                ))}
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedAssignments.map((assignment) => (
                                <tr key={assignment.assignment_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">{assignment.resource.id}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-600">{assignment.target.id}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-semibold text-emerald-600">{assignment.score}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={assignment.approval_status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleApprove(assignment.assignment_id)}
                                                disabled={actionLoading === assignment.assignment_id}
                                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
                                                title="Approve"
                                            >
                                                {actionLoading === assignment.assignment_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => openModifyModal(assignment)}
                                                disabled={actionLoading === assignment.assignment_id}
                                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50"
                                                title="Modify"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(assignment.assignment_id)}
                                                disabled={actionLoading === assignment.assignment_id}
                                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-3">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modify Assignment Modal */}
            <ModifyAssignmentModal
                isOpen={modifyModalOpen}
                onClose={closeModifyModal}
                assignment={selectedAssignment}
                jobId={jobId}
                onSuccess={refreshData}
            />
        </div>
    );
};

export default OptimizationResultsView;
