import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '@/lib/axiosConfig';

export interface FileMetadata {
    url: string;
    publicId: string;
    originalName?: string; // API might not return this, but good to have
    format?: string;
    size?: number; // API returns meta.size, we might need to map
    createdAt?: string;
    meta?: {
        size: number;
        mimeType?: string;
    }
}

export interface SchemaPreview {
    columns: string[];
    // Add other analysis data if needed (e.g., data types, row counts)
}

export interface SessionSnapshot {
    sessionId: string; // Mapped from 'id'
    createdAt: string;
    status: 'OPTIMAL' | 'FAILED' | 'COMPLETED';
    resultData: OptimizationResult | null;
    resourcesMetadata: DatasetMetadata | null;
    targetsMetadata: DatasetMetadata | null;
    logs: string[];
    sourceFile?: FileMetadata;
    constraintsFile?: FileMetadata;
}

export interface LogicConfig {
    logic_type: string;
    aggregation_method: string | null;
    comparison_column: string | null;
    threshold_value: number | null;
    numeric_operator: string;
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
    }
}

// Updated Result Structure based on user JSON
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
    columns: ColumnMetadata[];
    preview: any[];
    type?: string;
}

export interface IngestionData {
    status: string;
    session_id: string;
    targets_metadata: DatasetMetadata;
    resources_metadata: DatasetMetadata;
}

export interface OptimizationResult {
    ingestion: IngestionData;
    // Optimization specific fields (optional for now as we focus on ingestion/planning)
    run_id?: string;
    status?: string;
    global_score?: number;
    iterations_run?: number;
    processing_time_ms?: number;
    resources_metadata?: DatasetMetadata; // Legacy/Direct mapping
    targets_metadata?: DatasetMetadata;   // Legacy/Direct mapping
    timeline?: Array<{
        generation: number;
        score: number;
    }>;
    allocations?: Array<{
        resource_id: string;
        target_id: string;
        score: number;
    }>;
    goal_analysis?: any[];
    anomalies_detected?: string[];
}

interface SessionState {
    sourceFile: FileMetadata | null;
    schemaFile: FileMetadata | null;
    schemaPreview: SchemaPreview | null;
    goals: GoalDefinitionPayload; // Stored goal definitions
    isUploadingRequest: boolean;

    // Session Orchestration State
    sessionId: string | null;
    sessionStatus: 'IDLE' | 'CONFIGURING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number; // 0 to 100
    // Live logs from the server
    logs: string[];
    resultData: OptimizationResult | null; // The final output (e.g., optimization plan)

    // Ingestion Metadata
    resourcesMetadata: DatasetMetadata | null;
    targetsMetadata: DatasetMetadata | null;

    error: string | null;

    // History
    sessions: SessionSnapshot[];

    // Actions
    setSourceFile: (file: FileMetadata | null) => void;
    setSchemaFile: (file: FileMetadata | null) => void;
    setSchemaPreview: (preview: SchemaPreview | null) => void;
    setGoals: (goals: GoalDefinitionPayload) => void;
    addGoal: (goalId: string, goal: GoalDefinitionPayload[string]) => void;
    removeGoal: (goalId: string) => void;
    updateGoal: (goalId: string, goal: Partial<GoalDefinitionPayload[string]>) => void;
    setUploading: (isUploading: boolean) => void;
    setSessionId: (id: string | null) => void;
    setStatus: (status: SessionState['sessionStatus']) => void;
    setProgress: (progress: number) => void;
    addLog: (log: string) => void;
    setResult: (data: OptimizationResult) => void;
    setError: (error: string | null) => void;
    clearSession: () => void;
    saveSession: () => void; // Keeps current session in history (local)
    loadSession: (sessionId: string) => void;
    fetchHistory: () => Promise<void>; // Fetch from API
    fetchSessionStatus: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            sourceFile: null,
            schemaFile: null,
            schemaPreview: null,
            goals: {},
            isUploadingRequest: false,
            sessionId: null,
            sessionStatus: 'IDLE',
            progress: 0,
            logs: [],
            resultData: null,
            resourcesMetadata: null,
            targetsMetadata: null,
            error: null,
            sessions: [],


