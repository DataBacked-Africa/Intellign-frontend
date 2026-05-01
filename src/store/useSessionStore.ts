import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '@/lib/axiosConfig';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface LogicConfig {
    logic_type: string;
    aggregation_method?: string | null;
    comparison_column?: string | null;
    threshold_value?: number | null;
    numeric_operator?: string;
    mapping_rules?: Record<string, string[]> | null;
    exact_match?: boolean;
    max_distance_value?: number | null;
    distance_unit?: string;
    minimize_distance?: boolean;
    set_operation?: string | null;
    min_intersection_size?: number;
    time_unit?: string;
    buffer_time?: number;
    scoring_rules?: Record<string, number> | null;
    value_splitter?: string | null;
}

export interface GoalDefinitionPayload {
    [goalId: string]: {
        id: string;
        description: string;
        resource_columns: string[];
        target_columns: string[];
        logic_config: LogicConfig;
        weight: number;
        award_type: 'Reward' | 'Penalty';
        logic_primitive: string | null;
    };
}

export interface ColumnMetadata {
    column_name: string;
    data_type: string;
    is_nullable: boolean;
    unique_values_count?: number | null;
    sample_values: any[];
    min_value?: number | null;
    max_value?: number | null;
}

export interface DatasetMetadata {
    count: number;
    columns: string[];
    preview?: any[];
    type?: string;
}

// Legacy export kept for components that import it
export interface FileMetadata {
    url?: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    size?: number;
}

// Matches the shape returned by GET /results/{job_id}
export interface OptimizationResult {
    job_id?: string;
    session_id?: string;
    status?: string;
    optimization_status?: string;
    metrics?: {
        total_resources?: number;
        total_targets?: number;
        assigned_targets?: number;
        unassigned_targets?: number;
        average_distance?: number;
        max_distance?: number;
        min_distance?: number;
        average_targets_per_resource?: number;
        workload_std_dev?: number;
        total_fitness_score?: number;
        best_fitness?: number;
        assigned_count?: number;
        generations_run?: number;
        population_size?: number;
        elapsed_time_seconds?: number;
        average_final_fitness?: number;
    };
    status_counts?: {
        pending: number;
        approved: number;
        rejected: number;
        modified: number;
    };
    assignments?: any[];
    pagination?: {
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
    };
    fitness_history?: number[];
    average_history?: number[];
    created_at?: string;
    // Legacy ingestion shape (kept for backward compat)
    ingestion?: {
        status: string;
        session_id: string;
        resources_metadata?: DatasetMetadata;
        targets_metadata?: DatasetMetadata;
    };
    resources_metadata?: DatasetMetadata;
    targets_metadata?: DatasetMetadata;
}

interface SessionState {
    // ── Core identifiers ──────────────────────────────────────────────────────
    sessionId: string | null;
    jobId: string | null;
    /** Incremented on every clearSession — used as a React key to force wizard remount */
    newChatKey: number;

    // ── Status ────────────────────────────────────────────────────────────────
    sessionStatus: 'IDLE' | 'CONFIGURING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    logs: string[];
    error: string | null;

    // ── Result data ───────────────────────────────────────────────────────────
    resultData: OptimizationResult | null;
    resourcesMetadata: DatasetMetadata | null;
    targetsMetadata: DatasetMetadata | null;

    // ── Goal definitions (manual/form-based, kept for GoalDefinitionForm) ─────
    goals: GoalDefinitionPayload;

    // ── Legacy file references (kept for UI compatibility) ────────────────────
    sourceFile: any | null;
    schemaFile: any | null;
    schemaPreview: { columns: string[] } | null;
    isUploadingRequest: boolean;

