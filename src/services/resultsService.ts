import axiosInstance from '@/lib/axiosConfig';
import { GoalDefinition } from '@/types/models';

// Types for Results Management API
export interface Assignment {
    assignment_id: string;
    resource: { id: string;[key: string]: any };
    target: { id: string;[key: string]: any };
    score: number;
    approval_status: 'pending' | 'approved' | 'rejected' | 'modified';
    notes: string | null;
    modified_at: string | null;
    modified_by: string | null;
}

export interface ParetoObjective {
    goal_description: string;
    value: number;
    display: string;
}

export interface ParetoOption {
    option_id: string;
    label: string;
    is_recommended?: boolean;
    objectives: ParetoObjective[];
}

export interface ParetoFront {
    options: ParetoOption[];
    /** Raw individuals before dedup by objective vector, e.g. 60 → 12 distinct trade-offs */
    population_size?: number;
}

export interface OptimizationMetrics {
    best_fitness: number;
    total_targets: number;
    assigned_count: number;
    generations_run: number;
    population_size: number;
    total_resources: number;
    elapsed_time_seconds: number;
    average_final_fitness: number;
    // ── Proof/confidence contract (proposed — optional until backend ships it) ──
    solver_used?: string;
    quality_state?: 'proven' | 'within_gap' | 'best_found';
    gap_percentage?: number | null;
    solver_badge?: string;
    routing_reason?: string | null;
    backup_solver?: string | null;
    fallback_solver?: string | null;
    license_cost?: number | null;
    comparison?: { speedup_x: number; label?: string } | null;
    bound_history?: number[];
}

export interface StatusCounts {
    pending: number;
    approved: number;
    modified: number;
    rejected: number;
}

export interface Pagination {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
}

export interface ResultsResponse {
    job_id: string;
    status: string;
    metrics: OptimizationMetrics;
    assignments: Assignment[];
    pagination: Pagination;
    status_counts: StatusCounts;
    fitness_history: number[];
    average_history: number[];
    optimization_status: string;
    /** Present only when the run's goals conflict — multi-objective / Pareto-optimal set. */
    pareto_front?: ParetoFront | null;
}

export interface SummaryResponse {
    job_id: string;
    status: string;
    metrics: OptimizationMetrics;
    status_counts: StatusCounts;
    optimization_status: string;
    finalized: boolean;
    finalized_at: string | null;
}

export interface BulkReviewAction {
    assignment_id: string;
    action: 'approve' | 'reject' | 'modify';
    notes?: string;
    reason?: string;
    new_target_id?: string;
}

export interface ExportOptions {
    format: 'csv' | 'json';
    include_rejected?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL, SPEC-GROUNDED RESULTS CONTRACT — source of truth: RESULTS_PAGE_DESIGN_SPEC.md
// (copied from the tested backend endpoint, not a mockup). Every field below is
// independently optional and OMITTED (never `null`) when the backend has nothing
// for it — "key absent" means "don't render this section," not an error.
// Kept fully separate from the speculative Pareto*/OptimizationMetrics types
// above (those are dormant/unused) to avoid any collision.
// ─────────────────────────────────────────────────────────────────────────────

export type TaskType = 'assignment' | 'routing' | 'scheduling' | 'budgeting';

export interface ResultsHeadlineItem {
    label: string;
    value: string;
    sub?: string;
}

export interface FairnessCheck {
    goal: string;
    status: 'pass' | 'fail' | 'not_evaluated';
    detail: string;
}

export interface ResultsGaps {
    coverage?: string | null;
    dataTrust?: string | null;
    fairnessIssues?: FairnessCheck[];
}

export interface GoalAttributionEntry {
    description: string;
    type: 'Reward' | 'Penalty';
    weightPct: number;
    avgRawValue: number;
    rawValueStdev: number;
    avgContribution: number;
    contributionSharePct: number;
    /** True means the goal never differentiated any assignment. */
    isDeadWeight: boolean;
    /** Capacity caps / shift-penalty modifiers — rawValueStdev: 0 here is by design, not dead weight. */
    isGlobalModifier: boolean;
    note: string;
}

export interface GoalAttribution {
    goals: GoalAttributionEntry[];
    assignmentsAnalyzed: number;
    deadWeightCount: number;
}

export interface BudgetCandidate {
    id: string;
    status: 'SELECTED' | 'REJECTED';
    value: number;
    cost: number;
    efficiency: number;
    group?: string | null;
    tier: 'A' | 'B' | 'C';
    tierLabel: string;
}

export interface BudgetGroup {
    group: string;
    candidateCount: number;
    fundedCount: number;
    fundedRate: number;
    avgEfficiency: number;
    totalValue: number;
    totalCost: number;
    recommendation: 'concentrate' | 'sufficient' | 'deprioritize';
}

export interface BudgetPriority {
    candidates: BudgetCandidate[];
    groups?: BudgetGroup[] | null;
}

export interface GeoNode {
    id: string;
    lat: number;
    lon: number;
}

export interface GeoData {
    nodes: GeoNode[];
    /** resource_id -> ordered target_id stops */
    stops: Record<string, string[]>;
}

export interface ResultsPayloadColumn {
    key: string;
    label: string;
}

export interface ResultsPayload {
    columns: ResultsPayloadColumn[];
    rows: Record<string, any>[];
}

export interface SensitivityItem {
    goal: string;
    perturbation_pct: number;
    holdsUnless: string;
}

export interface ScheduleTableRow {
    resource: string;
    /** Free-text shift labels, e.g. "Monday AM" — no real start/end datetimes exist yet. */
    shifts: string[];
}

export interface ScheduleTable {
    rows: ScheduleTableRow[];
}

export interface EnrichedResultsMetrics {
    // Emitted by the optimizer, not the enrichment layer — shape varies by
    // solver. Treat every field as optional; read what's there.
    assigned_count?: number;
    total_targets?: number;
    unassigned_targets?: number;
    coverage_pct?: number;
    solution_quality?: number;
    solver_used?: string;
    is_proven_optimal?: boolean;
    gap_percent?: number | null;
    degraded?: boolean;
    avg_fit_pct?: number;
    total_resources?: number;
    elapsed_time_seconds?: number;
    [key: string]: any;
}

export interface EnrichedResultsResponse {
    status: string;
    job_id: string;
    session_id: string;
    optimization_status: string;
    metrics: EnrichedResultsMetrics;
    /** Present only for multi-objective solves. Item shape isn't documented anywhere yet. */
    pareto_front?: unknown[] | null;
    status_counts: StatusCounts;
    pagination: Pagination;
    assignments: Assignment[];
    schedule_table?: ScheduleTable | null;
    fitness_history: number[];
    average_history: number[];
    created_at: string;
    goals_used?: GoalDefinition[];
    solver_used?: string;
    best_fitness?: number;
    ga_params_used?: Record<string, any>;

