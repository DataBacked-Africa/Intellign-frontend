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
    }
}

export interface SessionSnapshot {
    sessionId: string; // Mapped from 'id'
    createdAt: string;
    status: 'OPTIMAL' | 'FAILED' | 'COMPLETED';
    resultData: OptimizationResult | null;
    logs: string[];
    sourceFile?: FileMetadata;
    constraintsFile?: FileMetadata;
}

// Union type for the two different result structures
export type OptimizationResult = ComplexOptimizationResult | SimpleOptimizationResult;

export interface ComplexOptimizationResult {
    status?: "OPTIMAL" | "FAILED"; // Optional because simple result doesn't have it
    convergence_score: number;
    iterations_run: number;
    processing_time_ms: number;
    resources_allocated: Array<{
        id: string;
        target: string;
        amount: number;
        efficiency: number;
    }>;
    timeline_data: Array<{
        gen: number;
        score: number;
    }>;
    anomalies_detected: string[];
}

export interface SimpleOptimizationResult {
    score: number;
    feedback: string;
    timestamp: string;
    optimized_allocation: Array<{
        category: string;
        percentage: number;
    }>;
    // Discriminator to distinguish? Usually checking properties is enough.
}

interface SessionState {
    sourceFile: FileMetadata | null;
    schemaFile: FileMetadata | null;
    isUploadingRequest: boolean;

    // Session Orchestration State
    sessionId: string | null;
    sessionStatus: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number; // 0 to 100
    // Live logs from the server
    logs: string[];
    resultData: OptimizationResult | null; // The final output (e.g., optimization plan)
    error: string | null;

    // History
    sessions: SessionSnapshot[];

    // Actions
    setSourceFile: (file: FileMetadata | null) => void;
    setSchemaFile: (file: FileMetadata | null) => void;
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
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            sourceFile: null,
            schemaFile: null,
            isUploadingRequest: false,
            sessionId: null,
            sessionStatus: 'IDLE',
            progress: 0,
            logs: [],
            resultData: null,
            error: null,
            sessions: [],


            setSourceFile: (file) => set({ sourceFile: file }),
            setSchemaFile: (file) => set({ schemaFile: file }),
            setUploading: (isUploading) => set({ isUploadingRequest: isUploading }),
            setSessionId: (id) => set({ sessionId: id }),
            setStatus: (status) => set({ sessionStatus: status }),
            setProgress: (progress) => set({ progress }),
            addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
            setResult: (data) => set({ resultData: data }),
            setError: (error) => set({ error }),
            clearSession: () => set((state) => {
                // We rely on backend history now, but local state reset is needed
                return {
                    sourceFile: null,
                    schemaFile: null,
                    isUploadingRequest: false,
                    sessionId: null,
                    sessionStatus: 'IDLE',
                    progress: 0,
                    logs: [],
                    resultData: null,
                    error: null,
                    // sessions: newSessions // Don't modify sessions on clear, they are fetched
                };
            }),
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
                    logs: state.logs,
                    sourceFile: state.sourceFile!,
                    constraintsFile: state.schemaFile!
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
            }
        }),
        {
            name: 'ingestion-session-storage',
            storage: createJSONStorage(() => sessionStorage), // Clears when tab closes
        }
    )
);
