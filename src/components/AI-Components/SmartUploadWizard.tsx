"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Sparkles, Loader2, CheckCircle2, FileSpreadsheet, X, Send,
    Bot, User, Trash2, Download, Zap, ChevronRight, Target, Database,
    AlertCircle, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedChat, ChatMessage, GoalDefinition, DataContext } from '@/hooks/useUnifiedChat';
import { useSessionOrchestrator } from '@/hooks/useSessionOrchestrator';
import { useSessionStore } from '@/store/useSessionStore';
import { showToast } from '@/components/ui/CustomToast';

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
    <div className="flex items-center gap-1 py-1">
        {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
        ))}
    </div>
);

// ─── Inline markdown ──────────────────────────────────────────────────────────
const renderMarkdown = (text: string): React.ReactNode[] =>
    text.split('\n').map((line, idx, arr) => {
        const isBullet = /^[-*]\s+/.test(line);
        const content = isBullet ? line.replace(/^[-*]\s+/, '') : line;
        const parts: React.ReactNode[] = [];
        const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(content)) !== null) {
            if (m.index > last) parts.push(content.slice(last, m.index));
            if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>);
            else if (m[2]) parts.push(<code key={m.index} className="px-1 py-0.5 bg-black/10 rounded text-[11px] font-mono">{m[2]}</code>);
            last = m.index + m[0].length;
        }
        if (last < content.length) parts.push(content.slice(last));
        const rendered = parts.length ? parts : [content];
        return (
            <React.Fragment key={idx}>
                {isBullet
                    ? <div className="flex items-start gap-1.5 my-0.5"><span className="mt-2 w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-40" /><span>{rendered}</span></div>
                    : <span>{rendered}</span>}
                {idx < arr.length - 1 && !isBullet && <br />}
            </React.Fragment>
        );
    });

