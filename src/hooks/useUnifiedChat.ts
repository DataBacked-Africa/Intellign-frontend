'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL } from '@/lib/axiosConfig';
import axiosInstance from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';
import { useSessionStore } from '@/store/useSessionStore';

const authHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    job_id?: string | null;
    suggested_responses?: string[] | null;
    multi_question?: Array<{ id: string; question: string; suggestions: string[] }> | null;
    solver_config?: Record<string, any> | null;
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
    suggestedResponses?: string[] | null;
    multiQuestion?: Array<{ id: string; question: string; suggestions: string[] }> | null;
}

interface UnifiedChatState {
    sessionId: string;
    messages: ChatMessage[];
    phase: 'ingestion' | 'goal_definition';
    isComplete: boolean;
    isSending: boolean;
    isLoadingHistory: boolean;
    goalModel: GoalModel | null;
    dataContext: DataContext | null;
    goals: GoalDefinition[];
    gaParams: GAParams | null;
    error: string | null;
    latestJobId: string | null;
    solverConfig: Record<string, any> | null;
    dataPreview: Record<string, any> | null;
    artifactCount: number;
    isGenerating: boolean;
}

const generateSessionId = (): string => crypto.randomUUID();

interface UseUnifiedChatOptions {
    initialSessionId?: string;
    /** Called once, after the session is first registered in the backend. */
    onSessionCreated?: (sessionId: string) => void;
}

