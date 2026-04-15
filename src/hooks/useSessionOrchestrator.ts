import { useState, useCallback, useRef } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { useUserStore } from '@/store/useUserStore';
import axiosInstance from '@/lib/axiosConfig';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { showToast } from '@/components/ui/CustomToast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const useSessionOrchestrator = () => {
    const {
        sourceFile,
        schemaFile,
        setSessionId,
        setStatus,
        setSchemaPreview,
        setProgress,
        addLog,
        setResult,
        setError,
        saveSession,
        fetchHistory,
        fetchSessionStatus,
        goals // Access goals from the store
    } = useSessionStore();

    const { token } = useUserStore();
    const abortControllerRef = useRef<AbortController | null>(null);

    const connectToEvents = useCallback(async (sessionId: string) => {
        if (!sessionId || !token) return;

        // Cancel previous connection if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const ctrl = new AbortController();
        abortControllerRef.current = ctrl;

        try {
            await fetchEventSource(`${API_URL}/sessions/events/${sessionId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal: ctrl.signal,
                onopen: async (response) => {
                    if (response.ok && response.status === 200) {
                        console.log("SSE Connection established");
                    } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        // Client error, stop retrying
                        if (response.status === 401) {
                            showToast.error("Session Expired", "Please login again.");
                            // Optional: Trigger global logout here if needed
                        }
                        throw new Error(`Failed to connect: ${response.statusText}`);
                    }
                },
                onmessage: (msg) => {
                    if (!msg.data) return;

                    try {
                        const data = JSON.parse(msg.data);
                        console.log("SSE Event:", data);

                        if (data.status) {
                            setStatus(data.status);
                        }

                        if (data.status === 'PROCESSING') {
                            // Backend might send progress number e.g. { status: 'PROCESSING', progress: 50 }
                            if (typeof data.progress === 'number') {
                                setProgress(data.progress);
                            }
                            // Backend might send log message e.g. { status: 'PROCESSING', message: "Analyzing..." }
                            if (data.message) {
                                addLog(data.message);
                            }

                            // Check for Analysis completion/Schema data
                            if (data.schema_preview || data.columns) {
                                setSchemaPreview({
                                    columns: data.schema_preview?.columns || data.columns || []
                                });
                                // Automatically move to configuration if we have the data
                                setStatus('CONFIGURING');
                            }
                        }

                        if (data.status === 'CONFIGURING') {
                            if (data.schema_preview || data.columns) {
                                setSchemaPreview({
                                    columns: data.schema_preview?.columns || data.columns || []
                                });
                            }
                            setStatus('CONFIGURING');
                        }

                        if (data.status === 'COMPLETED') {
                            setResult(data.resultData);
                            setProgress(100);
                            // Instead of finishing, we move to Goal Configuration using this result
                            setStatus('CONFIGURING');
                            showToast.success("Initialization Complete", "Please define your optimization goals.");
                            window.location.href = `/sessions/${sessionId}`;
                            ctrl.abort();
                        }

                        if (data.status === 'FAILED') {
                            const failMsg = typeof data.message === 'string' ? data.message : (data.error || "Unknown error occurred.");
                            setError(failMsg);
                            setStatus('FAILED');
                            saveSession(); // Auto-save failure
                            showToast.error("Processing Failed", failMsg);
                            ctrl.abort();
                        }
                    } catch (err) {
                        console.error("Error parsing SSE message:", err);
                    }
                },
                onerror: (err) => {
                    console.error("SSE Error:", err);
                    // If we want to stop retrying on certain errors, we can throw
                    // throw err; 
                }
            });
        } catch (error) {
            console.error("SSE Connection Failed:", error);
            setError("Connection lost throughout processing.");
        }
    }, [token, setStatus, setProgress, addLog, setResult, setError, saveSession]);

    const startIngestion = async (sourceFileRaw: File, schemaFileRaw: File | null) => {
        if (!sourceFileRaw) {
            showToast.error("Missing Files", "Please upload a source dataset.");
            return;
        }

        setStatus('PROCESSING');
        setError(null);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('resourceFile', sourceFileRaw);

            if (schemaFileRaw) {
                formData.append('targetFile', schemaFileRaw);
            }

            // Append empty goal object if needed, or omit if optional
            formData.append('goals', JSON.stringify({}));

            const response = await axiosInstance.post('/sessions/init', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.status === 200 || response.status === 201 || response.status === 202) {
                const { sessionId } = response.data.data || response.data;

                if (sessionId) {
                    setSessionId(sessionId);
                    showToast.success("Session Initialized", "Starting analysis...");
                    connectToEvents(sessionId);

                    // Refresh history and fetch latest status after 2 seconds
                    setTimeout(() => {
                        fetchHistory();
                        fetchSessionStatus(sessionId);
                    }, 2000);
                } else {
                    throw new Error("No session ID returned");
                }
            }
        } catch (error: any) {
            console.error("Session Init Failed:", error);
            const rawMsg = error.response?.data?.message || error.response?.data?.error;
            const msg = typeof rawMsg === 'string' ? rawMsg : "Could not start session.";
            setError(msg);
            setStatus('FAILED');
            showToast.error("Initialization Failed", msg);
        }
    };

    const startOptimization = async () => {
        const { sessionId, goals } = useSessionStore.getState();

        if (!sessionId) {
            showToast.error("Missing Session", "No active session found to optimize.");
            return;
        }

        const goalList = Object.values(goals).map(goal => {
            const cleanedGoal: any = { ...goal };

            // Filter and potentially omit columns
            if (cleanedGoal.resource_columns) {
                cleanedGoal.resource_columns = cleanedGoal.resource_columns.filter((c: string) => c.trim() !== "");
                if (cleanedGoal.resource_columns.length === 0) {
                    delete cleanedGoal.resource_columns;
                }
            }

            if (cleanedGoal.target_columns) {
                cleanedGoal.target_columns = cleanedGoal.target_columns.filter((c: string) => c.trim() !== "");
                if (cleanedGoal.target_columns.length === 0) {
                    delete cleanedGoal.target_columns;
                }
            }

            // Clean logic_config
            if (cleanedGoal.logic_config) {
                if (cleanedGoal.logic_config.comparison_column === "") {
                    cleanedGoal.logic_config.comparison_column = null;
                }
            }

            return cleanedGoal;
        });

        if (goalList.length === 0) {
            showToast.error("No Goals", "Please define at least one optimization goal.");
            return;
        }

        setStatus('PROCESSING');
        setError(null);
        setProgress(0);
        addLog("Submitting optimization goals...");

        try {
            const response = await axiosInstance.post(`/sessions/${sessionId}/optimize`, goalList);

            if (response.status === 200 || response.status === 201 || response.status === 202) {
                showToast.success("Optimization Started", "The AI is now processing your request.");
                connectToEvents(sessionId);
            }
        } catch (error: any) {
            console.error("Optimization Failed:", error);
            const rawOptMsg = error.response?.data?.message || error.response?.data?.error;
            const msg = typeof rawOptMsg === 'string' ? rawOptMsg : "Could not start optimization.";
            setError(msg);
            setStatus('FAILED');
            showToast.error("Optimization Failed", msg);
        }
    };

    return {
        startIngestion,
        startOptimization,
        connectToEvents
    };
};