    // Dashboard enrichment — all optional, all omitted (never null) when absent
    entityLabels?: { resource: string; target: string };
    taskType?: TaskType;
    title?: string;
    context?: string;
    /** LLM-generated with a deterministic fallback — effectively always present once enrichment ran. */
    headline?: ResultsHeadlineItem[];
    executiveSummary?: string;
    taskExplanation?: string;
    rationale?: string[];
    gaps?: ResultsGaps;
    fairnessChecks?: FairnessCheck[];
    goalAttribution?: GoalAttribution;
    /** taskType === 'budgeting' only */
    budgetPriority?: BudgetPriority;
    /** taskType === 'routing' only */
    geo?: GeoData;
    payload?: ResultsPayload;
    scoreFormula?: string;
    sensitivity?: SensitivityItem[];
    validity?: string;
    dataTrust?: Record<string, any>;
    provenance?: { specVersion: string; solvedTurn: number };
    scenarioFrontier?: unknown;
}

// Results Management Service
export const resultsService = {
    /**
     * Get optimization results with assignments
     */
    getResults: async (
        jobId: string,
        page: number = 1,
        pageSize: number = 50,
        includeEnriched: boolean = true
    ): Promise<ResultsResponse> => {
        const response = await axiosInstance.get(`/results/${jobId}`, {
            params: { page, page_size: pageSize, include_enriched: includeEnriched }
        });
        // ML API returns the object directly (no .data wrapper)
        return response.data;
    },

    /**
     * Get optimization results typed against the real, spec-grounded contract
     * (RESULTS_PAGE_DESIGN_SPEC.md) — same endpoint as getResults, richer type.
     * Used by the /results/[jobId] full-page dashboard.
     */
    getEnrichedResults: async (
        jobId: string,
        page: number = 1,
        pageSize: number = 50
    ): Promise<EnrichedResultsResponse> => {
        const response = await axiosInstance.get(`/results/${jobId}`, {
            params: { page, page_size: pageSize, include_enriched: true }
        });
        return response.data;
    },

    /**
     * Get review queue with status filter
     */
    getReviewQueue: async (
        jobId: string,
        statusFilter: 'pending' | 'approved' | 'rejected' | 'modified' = 'pending',
        page: number = 1,
        pageSize: number = 20
    ): Promise<{ assignments: Assignment[]; pagination: Pagination }> => {
        const response = await axiosInstance.get(`/results/${jobId}/review`, {
            params: { status_filter: statusFilter, page, page_size: pageSize }
        });
        return response.data;
    },

    /**
     * Get optimization summary
     */
    getSummary: async (jobId: string): Promise<SummaryResponse> => {
        const response = await axiosInstance.get(`/results/${jobId}/summary`);
        return response.data;
    },

    /**
     * Get finalized results
     */
    getFinalized: async (
        jobId: string,
        includeRejected: boolean = false,
        page: number = 1,
        pageSize: number = 100
    ): Promise<{ assignments: Assignment[]; pagination: Pagination }> => {
        const response = await axiosInstance.get(`/results/${jobId}/final`, {
            params: { include_rejected: includeRejected, page, page_size: pageSize }
        });
        return response.data;
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // REVIEW ACTIONS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Approve a single assignment
     */
    approveAssignment: async (
        jobId: string,
        assignmentId: string,
        notes?: string
    ): Promise<Assignment> => {
        const response = await axiosInstance.put(
            `/results/${jobId}/assignment/${assignmentId}/approve`,
            null,
            { params: notes ? { notes } : undefined }
        );
        return response.data;
    },

    /**
     * Reject a single assignment
     */
    rejectAssignment: async (
        jobId: string,
        assignmentId: string,
        reason: string
    ): Promise<Assignment> => {
        const response = await axiosInstance.put(
            `/results/${jobId}/assignment/${assignmentId}/reject`,
            null,
            { params: { reason } }
        );
        return response.data;
    },

    /**
     * Modify a single assignment — reassign by target and/or resource.
     * Pass newTargetId, newResourceId, or both. Score recalculates server-side.
     */
    modifyAssignment: async (
        jobId: string,
        assignmentId: string,
        opts: { newTargetId?: string; newResourceId?: string; reason: string }
    ): Promise<Assignment> => {
        const params: Record<string, string> = { reason: opts.reason };
        if (opts.newTargetId) params.new_target_id = opts.newTargetId;
        if (opts.newResourceId) params.new_resource_id = opts.newResourceId;
        const response = await axiosInstance.put(
            `/results/${jobId}/assignment/${assignmentId}/modify`,
            null,
            { params }
        );
        return response.data;
    },

    /**
     * Approve all pending assignments
     */
    approveAll: async (jobId: string): Promise<{ approved_count: number }> => {
        const response = await axiosInstance.post(`/results/${jobId}/approve-all`);
        return response.data;
    },

    /**
     * Get a grounded, LLM-generated explanation for why a resource was assigned
     * to its target. Uses the full conversation + dataset context server-side.
     */
    explainAssignment: async (
        jobId: string,
        assignmentId: string,
        refresh = false
    ): Promise<{
        explanation: string;
        resource_name: string;
        target_name: string;
        score: number;
        score_breakdown?: Record<string, any> | null;
        grounded: boolean;
    }> => {
        const response = await axiosInstance.post(
            `/results/${jobId}/assignment/${assignmentId}/explain`,
            null,
            { params: refresh ? { refresh: true } : undefined }
        );
        return response.data;
    },

    /**
     * Commit to one option from a Pareto trade-off front — the run's goals conflicted,
     * so this finalizes the assignments for the chosen option.
     * NOTE: endpoint is a proposed contract, not yet confirmed on the backend.
     */
    selectParetoOption: async (
        jobId: string,
        optionId: string
    ): Promise<{ job_id: string; status: string }> => {
        const response = await axiosInstance.post(
            `/results/${jobId}/pareto-front/select`,
            { option_id: optionId }
        );
        return response.data;
    },

    /**
     * Bulk review multiple assignments
     */
    bulkReview: async (
        jobId: string,
        actions: BulkReviewAction[]
    ): Promise<{ processed: number; errors: any[] }> => {
        const response = await axiosInstance.post(`/results/${jobId}/bulk-review`, actions);
        return response.data;
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // FINALIZATION & EXPORT
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Finalize optimization results (lock for editing)
     */
    finalize: async (
        jobId: string,
        includeRejected: boolean = false
    ): Promise<{ finalized: boolean; finalized_at: string; total_approved: number }> => {
        const response = await axiosInstance.post(`/results/${jobId}/finalize`, null, {
            params: { include_rejected: includeRejected }
        });
        return response.data;
    },

    /**
     * Export results in specified format
     */
    exportResults: async (
        jobId: string,
        format: 'csv' | 'json' | 'xlsx' | 'ics' | 'pdf' = 'csv',
        includeRejected: boolean = false
    ): Promise<Blob | object> => {
        const response = await axiosInstance.post(
            `/results/${jobId}/export`,
            null,
            {
                params: { format, include_rejected: includeRejected },
                responseType: format === 'json' ? 'json' : 'blob'
            }
        );
        return response.data;
    },

    /**
     * Helper: Download exported CSV file
     */
    downloadExportedCSV: async (jobId: string, includeRejected: boolean = false): Promise<void> => {
        const blob = await resultsService.exportResults(jobId, 'csv', includeRejected) as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `optimization-results-${jobId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Helper: download any binary export format (xlsx/ics/pdf/csv) as a file.
     */
    downloadExport: async (
        jobId: string,
        format: 'csv' | 'xlsx' | 'ics' | 'pdf',
        includeRejected: boolean = false
    ): Promise<void> => {
        const blob = await resultsService.exportResults(jobId, format, includeRejected) as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `optimization-results-${jobId}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};

export default resultsService;
