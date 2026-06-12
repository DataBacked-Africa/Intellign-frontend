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

import {
    GoalDefinition,
    GAParams,
    GoalModel,
    DataContext,
    Artifact
} from '@/types/models';

export interface ChatResponse {
    session_id: string;
    message: string;
    action_taken: string | null;
    data_preview: any | null;
    is_complete: boolean;
    phase: string;  // ingestion | discovery | data_sourcing | analysis | goal_definition | finalization | optimization | optimization_review | data_ready | gathering | finalizing
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

export interface UploadChip {
    key: string;                 // name:size
    name: string;
    state: 'uploading' | 'ingesting' | 'complete' | 'failed';
    rows?: { resources: number; targets: number } | null;
    error?: string | null;
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
    phase: string;
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
    uploads: UploadChip[];
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
        uploads: [],
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
                    phase:         stateData.phase ?? prev.phase,
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

    // ── Mirror shared state into the zustand store (single UI truth source).
    // The canvas and shell read from the store; they no longer mount their own
    // useUnifiedChat instance (which used to drift from this one).
    useEffect(() => {
        useSessionStore.getState().setChatShared({
            messages: state.messages,
            dataContext: state.dataContext,
            isGenerating: state.isGenerating,
            solverConfig: state.solverConfig,
            latestJobId: state.latestJobId,
            artifactCount: state.artifactCount,
            goals: state.goals,
        });
    }, [state.messages, state.dataContext, state.isGenerating, state.solverConfig,
        state.latestJobId, state.artifactCount, state.goals]);

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

    // ── Eager upload: process files the moment they're attached ───────────────
    const uploadedKeysRef = useRef<Set<string>>(new Set());
    const uploadPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const _setChip = (key: string, patch: Partial<UploadChip>) =>
        setState(prev => ({
            ...prev,
            uploads: prev.uploads.map(u => u.key === key ? { ...u, ...patch } : u),
        }));

    const uploadFiles = useCallback(async (files: File[], hint: string = '') => {
        const fresh = files.filter(f => !uploadedKeysRef.current.has(`${f.name}:${f.size}`));
        if (fresh.length === 0) return;
        const { sessionId } = state;
        registerSession(sessionId);

        const chips: UploadChip[] = fresh.map(f => ({
            key: `${f.name}:${f.size}`, name: f.name, state: 'uploading',
        }));
        fresh.forEach(f => uploadedKeysRef.current.add(`${f.name}:${f.size}`));
        setState(prev => ({ ...prev, uploads: [...prev.uploads, ...chips] }));

        try {
            const form = new FormData();
            fresh.forEach(f => form.append('files', f));
            form.append('hint', hint);
            const res = await fetch(`${API_URL}/ingest/files/${sessionId}`, {
                method: 'POST', headers: authHeaders(), body: form,
            });
            if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
            chips.forEach(c => _setChip(c.key, { state: 'ingesting' }));

            // Poll ingestion-status until terminal (server enforces an orphan
            // deadline, so this always terminates).
            if (uploadPollRef.current) clearInterval(uploadPollRef.current);
            uploadPollRef.current = setInterval(async () => {
                try {
                    const r = await fetch(`${API_URL}/ingest/chat/${sessionId}/ingestion-status`, { headers: authHeaders() });
                    if (!r.ok) return;
                    const st = await r.json();
                    if (st.status === 'complete') {
                        if (uploadPollRef.current) { clearInterval(uploadPollRef.current); uploadPollRef.current = null; }
                        chips.forEach(c => _setChip(c.key, {
                            state: 'complete',
                            rows: { resources: st.resources_rows ?? 0, targets: st.targets_rows ?? 0 },
                        }));
                        // Refresh dataContext so panels react immediately.
                        fetch(`${API_URL}/ingest/chat/${sessionId}/state`, { headers: authHeaders() })
                            .then(sr => sr.ok ? sr.json() : null).catch(() => null)
                            .then(sd => { if (sd?.data_context) setState(prev => ({ ...prev, dataContext: sd.data_context })); });
                    } else if (st.status === 'failed') {
                        if (uploadPollRef.current) { clearInterval(uploadPollRef.current); uploadPollRef.current = null; }
                        chips.forEach(c => _setChip(c.key, { state: 'failed', error: st.error ?? 'Ingestion failed.' }));
                        chips.forEach(c => uploadedKeysRef.current.delete(c.key));  // allow retry
                    }
                } catch { /* transient — keep polling */ }
            }, 1500);
        } catch (err: any) {
            chips.forEach(c => {
                _setChip(c.key, { state: 'failed', error: err.message ?? 'Upload failed.' });
                uploadedKeysRef.current.delete(c.key);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.sessionId, registerSession]);

    useEffect(() => () => { if (uploadPollRef.current) clearInterval(uploadPollRef.current); }, []);

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

            // ── Eager upload: files normally start ingesting the moment they're
            // attached (uploadFiles). If any arrive here un-uploaded (programmatic
            // call), kick the upload off now WITHOUT blocking the chat turn — the
            // backend smart-waits on in-progress ingestion before the agent answers.
            if (files.length > 0) {
                void uploadFiles(files, text);
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
                    if (evt.phase_ui_hint) {
                        useSessionStore.getState().setChatShared({ phaseUiHint: evt.phase_ui_hint });
                    }
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

            // Stale-stream watchdog: if the server stops sending for 90s (proxy
            // drop, hung backend), abort and surface an error instead of leaving
            // the spinner forever. Heavy actions stream progress events, so a
            // healthy turn never goes silent that long.
            let lastChunkAt = Date.now();
            let stalled = false;
            const stallTimer = setInterval(() => {
                if (Date.now() - lastChunkAt > 90_000) {
                    stalled = true;
                    abortRef.current?.abort();
                }
            }, 5_000);

            try {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    lastChunkAt = Date.now();
                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() ?? '';
                    for (const part of parts) {
                        const line = part.trim();
                        if (!line.startsWith('data:')) continue;
                        try { handleEvent(JSON.parse(line.slice(5).trim())); } catch { /* skip */ }
                    }
                }
            } finally {
                clearInterval(stallTimer);
            }
            if (stalled) throw new Error('The connection went quiet — please try again.');

            setState(prev => ({ ...prev, isSending: false, isGenerating: false }));

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
    }, [state, registerSession, uploadFiles]);

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
            uploads: [],
        });
    }, []);

    const stopGenerating = useCallback(() => {
        abortRef.current?.abort();
        setState(prev => ({
            ...prev,
            isSending: false,
            messages: prev.messages.map((m, i) =>
                i === prev.messages.length - 1 && m.role === 'assistant' && !m.content
                    ? { ...m, content: '_Stopped._' }
                    : m),
        }));
    }, []);

    return {
        ...state,
        sendMessage,
        uploadFiles,
        stopGenerating,
        downloadDataset,
        getDatasetUrl,
        reset,
        solverConfig:  state.solverConfig,
        dataPreview:   state.dataPreview,
        artifactCount: state.artifactCount,
        isGenerating:  state.isGenerating,
    };
};
