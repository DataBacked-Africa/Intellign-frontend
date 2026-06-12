'use client';

import { useCallback, useRef } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import axiosInstance, { API_URL } from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';

interface RunOptimizationOptions {
    autoApprove?: boolean;
    progressInterval?: number;
    qualityMode?: 'fast' | 'balanced' | 'best';
    configOverride?: {
        goals?: any[];
        ga_params?: Record<string, any> | null;
    } | null;
}

export const useSessionOrchestrator = () => {
    const {
        setStatus,
        setProgress,
        setLiveMetrics,
        addLog,
        setResult,
        setError,
        setJobId,
    } = useSessionStore();

    const eventSourceRef = useRef<EventSource | null>(null);

    // Pull the FINAL metrics from /results and populate the Monitor stats. Used when
    // a run finishes before any SSE event (fast ga_vec runs), so Generation / Best
    // fitness / Coverage / Elapsed don't sit blank.
    const _populateFinalMetrics = useCallback((jobId: string) => {
        axiosInstance.get(`/results/${jobId}`).then(res => {
            const m = res.data?.metrics ?? {};
            setLiveMetrics({
                currentGeneration: m.generations_run ?? undefined,
                totalGenerations:  m.generations_run ?? undefined,
                bestFitness:       m.best_fitness ?? undefined,
                averageFitness:    m.average_final_fitness ?? undefined,
                coverage:          m.coverage_pct ?? m.solution_quality ?? undefined,
            });
            // Reflect real elapsed if we never started a live clock
            if (m.elapsed_time_seconds != null) {
                setLiveMetrics({ startedAt: Date.now() - Math.round(m.elapsed_time_seconds * 1000) });
            }
        }).catch(() => {});
    }, [setLiveMetrics]);

    // ── Connect to SSE progress stream ────────────────────────────────────────
    const connectToProgress = useCallback((jobId: string) => {
        eventSourceRef.current?.close();

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // Fast-run guard: ga_vec on small data finishes in <1s, so by the time we
        // connect the SSE stream may have already closed with nothing to replay.
        // Poll the job status first — if it's already done, flip straight to results.
        axiosInstance.get(`/optimizations/status/${jobId}`)
            .then(res => {
                const s = String(res.data?.status ?? '').toUpperCase();
                if (s === 'COMPLETED') {
                    setProgress(100);
                    setStatus('COMPLETED');
                    addLog('Optimization complete!');
                    _populateFinalMetrics(jobId);   // fill Monitor with final numbers
                    return; // don't open a stream for a finished job
                }
                if (s === 'FAILED') {
                    setStatus('FAILED');
                    setError('Optimization failed.');
                    return;
                }
                _openStream(jobId, token);
            })
            .catch(() => _openStream(jobId, token));
    }, [setStatus, setProgress, setLiveMetrics, addLog, setError, _populateFinalMetrics]); // eslint-disable-line

    const _openStream = useCallback((jobId: string, token: string | null) => {
        eventSourceRef.current?.close();
        const url = `${API_URL}/optimizations/progress/${jobId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const evtSource = new EventSource(url);
        eventSourceRef.current = evtSource;

        // Safety net: if no event arrives within 3s (job finished before connect),
        // poll status once so the UI doesn't sit on "Waiting to start" forever.
        let gotEvent = false;
        const lateCheck = setTimeout(() => {
            if (gotEvent) return;
            axiosInstance.get(`/optimizations/status/${jobId}`).then(res => {
                const s = String(res.data?.status ?? '').toUpperCase();
                if (s === 'COMPLETED') { setProgress(100); setStatus('COMPLETED'); _populateFinalMetrics(jobId); evtSource.close(); }
                else if (s === 'FAILED') { setStatus('FAILED'); evtSource.close(); }
            }).catch(() => {});
        }, 3000);
        const _origClose = evtSource.close.bind(evtSource);
        evtSource.close = () => { clearTimeout(lateCheck); _origClose(); };
        evtSource.addEventListener('message', () => { gotEvent = true; });

        evtSource.onmessage = (event) => {
            if (!event.data) return;
            try {
                const data = JSON.parse(event.data);

                if (typeof data.progress === 'number') {
                    setProgress(Math.round(data.progress * 100));
                }

                // Capture live GA metrics for the Monitor tab
                if (data.current_generation != null || data.best_fitness != null || data.coverage_pct != null) {
                    setLiveMetrics({
                        currentGeneration: data.current_generation ?? undefined,
                        totalGenerations:  data.total_generations ?? undefined,
                        bestFitness:       data.best_fitness ?? undefined,
                        averageFitness:    data.average_fitness ?? undefined,
                        coverage:          data.coverage_pct ?? undefined,
                    });
                }

                if (data.message) {
                    addLog(data.message);
                }

                if (data.status === 'completed') {
                    setStatus('COMPLETED');
                    setProgress(100);
                    addLog('Optimization complete!');
                    _populateFinalMetrics(jobId);
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
    }, [setStatus, setProgress, setLiveMetrics, addLog, setError, _populateFinalMetrics]);

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
        setLiveMetrics({ startedAt: Date.now(), currentGeneration: 0, bestFitness: 0 });
        addLog('Submitting optimization job...');

        try {
            const payload: Record<string, any> = {
                auto_approve: options.autoApprove ?? false,
                progress_interval: options.progressInterval ?? 20,
                quality_mode: options.qualityMode
                    ?? useSessionStore.getState().qualityMode
                    ?? 'best',
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
    }, [setStatus, setProgress, setLiveMetrics, addLog, setError, setJobId, connectToProgress]);

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
                // Pull the full result set (backend max) so the Assignments tab shows
                // the true count and paginates client-side — a 50-row fetch made large
                // rosters look capped at 50. Backend filters __OFF__ non-assignments,
                // so realistic schedules land well under this ceiling.
                params: { page: 1, page_size: 500, include_enriched: true },
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