    // ── Actions ───────────────────────────────────────────────────────────────
    setSessionId: (id: string | null) => void;
    setJobId: (id: string | null) => void;
    setStatus: (status: SessionState['sessionStatus']) => void;
    setProgress: (progress: number) => void;
    addLog: (log: string) => void;
    setResult: (data: OptimizationResult) => void;
    setError: (error: string | null) => void;
    setGoals: (goals: GoalDefinitionPayload) => void;
    addGoal: (goalId: string, goal: GoalDefinitionPayload[string]) => void;
    removeGoal: (goalId: string) => void;
    updateGoal: (goalId: string, goal: Partial<GoalDefinitionPayload[string]>) => void;
    setSourceFile: (file: any | null) => void;
    setSchemaFile: (file: any | null) => void;
    setSchemaPreview: (preview: { columns: string[] } | null) => void;
    setUploading: (isUploading: boolean) => void;
    clearSession: () => void;
    sessions: { sessionId: string; createdAt: string; name?: string }[];
    removeSession: (sessionId: string) => void;
    // Stubs kept so existing components don't break at import time
    saveSession: () => void;
    loadSession: (sessionId: string) => void;
    fetchHistory: () => Promise<void>;
    fetchSessionStatus: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            sessionId: null,
            jobId: null,
            newChatKey: 0,
            sessions: [],
            sessionStatus: 'IDLE',
            progress: 0,
            logs: [],
            error: null,
            resultData: null,
            resourcesMetadata: null,
            targetsMetadata: null,
            goals: {},
            sourceFile: null,
            schemaFile: null,
            schemaPreview: null,
            isUploadingRequest: false,

            setSessionId: (id) => set({ sessionId: id }),
            setJobId: (id) => set({ jobId: id }),
            setStatus: (status) => set({ sessionStatus: status }),
            setProgress: (progress) => set({ progress }),
            addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

            setResult: (data) => set({
                resultData: data,
                resourcesMetadata:
                    (data.ingestion?.resources_metadata as DatasetMetadata | undefined)
                    ?? data.resources_metadata
                    ?? null,
                targetsMetadata:
                    (data.ingestion?.targets_metadata as DatasetMetadata | undefined)
                    ?? data.targets_metadata
                    ?? null,
            }),

            setError: (error) => set({ error }),

            setGoals: (goals) => set({ goals }),
            addGoal: (goalId, goal) =>
                set((state) => ({ goals: { ...state.goals, [goalId]: goal } })),
            removeGoal: (goalId) =>
                set((state) => {
                    const next = { ...state.goals };
                    delete next[goalId];
                    return { goals: next };
                }),
            updateGoal: (goalId, goalUpdate) =>
                set((state) => ({
                    goals: {
                        ...state.goals,
                        [goalId]: {
                            ...state.goals[goalId],
                            ...goalUpdate,
                            logic_config: {
                                ...state.goals[goalId]?.logic_config,
                                ...(goalUpdate.logic_config ?? {}),
                            },
                        },
                    },
                })),

            setSourceFile: (file) => set({ sourceFile: file }),
            setSchemaFile: (file) => set({ schemaFile: file }),
            setSchemaPreview: (preview) => set({ schemaPreview: preview }),
            setUploading: (isUploading) => set({ isUploadingRequest: isUploading }),

            clearSession: () =>
                set((state) => ({
                    sessionId: null,
                    jobId: null,
                    newChatKey: state.newChatKey + 1,
                    // sessions list is intentionally preserved — it belongs to the sidebar, not the active session
                    sessionStatus: 'IDLE',
                    progress: 0,
                    logs: [],
                    error: null,
                    resultData: null,
                    resourcesMetadata: null,
                    targetsMetadata: null,
                    goals: {},
                    sourceFile: null,
                    schemaFile: null,
                    schemaPreview: null,
                    isUploadingRequest: false,
                })),

            removeSession: (sessionId) =>
                set((state) => ({
                    sessions: state.sessions.filter(s => s.sessionId !== sessionId),
                })),

            saveSession: () => {},
            loadSession: (_sessionId: string) => {},

            fetchHistory: async () => {
                try {
                    const response = await axiosInstance.get('/sessions');
                    const raw = response.data?.data ?? response.data ?? [];
                    const history = (Array.isArray(raw) ? raw : []).map((item: any) => ({
                        sessionId: item.id ?? item.sessionId,
                        createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
                        name: item.name ?? undefined,
                    })).filter((s: any) => !!s.sessionId);
                    set({ sessions: history });
                } catch {
                    // silently ignore — unauthenticated users just see an empty sidebar
                }
            },

            fetchSessionStatus: async (_sessionId: string) => {},
        }),
        {
            name: 'ingestion-session-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
