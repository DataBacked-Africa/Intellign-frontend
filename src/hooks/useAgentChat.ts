import { useState, useCallback } from 'react';
import axiosInstance from '@/lib/axiosConfig';
import { useSessionStore } from '@/store/useSessionStore';
import { showToast } from '@/components/ui/CustomToast';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: AgentSuggestions | null;
    isLoading?: boolean;
}

export interface AgentSuggestions {
    goals?: GoalSuggestion[];
    ga_params?: Record<string, any>;
}

export interface GoalSuggestion {
    id?: string;
    description: string;
    resource_columns?: string[];
    target_columns?: string[];
    logic_config?: Record<string, any>;
    weight?: number;
    award_type?: 'Reward' | 'Penalty';
    logic_primitive?: string | null;
}

export interface DatasetContext {
    columns?: Array<{ name: string; type: string; sample?: any }>;
    resource_columns?: Array<{ name: string; type: string }>;
    target_columns?: Array<{ name: string; type: string }>;
    resource_count?: number;
    target_count?: number;
    session_id?: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';

// ─── Response parsing helpers ─────────────────────────────────────────────────

/**
 * Unwrap our backend's `{ status, data }` envelope if present.
 * Returns the inner payload whether or not it was wrapped.
 */
const unwrap = (responseData: any): any =>
    responseData?.data !== undefined && responseData?.status !== undefined
        ? responseData.data
        : responseData;

/**
 * Extract the text reply from an agent chat response.
 * Intellign's response schema is unspecified so we try every common key.
 */
const extractContent = (data: any): string => {
    if (typeof data?.message === 'string' && data.message.length > 0) return data.message;
    if (typeof data?.response === 'string' && data.response.length > 0) return data.response;
    if (typeof data?.reply === 'string' && data.reply.length > 0) return data.reply;
    if (typeof data?.text === 'string' && data.text.length > 0) return data.text;
    if (typeof data?.content === 'string' && data.content.length > 0) return data.content;
    if (typeof data?.answer === 'string' && data.answer.length > 0) return data.answer;
    if (typeof data === 'string' && data.length > 0) return data;
    // Last resort — surface the raw JSON so the developer can see what arrived
    return JSON.stringify(data, null, 2);
};

/**
 * Extract goal/param suggestions from the chat response if present.
 */
const extractSuggestions = (data: any): AgentSuggestions | null => {
    const goals = data?.goals ?? data?.suggested_goals ?? data?.goal_suggestions ?? null;
    const ga_params = data?.ga_params ?? data?.solver_params ?? null;
    if (!goals && !ga_params) return null;
    return { goals: goals ?? undefined, ga_params: ga_params ?? undefined };
};

/**
 * True if the error is a 404 from intellign ("session not found on AI server").
 */
const isNotFound = (error: any): boolean =>
    error?.response?.status === 404 ||
    /not found/i.test(error?.response?.data?.message ?? '') ||
    /not found/i.test(error?.message ?? '');

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAgentChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [context, setContext] = useState<DatasetContext | null>(null);
    const [model, setModel] = useState(DEFAULT_MODEL);
    /** True when intellign has no session for this session_id (session expired or never ingested) */
    const [sessionNotFound, setSessionNotFound] = useState(false);

    // ─── Send message ──────────────────────────────────────────────────────

    const sendMessage = useCallback(async (message: string) => {
        const { sessionId } = useSessionStore.getState();
        if (!sessionId) {
            showToast.error('No Session', 'Please initialize a session first.');
            return;
        }

        setSessionNotFound(false);

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
            timestamp: new Date(),
        };

        const loadingId = crypto.randomUUID();
        const loadingMsg: ChatMessage = {
            id: loadingId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setIsLoading(true);

        try {
            const response = await axiosInstance.post(`/agent/chat/${sessionId}`, {
                message,
                model,
                include_history: true,
            });

            const data = unwrap(response.data);
            const content = extractContent(data);
            const suggestions = extractSuggestions(data);

            setMessages(prev => prev.map(m =>
                m.id === loadingId
                    ? { id: loadingId, role: 'assistant', content, timestamp: new Date(), suggestions, isLoading: false }
                    : m
            ));
        } catch (error: any) {
            let errContent: string;
            if (isNotFound(error)) {
                setSessionNotFound(true);
                errContent = 'This session no longer exists on the AI server — sessions are temporary. Please start a new session from the home page to chat with the AI.';
            } else {
                const msg = error?.response?.data?.message || error?.message || 'Failed to get a response.';
                errContent = `Something went wrong: ${msg}`;
            }
            setMessages(prev => prev.map(m =>
                m.id === loadingId
                    ? { id: loadingId, role: 'assistant', content: errContent, timestamp: new Date(), isLoading: false }
                    : m
            ));
        } finally {
            setIsLoading(false);
        }
    }, [model]);