            setSourceFile: (file) => set({ sourceFile: file }),
            setSchemaFile: (file) => set({ schemaFile: file }),
            setSchemaPreview: (preview) => set({ schemaPreview: preview }),
            setGoals: (goals) => set({ goals }),
            addGoal: (goalId, goal) => set((state) => ({
                goals: { ...state.goals, [goalId]: goal }
            })),
            removeGoal: (goalId) => set((state) => {
                const newGoals = { ...state.goals };
                delete newGoals[goalId];
                return { goals: newGoals };
            }),
            updateGoal: (goalId, goalUpdate) => set((state) => ({
                goals: {
                    ...state.goals,
                    [goalId]: {
                        ...state.goals[goalId],
                        ...goalUpdate,
                        logic_config: {
                            ...state.goals[goalId]?.logic_config,
                            ...(goalUpdate.logic_config || {})
                        }
                    }
                }
            })),
            setUploading: (isUploading) => set({ isUploadingRequest: isUploading }),
            setSessionId: (id) => set({ sessionId: id }),
            setStatus: (status) => set({ sessionStatus: status }),
            setProgress: (progress) => set({ progress }),
            addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
            setResult: (data) => set({
                resultData: data,
                resourcesMetadata: data.ingestion?.resources_metadata || data.resources_metadata || null,
                targetsMetadata: data.ingestion?.targets_metadata || data.targets_metadata || null
            }),
            setError: (error) => set({ error }),
            clearSession: () => set(() => ({
                sourceFile: null,
                schemaFile: null,
                goals: {},
                isUploadingRequest: false,
                sessionId: null,
                sessionStatus: 'IDLE',
                progress: 0,
                logs: [],
                resultData: null,
                resourcesMetadata: null,
                targetsMetadata: null,
                error: null
            })),
            saveSession: () => set((state) => {
                // Legacy local save - might not be needed if we rely on GET /sessions
                // But keeping it for immediate updates if needed
                if (!state.sessionId || !state.resultData) return {};
                // Avoid duplicates
                if (state.sessions.find(s => s.sessionId === state.sessionId)) return {};

                const snapshot: SessionSnapshot = {
                    sessionId: state.sessionId,
                    createdAt: new Date().toISOString(),
                    status: 'COMPLETED', // simplified
                    resultData: state.resultData,
                    resourcesMetadata: state.resultData.ingestion?.resources_metadata || state.resultData.resources_metadata || null,
                    targetsMetadata: state.resultData.ingestion?.targets_metadata || state.resultData.targets_metadata || null,
                    logs: state.logs,
                    sourceFile: state.sourceFile || undefined,
                    constraintsFile: state.schemaFile || undefined
                };
                return { sessions: [snapshot, ...state.sessions] };
            }),
            loadSession: (sessionId) => set((state) => {
                const session = state.sessions.find(s => s.sessionId === sessionId);
                if (!session) return {};
                return {
                    sessionId: session.sessionId,
                    sessionStatus: 'COMPLETED',
                    resultData: session.resultData,
                    resourcesMetadata: session.resultData?.ingestion?.resources_metadata || session.resultData?.resources_metadata || null,
                    targetsMetadata: session.resultData?.ingestion?.targets_metadata || session.resultData?.targets_metadata || null,
                    logs: session.logs || [],
                    progress: 100,
                    error: null,
                    sourceFile: session.sourceFile || null,
                    schemaFile: session.constraintsFile || null
                };
            }),
            fetchHistory: async () => {
                try {
                    const response = await axiosInstance.get('/sessions');
                    if (response.data.status === 'success') {
                        const history = response.data.data.map((item: any) => ({
                            sessionId: item.id,
                            createdAt: item.createdAt,
                            status: item.status,
                            resultData: item.resultData,
                            logs: [], // API doesn't seem to return logs in list view
                            sourceFile: item.sourceFile,
                            constraintsFile: item.constraintsFile
                        }));
                        set({ sessions: history });
                    }
                } catch (error) {
                    console.error("Failed to fetch session history:", error);
                }
            },
            fetchSessionStatus: async (sessionId: string) => {
                try {
                    const response = await axiosInstance.get(`/sessions/${sessionId}`);
                    if (response.data.status === 'success') {
                        const data = response.data.data; // this is the full object (session details)

                        // If the endpoint returns the standard session object:
                        // { id, status, resources_metadata, targets_metadata, ... }

                        // Build a normalized goals map from the DB array (each item has an id field)
                        const dbGoals = data.optimizationGoals;
                        const normalizedGoals: GoalDefinitionPayload = {};
                        if (Array.isArray(dbGoals) && dbGoals.length > 0) {
                            dbGoals.forEach((g: any) => {
                                const id = g.id || crypto.randomUUID();
                                normalizedGoals[id] = { ...g, id };
                            });
                        } else if (dbGoals && typeof dbGoals === 'object' && !Array.isArray(dbGoals) && Object.keys(dbGoals).length > 0) {
                            Object.assign(normalizedGoals, dbGoals);
                        }

                        // If DB status is PROCESSING but ingestion is already done,
                        // treat frontend status as CONFIGURING (goals step).
                        const ingestionDone =
                            data.resultData?.ingestion?.status === 'success' ||
                            !!data.resultData?.ingestion?.resources_metadata;
                        const frontendStatus =
                            data.status === 'PROCESSING' && ingestionDone
                                ? 'CONFIGURING'
                                : data.status;

                        set((state) => ({
                            sessionStatus: frontendStatus,
                            sessionId: data.session_id || data.id,
                            resultData: data.resultData,
                            resourcesMetadata: data.resultData?.ingestion?.resources_metadata || data.resultData?.resources_metadata || null,
                            targetsMetadata: data.resultData?.ingestion?.targets_metadata || data.resultData?.targets_metadata || null,
                            sourceFile: data.sourceFile,
                            schemaFile: data.constraintsFile,
                            // Only overwrite local goals if DB has goals; keep local if DB is empty
                            goals: Object.keys(normalizedGoals).length > 0 ? normalizedGoals : state.goals,
                        }));

                        // Force progress to 100 if we are in a post-processing state
                        if (['CONFIGURING', 'COMPLETED'].includes(data.status)) {
                            set({ progress: 100 });
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch session status:", error);
                }
            }
        }),
        {
            name: 'ingestion-session-storage',
            storage: createJSONStorage(() => sessionStorage), // Clears when tab closes
        }
    )
);