// ─── Data preview card ────────────────────────────────────────────────────────
const DataPreviewCard: React.FC<{ actionTaken: string; preview: any; onDownload?: (table: 'resources' | 'targets') => void }> = ({ actionTaken, preview, onDownload }) => {
    if (!preview) return null;

    if (actionTaken === 'ingest_files' && preview.candidate_details) {
        return (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 overflow-hidden text-xs">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border-b border-blue-200">
                    <Database className="w-3 h-3 text-blue-600" />
                    <span className="font-bold text-blue-800 uppercase tracking-wide">
                        {preview.tables_found?.length ?? 0} Tables Found
                    </span>
                </div>
                <div className="p-3 space-y-2">
                    {preview.candidate_details?.map((c: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 bg-white/80 rounded-lg px-2.5 py-2 border border-blue-100">
                            <span className={cn(
                                "mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                c.type === 'resource' ? 'bg-green-100 text-green-700' :
                                c.type === 'target' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-600'
                            )}>{c.type ?? 'unknown'}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">{c.label}</p>
                                <p className="text-gray-500">{c.rows} rows · {c.columns?.length ?? 0} columns</p>
                                {c.reasoning && <p className="text-gray-400 italic mt-0.5">{c.reasoning}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (actionTaken === 'confirm_ingest') {
        return (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50/60 overflow-hidden text-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-green-100 border-b border-green-200">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="font-bold text-green-800 uppercase tracking-wide">Data Structured</span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => onDownload?.('resources')} className="flex items-center gap-1 px-2 py-0.5 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors">
                            <Download className="w-2.5 h-2.5" /> Resources
                        </button>
                        <button onClick={() => onDownload?.('targets')} className="flex items-center gap-1 px-2 py-0.5 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors">
                            <Download className="w-2.5 h-2.5" /> Targets
                        </button>
                    </div>
                </div>
                <div className="p-3 flex gap-6">
                    {preview.resources_rows != null && (
                        <div><p className="text-gray-400">Resources</p><p className="font-bold text-gray-900">{preview.resources_rows} rows</p></div>
                    )}
                    {preview.targets_rows != null && (
                        <div><p className="text-gray-400">Targets</p><p className="font-bold text-gray-900">{preview.targets_rows} rows</p></div>
                    )}
                </div>
            </div>
        );
    }

    if (['generate_sample_dataset', 'generate_missing_tables', 'augment_missing_data'].includes(actionTaken)) {
        const rows = preview.preview ?? [];
        return (
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 overflow-hidden text-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-violet-100 border-b border-violet-200">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-violet-600" />
                        <span className="font-bold text-violet-800 uppercase tracking-wide">
                            {actionTaken === 'augment_missing_data' ? 'Augmented Data' : 'Synthetic Dataset'}
                            {preview.num_rows ? ` · ${preview.num_rows} rows` : ''}
                        </span>
                    </div>
                    <button onClick={() => onDownload?.('resources')} className="flex items-center gap-1 px-2 py-0.5 bg-violet-700 text-white rounded-md hover:bg-violet-800 transition-colors">
                        <Download className="w-2.5 h-2.5" /> Download
                    </button>
                </div>
                {rows.length > 0 && (
                    <div className="overflow-x-auto p-3">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>{Object.keys(rows[0]).map(k => (
                                    <th key={k} className="pr-4 pb-1 text-gray-400 font-semibold whitespace-nowrap">{k}</th>
                                ))}</tr>
                            </thead>
                            <tbody>
                                {rows.slice(0, 3).map((row: any, i: number) => (
                                    <tr key={i} className="border-t border-violet-100">
                                        {Object.values(row).map((v: any, j: number) => (
                                            <td key={j} className="pr-4 py-1 text-gray-700 whitespace-nowrap">{String(v)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

// ─── Goals panel (shown when goals come in during goal_definition phase) ──────
const GoalsPanel: React.FC<{ goals: GoalDefinition[] }> = ({ goals }) => {
    if (!goals.length) return null;
    return (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 overflow-hidden text-xs">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 border-b border-amber-200">
                <Target className="w-3 h-3 text-amber-600" />
                <span className="font-bold text-amber-800 uppercase tracking-wide">
                    {goals.length} Optimization Goal{goals.length !== 1 ? 's' : ''} Defined
                </span>
            </div>
            <div className="p-3 space-y-2">
                {goals.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/80 rounded-lg px-2.5 py-2 border border-amber-100">
                        <span className={cn(
                            "mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                            g.award_type === 'Reward' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>{g.award_type}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{g.description}</p>
                            <p className="text-gray-500">Weight: {g.weight}% · {g.logic_config?.logic_type}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Dataset download buttons (shown when data_context has metadata) ──────────
const DatasetDownloadBar: React.FC<{ context: DataContext; onDownload: (t: 'resources' | 'targets') => void }> = ({ context, onDownload }) => {
    if (context.status === 'none') return null;
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs flex-shrink-0">
            <span className="text-gray-400 font-medium">Download:</span>
            {context.resources_metadata && (
                <button onClick={() => onDownload('resources')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors">
                    <Download className="w-3 h-3" /> Resources ({context.resources_metadata.count})
                </button>
            )}
            {context.targets_metadata && (
                <button onClick={() => onDownload('targets')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors">
                    <Download className="w-3 h-3" /> Targets ({context.targets_metadata.count})
                </button>
            )}
        </div>
    );
};

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
    msg: ChatMessage;
    isLoading?: boolean;
    onDownload: (t: 'resources' | 'targets') => void;
}> = ({ msg, isLoading, onDownload }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className={cn('flex gap-2.5 items-start', isUser && 'flex-row-reverse')}
        >
            <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
                isUser ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            )}>
                {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={cn('max-w-[82%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
                <div className={cn(
                    'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    isUser ? 'bg-gray-900 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                    {isLoading ? <TypingIndicator /> : (
                        <div className="whitespace-pre-wrap break-words">{renderMarkdown(msg.content)}</div>
                    )}
                    {!isLoading && msg.actionTaken && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            {msg.actionTaken}
                        </div>
                    )}
                    {!isLoading && (
                        <div className={cn('text-[10px] mt-1 opacity-40', isUser ? 'text-right' : 'text-left')}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>
                {/* Data preview below the bubble */}
                {!isLoading && msg.actionTaken && msg.dataPreview && (
                    <DataPreviewCard
                        actionTaken={msg.actionTaken}
                        preview={msg.dataPreview}
                        onDownload={onDownload}
                    />
                )}
                {/* Goals panel */}
                {!isLoading && msg.goals && msg.goals.length > 0 && (
                    <GoalsPanel goals={msg.goals} />
                )}
            </div>
        </motion.div>
    );
};

// ─── Confidence bar ───────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => (
    <div className="flex items-center gap-2 text-xs text-gray-400">
        <BarChart2 className="w-3 h-3" />
        <span>Goal confidence</span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(confidence * 100)}%` }} />
        </div>
        <span className="font-medium text-gray-600">{Math.round(confidence * 100)}%</span>
    </div>
);

// ─── Quick prompts ────────────────────────────────────────────────────────────
const INGESTION_PROMPTS = [
    'What tables did you find?',
    'Use the AI recommendations and proceed.',
    'Generate sample data for me.',
    'The mapping looks good, go ahead.',
    'Finalize the data.',
];

const GOAL_PROMPTS = [
    'Minimize cost while maximizing coverage.',
    'Prioritize skill matching above all.',
    'Add a geographic proximity constraint.',
    'Increase weight of first goal to 80%.',
];

// ─── Main wizard ──────────────────────────────────────────────────────────────
const SmartUploadWizard: React.FC<{ initialSessionId?: string }> = ({ initialSessionId }) => {
    const {
        sessionId, messages, phase, isComplete, isSending,
        goalModel, dataContext, goals, gaParams, error,
        sendMessage, downloadDataset, reset,
    } = useUnifiedChat(initialSessionId);

    const { startOptimization } = useSessionOrchestrator();
    const { setSessionId, sessionStatus } = useSessionStore();

    const [input, setInput] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isRunningOptimization, setIsRunningOptimization] = useState(false);

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync sessionId to global store so pages can read it
    useEffect(() => {
        setSessionId(sessionId);
    }, [sessionId, setSessionId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    const handleSend = useCallback(() => {
        const trimmed = input.trim();
        if ((!trimmed && attachedFiles.length === 0) || isSending) return;
        setInput('');
        setAttachedFiles([]);
        if (inputRef.current) inputRef.current.style.height = '42px';
        sendMessage(trimmed || 'Here are my files.', attachedFiles);
    }, [input, attachedFiles, isSending, sendMessage]);

    const handleRunOptimization = async () => {
        setIsRunningOptimization(true);
        await startOptimization(sessionId);
        setIsRunningOptimization(false);
    };

    const addFiles = (incoming: File[]) =>
        setAttachedFiles(prev => [...prev, ...incoming.filter(f => !prev.find(p => p.name === f.name))]);

    const promptsForPhase = phase === 'goal_definition' ? GOAL_PROMPTS : INGESTION_PROMPTS;
    const isIdle = messages.length === 0;

    return (
        <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-1 pb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Bot className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Intellign AI</p>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                phase === 'goal_definition'
                                    ? 'bg-amber-100 text-amber-700'
                                    : dataContext?.status === 'complete'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                            )}>
                                {phase === 'goal_definition' ? 'Goal Definition' : 'Data Ingestion'}
                            </span>
                            {goalModel && goalModel.confidence > 0 && (
                                <ConfidenceBar confidence={goalModel.confidence} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Run Optimization — shown when is_complete */}
                    {isComplete && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleRunOptimization}
                            disabled={isRunningOptimization || sessionStatus === 'PROCESSING'}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 shadow-lg shadow-black/10"
                        >
                            {isRunningOptimization || sessionStatus === 'PROCESSING'
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
                                : <><Zap className="w-4 h-4" /> Run Optimization</>}
                        </motion.button>
                    )}
                    <button onClick={reset} title="Start over"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Dataset download bar ────────────────────────────────────── */}
            {dataContext && (dataContext.status === 'partial' || dataContext.status === 'complete') && (
                <DatasetDownloadBar context={dataContext} onDownload={downloadDataset} />
            )}

            {/* ── Error banner ────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex-shrink-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                </div>
            )}

            {/* ── Empty state ──────────────────────────────────────────────── */}
            {isIdle && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-12"
                >
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Start by describing your problem</p>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs">
                            Tell me what you want to optimize — or upload your data files to get started.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[
                            'I need to assign nurses to clinics',
                            'Match teachers to schools by subject',
                            'Allocate delivery drivers to zones',
                        ].map(p => (
                            <button key={p} onClick={() => sendMessage(p)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600 hover:text-gray-900 transition-colors">
                                {p}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ── Messages ─────────────────────────────────────────────────── */}
            {!isIdle && (
                <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                    {messages.map((msg, i) => {
                        const isLastAssistant = msg.role === 'assistant';
                        const showLoading = isLastAssistant && isSending && i === messages.length - 1 && msg.content === '';
                        return (
                            <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isLoading={showLoading}
                                onDownload={downloadDataset}
                            />
                        );
                    })}

                    {/* Phase-appropriate quick prompts */}
                    {!isSending && messages.length > 0 && !isComplete && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {promptsForPhase.map(p => (
                                <button key={p} onClick={() => sendMessage(p)}
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600 hover:text-gray-900 transition-colors">
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Goals summary at bottom of goal_definition phase */}
                    {phase === 'goal_definition' && goals.length > 0 && (
                        <div className="pt-2">
                            <GoalsPanel goals={goals} />
                        </div>
                    )}

                    <div ref={endRef} />
                </div>
            )}

            {/* ── Input area ───────────────────────────────────────────────── */}
            <div className="flex-shrink-0 pt-3 border-t border-gray-100">
                {/* Attached files */}
                {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attachedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                                <FileSpreadsheet className="w-3 h-3 text-gray-400" />
                                <span className="max-w-[140px] truncate">{f.name}</span>
                                <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                                    className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    {/* File attach button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach files"
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".csv,.xlsx,.xls,.json,.geojson,.parquet,.ods,.feather,.html,.gpkg,.shp,.kml,.tsv"
                        onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
                    />

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        disabled={isSending}
                        placeholder={
                            phase === 'goal_definition'
                                ? 'Describe your optimization goals...'
                                : attachedFiles.length > 0
                                    ? 'Add a message or just hit send...'
                                    : 'Describe your problem or attach data files...'
                        }
                        rows={1}
                        className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:bg-white transition-all max-h-[120px] disabled:opacity-50"
                        style={{ minHeight: '42px' }}
                        onInput={e => {
                            const el = e.target as HTMLTextAreaElement;
                            el.style.height = '42px';
                            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                        }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={(!input.trim() && attachedFiles.length === 0) || isSending}
                        className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                            (input.trim() || attachedFiles.length > 0) && !isSending
                                ? 'bg-gray-900 hover:bg-gray-700 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        )}
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line · Attach files any time</p>
            </div>
        </div>
    );
};

export default SmartUploadWizard;