    // ─── Apply suggestions ─────────────────────────────────────────────────

    const applySuggestions = useCallback(async (
        suggestions: AgentSuggestions,
        mode: 'append' | 'replace' = 'append'
    ) => {
        const { sessionId } = useSessionStore.getState();
        if (!sessionId) return;

        setIsApplying(true);
        try {
            const response = await axiosInstance.post(`/agent/apply/${sessionId}`, {
                goals: suggestions.goals ?? null,
                ga_params: suggestions.ga_params ?? null,
                mode,
            });

            const data = unwrap(response.data);

            // Sync applied goals into session store
            const goalsToSync: GoalSuggestion[] = data.current_goals ?? data.applied_goals ?? [];
            if (goalsToSync.length > 0) {
                const goalPayload: Record<string, any> = {};
                goalsToSync.forEach((goal) => {
                    const id = goal.id || crypto.randomUUID();
                    goalPayload[id] = {
                        id,
                        description: goal.description ?? '',
                        resource_columns: goal.resource_columns ?? [],
                        target_columns: goal.target_columns ?? [],
                        logic_config: goal.logic_config ?? {
                            logic_type: 'numeric_threshold',
                            aggregation_method: 'sum',
                            comparison_column: null,
                            threshold_value: null,
                            numeric_operator: 'le',
                            mapping_rules: null,
                            exact_match: true,
                            max_distance_value: null,
                            distance_unit: 'km',
                            minimize_distance: false,
                            set_operation: null,
                            min_intersection_size: 1,
                            time_unit: 'hours',
                            buffer_time: 0,
                            scoring_rules: null,
                            value_splitter: null,
                        },
                        weight: goal.weight ?? 50,
                        award_type: goal.award_type ?? 'Reward',
                        logic_primitive: goal.logic_primitive ?? null,
                    };
                });
                useSessionStore.getState().setGoals(goalPayload);
            }

            const warnings: string[] = data.validation_warnings ?? [];
            if (warnings.length > 0) {
                showToast.warning('Applied with Warnings', warnings[0]);
            } else {
                const count = data.goals_count ?? goalsToSync.length;
                showToast.success('Goals Applied', `${count} goal${count !== 1 ? 's' : ''} configured.`);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Failed to apply suggestions.';
            showToast.error('Apply Failed', msg);
        } finally {
            setIsApplying(false);
        }
    }, []);

    // ─── Load history ──────────────────────────────────────────────────────

    const loadHistory = useCallback(async () => {
        const { sessionId } = useSessionStore.getState();
        if (!sessionId) return;

        try {
            const response = await axiosInstance.get(`/agent/history/${sessionId}`);
            const data = unwrap(response.data);

            // History can come as an array or { messages: [...] } or { history: [...] }
            const raw: any[] = Array.isArray(data) ? data : (data?.messages ?? data?.history ?? []);

            if (raw.length === 0) return;

            const loaded: ChatMessage[] = raw.map((msg: any, i: number) => ({
                id: msg.id ?? `hist-${i}`,
                // Intellign uses 'human'/'ai' roles; normalize to 'user'/'assistant'
                role: (msg.role === 'human' || msg.role === 'user') ? 'user' : 'assistant',
                content: msg.content ?? msg.message ?? msg.text ?? '',
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                suggestions: msg.goals || msg.suggested_goals
                    ? { goals: msg.goals ?? msg.suggested_goals, ga_params: msg.ga_params }
                    : null,
            }));

            setMessages(loaded);
        } catch (error: any) {
            if (isNotFound(error)) {
                setSessionNotFound(true);
            }
            // Silently ignore — no history is a valid state
        }
    }, []);

    // ─── Clear chat ────────────────────────────────────────────────────────

    const clearChat = useCallback(async () => {
        const { sessionId } = useSessionStore.getState();
        setMessages([]);
        setSessionNotFound(false);
        if (!sessionId) return;
        try {
            await axiosInstance.delete(`/agent/history/${sessionId}`);
        } catch { /* ignore */ }
    }, []);

    // ─── Fetch dataset context ─────────────────────────────────────────────

    const fetchContext = useCallback(async () => {
        const { sessionId } = useSessionStore.getState();
        if (!sessionId) return;
        try {
            const response = await axiosInstance.get(`/agent/context/${sessionId}`);
            const data = unwrap(response.data);
            setContext(data ?? null);
        } catch (error: any) {
            if (isNotFound(error)) {
                setSessionNotFound(true);
            }
            // Don't set context — panel stays in no-context state
        }
    }, []);

    return {
        messages,
        isLoading,
        isApplying,
        context,
        model,
        setModel,
        sessionNotFound,
        sendMessage,
        applySuggestions,
        loadHistory,
        clearChat,
        fetchContext,
    };
};
