'use client';

import { useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/axiosConfig';
import axiosInstance from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';
import { useSessionStore } from '@/store/useSessionStore';

// ── Response types (aligned to FRONTEND_INTEGRATION.md) ──────────────────────

export interface GoalDefinition {
    description: string;
    weight: number;
    award_type: 'Reward' | 'Penalty';
    resource_columns: string[];
    target_columns: string[];
    logic_config: Record<string, any>;
    explanation?: string;
}

export interface GAParams {
    population_size: number;
    generations: number;
    mutation_rate: number;
    selection_method: string;
}

export interface GoalModel {
    problem_type: string | null;
    confidence: number;
    entities: {
        resources?: { name: string };
        targets?: { name: string };
    };
    objectives: string[];
    constraints: string[];
    estimated_scale: string | null;
    description: string | null;
}

export interface DataContext {
    status: 'none' | 'partial' | 'complete';
    resources_metadata: { count: number; columns: string[] } | null;
    targets_metadata: { count: number; columns: string[] } | null;
    missing_tables: string[];
    missing_columns: Record<string, any>;
    synthetic_flags: Record<string, any>;
}

export interface Artifact {
    type: 'table' | string;
    content: string;
    headers?: string[];
    rows?: string[][];
    title?: string;
}

export interface ChatResponse {
    session_id: string;
    message: string;
    action_taken: string | null;
    data_preview: any | null;
    is_complete: boolean;
    phase: 'ingestion' | 'goal_definition';
    goal_model: GoalModel | null;
    data_context: DataContext | null;
    goals: GoalDefinition[] | null;
    ga_params: GAParams | null;
    artifacts?: Artifact[] | null;
    goal_summary?: string | null;
}

export interface AttachedFileInfo {
    name: string;
    size: number;
    type: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachedFiles?: AttachedFileInfo[];
    actionTaken?: string | null;
    dataPreview?: any | null;
    goals?: GoalDefinition[] | null;
    artifacts?: Artifact[] | null;
}

interface UnifiedChatState {
    sessionId: string;
    messages: ChatMessage[];
    phase: 'ingestion' | 'goal_definition';
    isComplete: boolean;
    isSending: boolean;
    goalModel: GoalModel | null;
    dataContext: DataContext | null;
    goals: GoalDefinition[];
    gaParams: GAParams | null;
    error: string | null;
}

const generateSessionId = (): string => crypto.randomUUID();

export const useUnifiedChat = (initialSessionId?: string) => {
    const [state, setState] = useState<UnifiedChatState>(() => ({
        sessionId: initialSessionId ?? generateSessionId(),
        messages: [],
        phase: 'ingestion',
        isComplete: false,
        isSending: false,
        goalModel: null,
        dataContext: null,
        goals: [],
        gaParams: null,
        error: null,
    }));

    const abortRef = useRef<AbortController | null>(null);
    // Track whether this session has already been registered in the backend DB
    const registeredRef = useRef(false);

    const update = (partial: Partial<UnifiedChatState>) =>
        setState(prev => ({ ...prev, ...partial }));

    // ── Register session in the backend DB (fire-and-forget, auth optional) ──
    const registerSession = useCallback((sessionId: string) => {
        if (registeredRef.current) return;
        registeredRef.current = true;
        axiosInstance.post('/sessions/register', { sessionId })
            .then(() => {
                // Refresh the sidebar so the new session appears immediately
                useSessionStore.getState().fetchHistory();
            })
            .catch(() => {
                registeredRef.current = false;
            });
    }, []);

    // ── Send a message (with optional file attachments) ───────────────────────
    const sendMessage = useCallback(async (text: string, files: File[] = []) => {
        const { sessionId } = state;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: new Date(),
            attachedFiles: files.length > 0
                ? files.map(f => ({ name: f.name, size: f.size, type: f.type }))
                : undefined,
        };

        const loadingId = crypto.randomUUID();
        const loadingMsg: ChatMessage = {
            id: loadingId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };

        setState(prev => ({
            ...prev,
            isSending: true,
            error: null,
            messages: [...prev.messages, userMsg, loadingMsg],
        }));

        // Register in backend DB on first send so the session appears in the sidebar
        registerSession(sessionId);

        try {
            const form = new FormData();
            form.append('message', text);
            form.append('include_history', 'true');
            files.forEach(f => form.append('files', f));

            abortRef.current?.abort();
            abortRef.current = new AbortController();

            const res = await fetch(`${API_URL}/ingest/chat/${sessionId}`, {
                method: 'POST',
                body: form,
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => res.statusText);
                throw new Error(errText);
            }

            const data: ChatResponse = await res.json();

            const assistantMsg: ChatMessage = {
                id: loadingId,
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                actionTaken: data.action_taken,
                dataPreview: data.data_preview,
                goals: data.goals,
                artifacts: data.artifacts ?? null,
            };

            setState(prev => ({
                ...prev,
                isSending: false,
                phase: data.phase,
                isComplete: data.is_complete,
                goalModel: data.goal_model ?? prev.goalModel,
                dataContext: data.data_context ?? prev.dataContext,
                gaParams: data.ga_params ?? prev.gaParams,
                goals: data.goals ? [...prev.goals, ...data.goals] : prev.goals,
                messages: prev.messages.map(m => m.id === loadingId ? assistantMsg : m),
            }));

        } catch (err: any) {
            if (err.name === 'AbortError') return;
            const msg = err.message ?? 'Failed to get a response.';
            setState(prev => ({
                ...prev,
                isSending: false,
                error: msg,
                messages: prev.messages.map(m =>
                    m.id === loadingId
                        ? { ...m, content: `Something went wrong: ${msg}` }
                        : m
                ),
            }));
        }
    }, [state]);

    // ── Load chat history (on resume) ─────────────────────────────────────────
    const loadHistory = useCallback(async (sessionId?: string) => {
        const sid = sessionId ?? state.sessionId;
        try {
            const res = await fetch(`${API_URL}/ingest/chat/${sid}/history`);
            if (!res.ok) return;
            const data = await res.json();
            const raw: any[] = data.messages ?? [];
            if (!raw.length) return;

            const loaded: ChatMessage[] = raw.map((m: any, i: number) => ({
                id: m.id ?? `hist-${i}`,
                role: (m.role === 'user') ? 'user' : 'assistant',
                content: m.content ?? m.message ?? '',
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                actionTaken: m.action_taken ?? null,
            }));

            update({ messages: loaded });
        } catch { /* silently ignore */ }
    }, [state.sessionId]);

    // ── Dataset download URL helpers ──────────────────────────────────────────
    const getDatasetUrl = useCallback((table: 'resources' | 'targets', format: 'csv' | 'xlsx' = 'csv') => {
        return `${API_URL}/ingest/chat/${state.sessionId}/datasets?table=${table}&format=${format}`;
    }, [state.sessionId]);

    const downloadDataset = useCallback(async (table: 'resources' | 'targets', format: 'csv' | 'xlsx' = 'csv') => {
        try {
            const res = await fetch(getDatasetUrl(table, format));
            if (!res.ok) throw new Error('Dataset not available yet.');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${table}_${state.sessionId.slice(0, 8)}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            showToast.error('Download Failed', err.message ?? 'Could not download dataset.');
        }
    }, [state.sessionId, getDatasetUrl]);

    // ── Reset (start new session) ─────────────────────────────────────────────
    const reset = useCallback(() => {
        abortRef.current?.abort();
        registeredRef.current = false;
        setState({
            sessionId: generateSessionId(),
            messages: [],
            phase: 'ingestion',
            isComplete: false,
            isSending: false,
            goalModel: null,
            dataContext: null,
            goals: [],
            gaParams: null,
            error: null,
        });
    }, []);

    return {
        ...state,
        sendMessage,
        loadHistory,
        downloadDataset,
        getDatasetUrl,
        reset,
    };
};
