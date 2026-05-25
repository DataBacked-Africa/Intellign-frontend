'use client';

import { useCallback, useRef } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import axiosInstance, { API_URL } from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';

interface RunOptimizationOptions {
    autoApprove?: boolean;
    progressInterval?: number;
    configOverride?: {
        goals?: any[];
        ga_params?: Record<string, any> | null;
    } | null;
}

export const useSessionOrchestrator = () => {
    const {
        setStatus,
        setProgress,
        addLog,
        setResult,
        setError,
        setJobId,
    } = useSessionStore();

    const eventSourceRef = useRef<EventSource | null>(null);

    // ── Connect to SSE progress stream ────────────────────────────────────────
    const connectToProgress = useCallback((jobId: string) => {
        eventSourceRef.current?.close();

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const url = `${API_URL}/optimizations/progress/${jobId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const evtSource = new EventSource(url);
        eventSourceRef.current = evtSource;

        evtSource.onmessage = (event) => {
            if (!event.data) return;
            try {
                const data = JSON.parse(event.data);

                if (typeof data.progress === 'number') {
                    setProgress(Math.round(data.progress * 100));
                }

                if (data.message) {
                    addLog(data.message);
                }

                if (data.status === 'completed') {
                    setStatus('COMPLETED');
                    setProgress(100);
                    addLog('Optimization complete!');
                    evtSource.close();
                    showToast.success('Optimization Complete', 'Review your results below.');
                } else if (data.status === 'failed') {
                    const msg = data.message ?? 'Optimization failed.';
                    setError(msg);
                    setStatus('FAILED');
                    evtSource.close();
                    showToast.error('Optimization Failed', msg);
                }
            } catch {
                // ignore parse errors
            }
        };

        evtSource.onerror = () => {
            // EventSource auto-retries; close only on terminal states above
        };
    }, [setStatus, setProgress, addLog, setError]);

    // ── Start optimization job ────────────────────────────────────────────────
    const startOptimization = useCallback(async (
        sessionId: string,
        options: RunOptimizationOptions = {}
    ) => {
        if (!sessionId) {
            showToast.error('Missing Session', 'No active session to optimize.');
            return;
        }

        setStatus('PROCESSING');
        setError(null);
        setProgress(0);
        addLog('Submitting optimization job...');

        try {
            const payload: Record<string, any> = {
                auto_approve: options.autoApprove ?? false,
                progress_interval: options.progressInterval ?? 20,
            };
            if (options.configOverride) {
                payload.config_override = options.configOverride;
            }

            const response = await axiosInstance.post(
                `/optimizations/run/${sessionId}`,
                payload
            );

            const { job_id } = response.data;

            if (!job_id) throw new Error('No job_id returned from optimization run.');

            setJobId(job_id);
            addLog(`Optimization job queued: ${job_id}`);
            showToast.success('Optimization Started', 'Processing your data...');

            connectToProgress(job_id);

        } catch (error: any) {
            const msg = error?.response?.data?.detail ?? error?.message ?? 'Could not start optimization.';
            setError(msg);
            setStatus('FAILED');
            showToast.error('Optimization Failed', msg);
        }
    }, [setStatus, setProgress, addLog, setError, setJobId, connectToProgress]);

    // ── Cancel a running job ──────────────────────────────────────────────────
    const cancelOptimization = useCallback(async (jobId: string) => {
        try {
            eventSourceRef.current?.close();
            await axiosInstance.post(`/optimizations/cancel/${jobId}`);
            setStatus('IDLE');
            setProgress(0);
            showToast.success('Cancelled', 'Optimization job cancelled.');
        } catch {
            showToast.error('Cancel Failed', 'Could not cancel the job.');
        }
    }, [setStatus, setProgress]);

    // ── Fetch final results ───────────────────────────────────────────────────
    const fetchResults = useCallback(async (jobId: string) => {
        try {
            const response = await axiosInstance.get(`/results/${jobId}`, {
                params: { page: 1, page_size: 50, include_enriched: true },
            });
            setResult(response.data);
        } catch (error: any) {
            const msg = error?.response?.data?.detail ?? 'Could not load results.';
            setError(msg);
            showToast.error('Results Error', msg);
        }
    }, [setResult, setError]);

    const disconnect = useCallback(() => {
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
    }, []);

    return {
        startOptimization,
        cancelOptimization,
        fetchResults,
        connectToProgress,
        disconnect,
    };
};
