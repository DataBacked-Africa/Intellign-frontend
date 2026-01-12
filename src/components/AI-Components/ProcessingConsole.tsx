import React, { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { Loader2, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ProcessingConsole = () => {
    const { logs, progress, sessionStatus, error, clearSession } = useSessionStore();
    const [latestLog, setLatestLog] = useState<string>("Initializing...");

    // Update latest log when logs array changes
    useEffect(() => {
        if (logs.length > 0) {
            setLatestLog(logs[logs.length - 1]);
        }
    }, [logs]);

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 p-8">

            {/* Status Icon / Spinner */}
            <div className="relative">
                {sessionStatus === 'PROCESSING' && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#5c1427] blur-xl opacity-20 animate-pulse rounded-full"></div>
                        <Loader2 className="w-10 h-10 text-[#5c1427] animate-spin relative z-10" />
                    </div>
                )}
                {sessionStatus === 'COMPLETED' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </motion.div>
                )}
                {sessionStatus === 'FAILED' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-12 h-12 text-red-600" />
                    </motion.div>
                )}
            </div>

            {/* Main Progress & Text Area */}
            <div className="w-full flex flex-col items-center gap-4">

                {/* Progress Bar Container */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                    <motion.div
                        className={cn(
                            "h-full rounded-full absolute top-0 left-0",
                            sessionStatus === 'FAILED' ? "bg-red-500" : "bg-gradient-to-r from-[#5c1427] to-[#9d2b4e]"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(5, progress)}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Log Text (Gemini-style liner) */}
                <div className="h-6 overflow-hidden flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={latestLog}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className={cn(
                                "text-sm font-medium text-center",
                                error ? "text-red-500" : "text-gray-600"
                            )}
                        >
                            {error || latestLog}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* Action Buttons (Reset/New Upload/Cancel) */}
            <div className="flex gap-4 mt-4">
                {sessionStatus === 'PROCESSING' && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={clearSession}
                        className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-red-500/20 shadow-sm rounded-full text-sm font-medium text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancel
                    </motion.button>
                )}

                {(sessionStatus === 'COMPLETED' || sessionStatus === 'FAILED') && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={clearSession}
                        className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        {sessionStatus === 'FAILED' ? "Try Again" : "Start New Upload"}
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default ProcessingConsole;