export const useUnifiedChat = ({
    initialSessionId,
    onSessionCreated,
}: UseUnifiedChatOptions = {}) => {
    const [state, setState] = useState<UnifiedChatState>(() => ({
        sessionId: initialSessionId ?? generateSessionId(),
        messages: [],
        phase: 'ingestion',
        isComplete: false,
        isSending: false,
        isLoadingHistory: !!initialSessionId,
        goalModel: null,
        dataContext: null,
        goals: [],
        gaParams: null,
        error: null,
        latestJobId: null,
        solverConfig: null,
        dataPreview: null,
        artifactCount: 0,
        isGenerating: false,
    }));

    const abortRef = useRef<AbortController | null>(null);
    const registeredRef = useRef(false);

    // ── Hydration on mount — history and state load INDEPENDENTLY so the chat
    //    renders the instant history arrives, without waiting on the (heavier)
    //    /state call. This keeps reloads fast. ───────────────────────────────
    useEffect(() => {
        if (!initialSessionId) return;
        const headers = authHeaders();

        // History → render messages ASAP, flip the skeleton off immediately.
        fetch(`${API_URL}/ingest/chat/${initialSessionId}/history`, { headers })
            .then(r => r.ok ? r.json() : null).catch(() => null)
            .then((historyData) => {
                const rawMessages: any[] = historyData?.messages ?? [];
                const loadedMessages: ChatMessage[] = rawMessages.map((m: any, i: number) => ({
                    id:               m.id ?? `hist-${i}`,
                    role:             (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content:          m.content ?? m.message ?? '',
                    timestamp:        m.timestamp ? new Date(m.timestamp) : new Date(),
                    artifacts:        m.artifacts ?? null,
                    actionTaken:      m.action_taken ?? null,
                    suggestedResponses: null,
                    multiQuestion:    null,
                }));
                if (loadedMessages.length > 0) registeredRef.current = true;
                setState(prev => ({
                    ...prev,
                    messages:         loadedMessages.length > 0 ? loadedMessages : prev.messages,
                    isLoadingHistory: false,
                }));
            })
            .catch(() => setState(prev => ({ ...prev, isLoadingHistory: false })));

        // State → fills phase/goals/context as it arrives; never blocks the chat.
        fetch(`${API_URL}/ingest/chat/${initialSessionId}/state`, { headers })
            .then(r => r.ok ? r.json() : null).catch(() => null)
            .then((stateData) => {
                if (!stateData) return;
                setState(prev => ({
                    ...prev,
                    phase:         (stateData.phase as 'ingestion' | 'goal_definition') ?? prev.phase,
                    isComplete:    stateData.is_complete  ?? prev.isComplete,
                    goalModel:     stateData.goal_model   ?? prev.goalModel,
                    dataContext:   stateData.data_context ?? prev.dataContext,
                    goals:         Array.isArray(stateData.goals) ? stateData.goals : prev.goals,
                    latestJobId:   stateData.job_id       ?? prev.latestJobId,
                    solverConfig:  stateData.solver_config ?? null,
                    dataPreview:   stateData.data_preview  ?? null,
                    artifactCount: stateData.artifact_count ?? 0,
                }));
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally runs once on mount only

    const update = (partial: Partial<UnifiedChatState>) =>
        setState(prev => ({ ...prev, ...partial }));

    // ── Register session in the backend DB (fire-and-forget, auth optional) ──
    const registerSession = useCallback((sessionId: string) => {
        if (registeredRef.current) return;
        registeredRef.current = true;
        axiosInstance.post('/api/v1/me/sessions/register', { session_id: sessionId })
            .then(() => {
                useSessionStore.getState().fetchHistory();
                onSessionCreated?.(sessionId);
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

        registerSession(sessionId);

        const _genActions = ['generate_sample_dataset', 'generate_missing_tables', 'augment_missing_data'];
        const patchAssistant = (patch: Partial<ChatMessage>) =>
            setState(prev => ({
                ...prev,
                messages: prev.messages.map(m => m.id === loadingId ? { ...m, ...patch } : m),
            }));

        try {
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            // ── File uploads go to the dedicated /ingest/files endpoint ─────────
            // That endpoint ingests asynchronously, so we must WAIT for the data
            // to land before sending the chat turn — otherwise the agent sees no
            // data and synthesizes its own instead of using the upload.
            if (files.length > 0) {
                patchAssistant({ content: 'Ingesting your data…' });
                setState(prev => ({ ...prev, isGenerating: false }));

                const upForm = new FormData();
                files.forEach(f => upForm.append('files', f));
                upForm.append('hint', text);
                const upRes = await fetch(`${API_URL}/ingest/files/${sessionId}`, {
                    method: 'POST', headers: authHeaders(), body: upForm, signal: abortRef.current.signal,
                });
                if (!upRes.ok) throw new Error(await upRes.text().catch(() => upRes.statusText));

                // Poll session state until ingestion has produced dataset metadata
                // (or an ingestion error / timeout). Then continue to the chat turn.
                const deadline = Date.now() + 90_000;
                let ingested = false;
                while (Date.now() < deadline) {
                    await new Promise(r => setTimeout(r, 1500));
                    try {
                        const sres = await fetch(`${API_URL}/ingest/chat/${sessionId}/state`, {
                            headers: authHeaders(), signal: abortRef.current.signal,
                        });
                        if (!sres.ok) continue;
                        const sdata = await sres.json();
                        const dc = sdata?.data_context ?? {};
                        if (sdata?.ingestion_error) {
                            throw new Error(sdata.ingestion_error?.error ?? 'Ingestion failed.');
                        }
                        if (dc?.resources_metadata || dc?.targets_metadata) {
                            setState(prev => ({ ...prev, dataContext: dc }));
                            ingested = true;
                            break;
                        }
                    } catch (e: any) {
                        if (e?.name === 'AbortError') throw e;
                        // transient — keep polling until deadline
                    }
                }
                if (!ingested) {
                    patchAssistant({ content: 'Your data is taking a while to process. I’ll continue once it’s ready — you can also retry shortly.' });
                }
                // Fall through to the streaming turn so the agent now responds with
                // the uploaded data available.
            }

            // ── Streaming path (Rec 1+2) ────────────────────────────────────────
            const form = new FormData();
            form.append('message', text);
            form.append('include_history', 'true');
            const res = await fetch(`${API_URL}/ingest/chat/${sessionId}/stream`, {
                method: 'POST', headers: authHeaders(), body: form, signal: abortRef.current.signal,
            });
            if (!res.ok || !res.body) throw new Error(await res.text().catch(() => res.statusText));

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let streamedText = '';

            const handleEvent = (evt: any) => {
                if (evt.type === 'delta') {
                    streamedText += evt.text;
                    patchAssistant({ content: streamedText });
                } else if (evt.type === 'message') {
                    patchAssistant({
                        content: evt.message || streamedText,
                        artifacts: evt.artifacts ?? null,
                        suggestedResponses: evt.suggested_responses ?? null,
                        multiQuestion: evt.multi_question ?? null,
                    });
                    setState(prev => ({
                        ...prev,
                        phase: evt.phase ?? prev.phase,
                        goalModel: evt.goal_model ?? prev.goalModel,
                    }));
                } else if (evt.type === 'action') {
                    const _isGen = !!evt.action_taken && _genActions.some((a: string) => String(evt.action_taken).includes(a));
                    patchAssistant({ actionTaken: evt.action_taken, dataPreview: evt.data_preview });
                    setState(prev => ({
                        ...prev,
                        isComplete: evt.is_complete ?? prev.isComplete,
                        dataContext: evt.data_context ?? prev.dataContext,
                        isGenerating: _isGen || prev.isGenerating,
                        // Optimization kicked off from chat → expose the job so the
                        // canvas can connect to the live progress stream.
                        latestJobId: evt.job_id ?? prev.latestJobId,
                    }));
                    // Push the job to the SHARED store so the canvas (a separate
                    // useUnifiedChat instance) and orchestrator can pick it up.
                    if (evt.action_taken === 'optimization_started' && evt.job_id) {
                        const store = useSessionStore.getState();
                        store.setJobId(evt.job_id);
                        store.setStatus('PROCESSING');
                    }
                } else if (evt.type === 'goals') {
                    // Auto-applied goals (LLM-compiled from the turn-1 widget picks)
                    if (Array.isArray(evt.goals) && evt.goals.length) {
                        setState(prev => ({ ...prev, goals: evt.goals }));
                    }
                } else if (evt.type === 'insights') {
                    // Milestone insight artifacts → append to the message so the
                    // canvas Insights tab (which scans message artifacts) picks them up.
                    if (Array.isArray(evt.artifacts) && evt.artifacts.length) {
                        setState(prev => ({
                            ...prev,
                            artifactCount: prev.artifactCount + evt.artifacts.length,
                            messages: prev.messages.map(m =>
                                m.id === loadingId
                                    ? { ...m, artifacts: [...(m.artifacts ?? []), ...evt.artifacts] }
                                    : m),
                        }));
                    }
                } else if (evt.type === 'error') {
                    patchAssistant({ content: evt.message || 'Something went wrong.' });
                }
            };

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() ?? '';
                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith('data:')) continue;
                    try { handleEvent(JSON.parse(line.slice(5).trim())); } catch { /* skip */ }
                }
            }

            setState(prev => ({ ...prev, isSending: false }));

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
    }, [state, registerSession]);

    // ── Dataset download URL helpers ──────────────────────────────────────────
    const getDatasetUrl = useCallback((table: 'resources' | 'targets', format: 'csv' | 'xlsx' = 'csv') => {
        return `${API_URL}/ingest/chat/${state.sessionId}/datasets?table=${table}&format=${format}`;
    }, [state.sessionId]);

    const downloadDataset = useCallback(async (table: 'resources' | 'targets', format: 'csv' | 'xlsx' = 'csv') => {
        try {
            const res = await fetch(getDatasetUrl(table, format), { headers: authHeaders() });
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
            isLoadingHistory: false,
            goalModel: null,
            dataContext: null,
            goals: [],
            gaParams: null,
            error: null,
            latestJobId: null,
            solverConfig: null,
            dataPreview: null,
            artifactCount: 0,
            isGenerating: false,
        });
    }, []);

    return {
        ...state,
        sendMessage,
        downloadDataset,
        getDatasetUrl,
        reset,
        solverConfig:  state.solverConfig,
        dataPreview:   state.dataPreview,
        artifactCount: state.artifactCount,
        isGenerating:  state.isGenerating,
    };
};
