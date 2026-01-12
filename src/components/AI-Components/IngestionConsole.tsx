"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Check, Loader2, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngestionConsoleProps {
    onComplete?: () => void;
}

const MOCK_LOGS = [
    { text: "Initializing secure socket handshake...", delay: 800 },
    { text: "Verifying user credentials...", delay: 1500 },
    { text: "Established connection to Ingestion Node (us-east-1).", delay: 2200 },
    { text: "Uploading Source Dataset [source.csv]...", delay: 3000 },
    { text: ">> 25% uploaded...", delay: 3500 },
    { text: ">> 85% uploaded...", delay: 4000 },
    { text: "Source upload complete. Verifying integrity...", delay: 4800 },
    { text: "Parsing Constraint Schema...", delay: 5500 },
    { text: "Validating schema against source columns...", delay: 6500 },
    { text: "Warning: Low confidence match on 'InvoiceDate' (88%). Auto-correcting...", delay: 7200, type: 'warning' },
    { text: "Schema validation successful.", delay: 8000 },
    { text: "Initiating Vector Optimization...", delay: 8800 },
    { text: "Ingestion Sequence Complete. Waiting for Analysis...", delay: 9500, type: 'success' }
];

interface LogMessage {
    text: string;
    type?: 'info' | 'warning' | 'success';
}

const IngestionConsole: React.FC<IngestionConsoleProps> = ({ onComplete }) => {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll into view on mount
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        let timeouts: NodeJS.Timeout[] = [];

        MOCK_LOGS.forEach((log, index) => {
            const timeout = setTimeout(() => {
                setLogs(prev => [...prev, { text: log.text, type: log.type as any ?? 'info' }]);

                // Auto scroll to bottom
                if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
                }

                if (index === MOCK_LOGS.length - 1) {
                    onComplete?.();
                }

            }, log.delay);
            timeouts.push(timeout);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [onComplete]);

    return (
        <div ref={containerRef} className="w-full max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#0f1115] rounded-xl border border-[#333] shadow-2xl overflow-hidden font-mono text-sm md:text-base">
                {/* Header */}
                <div className="bg-[#1a1d24] px-4 py-2 border-b border-[#333] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Terminal className="w-4 h-4" />
                        <span className="text-xs font-semibold tracking-wider">SYSTEM CONSOLE</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 h-[400px] overflow-y-auto bg-black/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    <div className="flex flex-col gap-2">
                        {logs.map((log, i) => (
                            <div key={i} className={cn(
                                "flex items-start gap-3 fade-in duration-300",
                                log.type === 'warning' ? "text-yellow-400" :
                                    log.type === 'success' ? "text-green-400" : "text-gray-300"
                            )}>
                                <span className="text-gray-600 select-none min-w-[24px]">
                                    {`>`}
                                </span>
                                <span className="break-words">
                                    {log.text}
                                </span>
                                {loadingIcon(i, logs.length, log.type)}
                            </div>
                        ))}
                        {logs.length < MOCK_LOGS.length && (
                            <div className="flex items-center gap-2 text-[#5c1427] animate-pulse pl-9">
                                <span className="w-2 h-4 bg-[#5c1427] block" />
                            </div>
                        )}
                        <div ref={bottomRef} className="h-2" />
                    </div>
                </div>

                {/* Footer Status */}
                <div className="bg-[#1a1d24] px-4 py-2 border-t border-[#333] flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-green-500">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Connected</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 border-l border-gray-700 pl-4">
                        <Server className="w-3 h-3" />
                        <span>Latency: 24ms</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

function loadingIcon(index: number, total: number, type?: string) {
    if (type === 'success') return <Check className="w-4 h-4 ml-2" />;
    return null;
}


export default IngestionConsole;
