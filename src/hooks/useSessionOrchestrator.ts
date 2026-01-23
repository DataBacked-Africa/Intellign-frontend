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
        fetchHistory
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
                            ctrl.abort();
                        }

                        if (data.status === 'FAILED') {
                            setError(data.message || "Unknown error occurred.");
                            setStatus('FAILED');
                            saveSession(); // Auto-save failure
                            showToast.error("Processing Failed", data.message);
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

    const startIngestion = async () => {
        if (!sourceFile) {
            showToast.error("Missing Files", "Please upload a source dataset.");
            return;
        }

        setStatus('PROCESSING');
        setError(null);
        setProgress(0);

        try {
            // Prepare payload
            const payload = {
                files: {
                    source: {
                        url: sourceFile.url,
                        publicId: sourceFile.publicId,
                        meta: {
                            mimeType: sourceFile.format, // Cloudinary provides 'pdf', 'csv' etc.
                            size: sourceFile.size
                        }
                    },
                    ...(schemaFile && {
                        constraints: {
                            url: schemaFile.url,
                            publicId: schemaFile.publicId,
                            meta: {
                                mimeType: schemaFile.format,
                                size: schemaFile.size
                            }
                        }
                    })
                }
                // goals removed from init payload
            };

            const response = await axiosInstance.post('/sessions/init', payload);

            if (response.status === 202) {
                const { sessionId } = response.data.data || response.data; // Adjust based on actual API

                if (sessionId) {
                    setSessionId(sessionId);
                    showToast.success("Session Initialized", "Starting analysis...");
                    connectToEvents(sessionId);

                    // Refresh history after 3 seconds to update sidebar with new session
                    setTimeout(() => {
                        fetchHistory();
                    }, 3000);
                } else {
                    throw new Error("No session ID returned");
                }
            }
        } catch (error: any) {
            console.error("Session Init Failed:", error);
            const msg = error.response?.data?.message || "Could not start session.";
            setError(msg);
            setStatus('FAILED');
            showToast.error("Initialization Failed", msg);
        }
    };

    return {
        startIngestion,
        connectToEvents // Exposed just in case, but startIngestion calls it automatically
    };
};
