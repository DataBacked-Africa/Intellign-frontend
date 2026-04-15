import { useState, useCallback } from 'react';
import axiosInstance from '@/lib/axiosConfig';
import { useSessionStore } from '@/store/useSessionStore';
import { showToast } from '@/components/ui/CustomToast';

export type SmartIngestStage =
    | 'idle'
    | 'uploading'
    | 'processing'
    | 'analysed'
    | 'recipe_ready'
    | 'transformed'
    | 'complete'
    | 'error';

export interface IngestMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actionTaken?: string | null;
    nextStage?: string | null;
}

interface SmartIngestState {
    stage: SmartIngestStage;
    sessionId: string | null;       // local DB session
    mlSessionId: string | null;     // intellign session
    messages: IngestMessage[];
    isUploading: boolean;
    isChatting: boolean;
    error: string | null;
}

const initial: SmartIngestState = {
    stage: 'idle',
    sessionId: null,
    mlSessionId: null,
    messages: [],
    isUploading: false,
    isChatting: false,
    error: null,
};

const extractError = (error: any, fallback: string): string => {
    const raw = error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message;
    return typeof raw === 'string' ? raw : fallback;
};

export const useSmartIngest = () => {
    const [state, setState] = useState<SmartIngestState>(initial);

    const update = (partial: Partial<SmartIngestState>) =>
        setState(prev => ({ ...prev, ...partial }));

    // ─── Upload files ──────────────────────────────────────────────────────

    const uploadFiles = useCallback(async (files: File[], hint?: string) => {
        update({ isUploading: true, error: null, stage: 'uploading' });

        try {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            if (hint) formData.append('hint', hint);

            const response = await axiosInstance.post('/smart-ingest/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = response.data.data;
            const sessionId: string = data.sessionId;
            const mlSessionId: string = data.mlSessionId || data.session_id || sessionId;

            useSessionStore.getState().setSessionId(sessionId);
            useSessionStore.getState().setStatus('PROCESSING');

            // First assistant message — AI introduces itself
            const introMsg: IngestMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `I've received your ${files.length} file${files.length > 1 ? 's' : ''} and I'm analyzing them now. This usually takes a few seconds.\n\nFeel free to ask me anything about your data while I work, or just say **"what did you find?"** once analysis is complete.`,
                timestamp: new Date(),
            };

            update({
                stage: 'processing',
                sessionId,
                mlSessionId,
                isUploading: false,
                messages: [introMsg],
            });
        } catch (error: any) {
            const msg = extractError(error, 'Upload failed');
            update({ stage: 'error', isUploading: false, error: msg });
            showToast.error('Upload Failed', msg);
        }
    }, []);

    // ─── Send chat message ─────────────────────────────────────────────────

    const sendMessage = useCallback(async (text: string) => {
        const { sessionId, mlSessionId } = state;
        if (!sessionId) return;

        const userMsg: IngestMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        const loadingId = crypto.randomUUID();
        const loadingMsg: IngestMessage = {
            id: loadingId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };

        setState(prev => ({
            ...prev,
            isChatting: true,
            messages: [...prev.messages, userMsg, loadingMsg],
        }));

        try {
            const response = await axiosInstance.post(`/smart-ingest/${sessionId}/chat`, {
                message: text,
                model: 'gemini-2.5-flash',
                include_history: true,
            });

            const data = response.data.data ?? response.data;
            const content: string = data.message ?? data.response ?? data.reply ?? JSON.stringify(data);
            const nextStage: string | null = data.next_stage ?? null;
            const actionTaken: string | null = data.action_taken ?? null;
            const structuredData: any = data.structured_data ?? null;

            const assistantMsg: IngestMessage = {
                id: loadingId,
                role: 'assistant',
                content,
                timestamp: new Date(),
                actionTaken,
                nextStage,
            };

            // Determine new stage
            const newStage = (nextStage as SmartIngestStage) || state.stage;

            setState(prev => ({
                ...prev,
                isChatting: false,
                stage: newStage,
                messages: prev.messages.map(m => m.id === loadingId ? assistantMsg : m),
            }));

            // If ingestion completed, sync metadata to session store
            if (nextStage === 'complete' && structuredData) {
                const resMeta = structuredData.resources_metadata ?? structuredData.datasets?.resource ?? null;
                const tgtMeta = structuredData.targets_metadata ?? structuredData.datasets?.target ?? null;
                if (resMeta || tgtMeta) {
                    useSessionStore.getState().setResult({
                        ingestion: {
                            status: 'success',
                            session_id: mlSessionId || sessionId,
                            resources_metadata: resMeta,
                            targets_metadata: tgtMeta,
                        },
                    });
                }
                useSessionStore.getState().setStatus('CONFIGURING');
            }
        } catch (error: any) {
            const msg = extractError(error, 'Failed to get a response.');
            setState(prev => ({
                ...prev,
                isChatting: false,
                messages: prev.messages.map(m =>
                    m.id === loadingId
                        ? { ...m, content: `Something went wrong: ${msg}` }
                        : m
                ),
            }));
        }
    }, [state]);

    // ─── Load history (on resume) ──────────────────────────────────────────

    const loadHistory = useCallback(async (sessionId: string) => {
        try {
            const response = await axiosInstance.get(`/smart-ingest/${sessionId}/history`);
            const data = response.data.data ?? response.data;
            const raw: any[] = Array.isArray(data) ? data : (data?.messages ?? []);
            if (raw.length === 0) return;

            const loaded: IngestMessage[] = raw.map((m: any, i: number) => ({
                id: m.id ?? `hist-${i}`,
                role: (m.role === 'user') ? 'user' : 'assistant',
                content: m.message ?? m.content ?? '',
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                actionTaken: m.action_taken ?? null,
            }));

            setState(prev => ({ ...prev, messages: loaded }));
        } catch { /* silently ignore */ }
    }, []);

    // ─── Reset ─────────────────────────────────────────────────────────────

    const reset = useCallback(() => setState(initial), []);

    return {
        ...state,
        uploadFiles,
        sendMessage,
        loadHistory,
        reset,
    };
};
