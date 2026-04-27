import axiosInstance from '@/lib/axiosConfig';

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

export interface OptimizationMetrics {
    best_fitness: number;
    total_targets: number;
    assigned_count: number;
    generations_run: number;
    population_size: number;
    total_resources: number;
    elapsed_time_seconds: number;
    average_final_fitness: number;
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
     * Modify a single assignment (reassign to new target)
     */
    modifyAssignment: async (
        jobId: string,
        assignmentId: string,
        newTargetId: string,
        reason: string
    ): Promise<Assignment> => {
        const response = await axiosInstance.put(
            `/results/${jobId}/assignment/${assignmentId}/modify`,
            null,
            { params: { new_target_id: newTargetId, reason } }
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
        format: 'csv' | 'json' = 'csv',
        includeRejected: boolean = false
    ): Promise<Blob | object> => {
        const response = await axiosInstance.post(
            `/results/${jobId}/export`,
            null,
            {
                params: { format, include_rejected: includeRejected },
                responseType: format === 'csv' ? 'blob' : 'json'
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
    }
};

export default resultsService;
