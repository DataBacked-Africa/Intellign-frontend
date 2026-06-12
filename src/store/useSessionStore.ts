import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '@/lib/axiosConfig';

import {
    LogicConfig,
    GoalDefinitionPayload,
    ColumnMetadata,
    DatasetMetadata,
    FileMetadata,
    OptimizationResult,
    ChatShared
} from '@/types/models';

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

    // ── Speed-vs-quality preference (Fast / Balanced / Best) ───────────────────
    qualityMode: 'fast' | 'balanced' | 'best';

    // ── Live optimization metrics (streamed via SSE) ───────────────────────────
    liveMetrics: {
        currentGeneration: number;
        totalGenerations: number;
        bestFitness: number;
        averageFitness: number;
        coverage: number;           // live % of targets covered
        startedAt: number | null;   // epoch ms — for elapsed calc
    } | null;

    // ── Result data ───────────────────────────────────────────────────────────
    resultData: OptimizationResult | null;
    resourcesMetadata: DatasetMetadata | null;
    targetsMetadata: DatasetMetadata | null;

    // ── Goal definitions (manual/form-based, kept for GoalDefinitionForm) ─────
    goals: GoalDefinitionPayload;

    // ── Shared chat state (mirrored by useUnifiedChat; read by canvas/shell) ──
    chat: ChatShared;

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
    setLiveMetrics: (m: Partial<NonNullable<SessionState['liveMetrics']>>) => void;
    setQualityMode: (mode: 'fast' | 'balanced' | 'best') => void;
    addLog: (log: string) => void;
    setResult: (data: OptimizationResult) => void;
    setError: (error: string | null) => void;
    setGoals: (goals: GoalDefinitionPayload) => void;
    setChatShared: (partial: Partial<ChatShared>) => void;
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
        (set, get) => ({
            sessionId: null,
            jobId: null,
            newChatKey: 0,
            sessions: [],
            sessionStatus: 'IDLE',
            progress: 0,
            logs: [],
            error: null,
            qualityMode: 'best',
            liveMetrics: null,
            resultData: null,
            resourcesMetadata: null,
            targetsMetadata: null,
            goals: {},
            chat: {
                messages: [], dataContext: null, isGenerating: false,
                solverConfig: null, latestJobId: null, artifactCount: 0,
                phaseUiHint: null, goals: [], readyToRun: false,
            },
            sourceFile: null,
            schemaFile: null,
            schemaPreview: null,
            isUploadingRequest: false,

            setSessionId: (id) => set({ sessionId: id }),
            setJobId: (id) => set({ jobId: id }),
            setStatus: (status) => set({ sessionStatus: status }),
            setProgress: (progress) => set({ progress }),
            setQualityMode: (mode) => {
                set({ qualityMode: mode });
                // Persist the human-chosen mode to the session so a chat-triggered
                // run honours it too (not just the Run button). Non-blocking; the
                // /run payload still carries the mode regardless.
                const sid = get().sessionId;
                if (sid) {
                    axiosInstance
                        .post(`/optimizations/mode/${sid}`, { quality_mode: mode })
                        .catch(() => { /* best-effort; ignore */ });
                }
            },
            setLiveMetrics: (m) => set((state) => ({
                liveMetrics: {
                    currentGeneration: m.currentGeneration ?? state.liveMetrics?.currentGeneration ?? 0,
                    totalGenerations:  m.totalGenerations  ?? state.liveMetrics?.totalGenerations  ?? 0,
                    bestFitness:       m.bestFitness       ?? state.liveMetrics?.bestFitness       ?? 0,
                    averageFitness:    m.averageFitness    ?? state.liveMetrics?.averageFitness    ?? 0,
                    coverage:          m.coverage          ?? state.liveMetrics?.coverage          ?? 0,
                    startedAt:         m.startedAt         ?? state.liveMetrics?.startedAt         ?? null,
                },
            })),
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
            setChatShared: (partial) => set((state) => ({ chat: { ...state.chat, ...partial } })),
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
                    liveMetrics: null,
                    resultData: null,
                    resourcesMetadata: null,
                    targetsMetadata: null,
                    goals: {},
                    chat: {
                        messages: [], dataContext: null, isGenerating: false,
                        solverConfig: null, latestJobId: null, artifactCount: 0,
                        phaseUiHint: null, goals: [], readyToRun: false,
                    },
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
                    const response = await axiosInstance.get('/api/v1/me/sessions');
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
            name: 'intellign-session',
            storage: createJSONStorage(() => localStorage),
            // Persist only durable session state across reload/login (E).
            partialize: (state) => ({
                sessionId:         state.sessionId,
                jobId:             state.jobId,
                sessions:          state.sessions,
                goals:             state.goals,
                qualityMode:       state.qualityMode,
                resultData:        state.resultData,
                resourcesMetadata: state.resourcesMetadata,
                targetsMetadata:   state.targetsMetadata,
            }),
        }
    )
);
