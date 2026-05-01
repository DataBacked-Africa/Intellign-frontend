"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Sparkles, Loader2, CheckCircle2, FileSpreadsheet, X, Send,
    Bot, User, Trash2, Download, Zap, ChevronRight, Target, Database,
    AlertCircle, BarChart2, Plus, ChevronDown, Mic, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedChat, ChatMessage, GoalDefinition, DataContext, Artifact, AttachedFileInfo } from '@/hooks/useUnifiedChat';
import { useSessionOrchestrator } from '@/hooks/useSessionOrchestrator';
import { useSessionStore } from '@/store/useSessionStore';
import { showToast } from '@/components/ui/CustomToast';
import { useUserStore } from '@/store/useUserStore';
import { useSpeechInput } from '@/hooks/useSpeechInput';

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

// ─── History loading skeleton ─────────────────────────────────────────────────
const HistorySkeleton: React.FC = () => (
    <div className="flex-1 space-y-5 overflow-hidden pb-4" aria-label="Loading history">
        {[
            { user: true, lines: 1, width: 'w-48' },
            { user: false, lines: 3, width: 'w-64' },
            { user: true, lines: 2, width: 'w-56' },
            { user: false, lines: 2, width: 'w-72' },
        ].map((item, i) => (
            <div key={i} className={`flex gap-2.5 items-start ${item.user ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse shrink-0 mt-0.5" />
                <div className={`flex flex-col gap-1.5 max-w-[70%] ${item.user ? 'items-end' : 'items-start'}`}>
                    {Array.from({ length: item.lines }).map((_, li) => (
                        <div
                            key={li}
                            className={`h-3.5 rounded-full bg-gray-200 animate-pulse ${
                                li === item.lines - 1 ? item.width : 'w-full'
                            } ${item.user ? 'bg-gray-300' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// ─── File attachment chips ────────────────────────────────────────────────────
const fmt = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const FileChips: React.FC<{ files: AttachedFileInfo[] }> = ({ files }) => (
    <div className="flex flex-wrap gap-1.5 mb-2">
        {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <FileSpreadsheet className="w-3 h-3 text-[#5C1427] shrink-0" />
                <div className="leading-none">
                    <p className="text-[11px] font-medium text-gray-800 truncate max-w-[140px]">{f.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{fmt(f.size)}</p>
                </div>
            </div>
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

// ─── Artifact renderer ───────────────────────────────────────────────────────
const ArtifactTable: React.FC<{ artifact: Artifact }> = ({ artifact }) => {
    const headers = artifact.headers ?? [];
    const rows = artifact.rows ?? [];
    if (!headers.length && !rows.length) return null;

    return (
        <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden text-xs">
            {artifact.title && (
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    {artifact.title}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    {headers.length > 0 && (
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {headers.map((h, i) => (
                                    <th key={i} className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row, ri) => (
                            <tr key={ri} className="hover:bg-gray-50/50 transition-colors">
                                {row.map((cell, ci) => {
                                    // Colour-code Reward / Penalty badges
                                    const isReward = cell === 'Reward';
                                    const isPenalty = cell === 'Penalty';
                                    return (
                                        <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                            {(isReward || isPenalty) ? (
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                                    isReward ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                )}>
                                                    {cell}
                                                </span>
                                            ) : (
                                                cell
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ArtifactRenderer: React.FC<{ artifacts: Artifact[] }> = ({ artifacts }) => {
    if (!artifacts?.length) return null;
    return (
        <>
            {artifacts.map((a, i) => {
                if (a.type === 'table') return <ArtifactTable key={i} artifact={a} />;
                return null; // future: code, chart, etc.
            })}
        </>
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
    // Strip inline markdown tables from the message when we have structured artifacts —
    // avoids showing the same table twice (once as raw markdown, once as a rendered table).
    const messageText = (msg.artifacts?.some(a => a.type === 'table'))
        ? msg.content.replace(/\|.+\|[\s\S]*?(?=\n\n|\n[^|]|$)/g, '').trim()
        : msg.content;
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className={cn('flex gap-2.5 items-start', isUser && 'flex-row-reverse')}
        >
            <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
                isUser ? 'bg-[#F9F9F9] border border-gray-200/60' : 'bg-gradient-to-br from-[#5C1427] to-[#8A1E3A]'
            )}>
                {isUser ? <User className="w-3.5 h-3.5 text-gray-500" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={cn('max-w-[82%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
                <div className={cn(
                    'text-sm leading-relaxed',
                    isUser ? 'bg-[#F9F9F9] text-gray-800 rounded-2xl rounded-tr-sm border border-gray-200/60 shadow-sm px-4 py-2.5' : 'text-gray-800 pt-1'
                )}>
                    {isLoading ? <TypingIndicator /> : (
                        <>
                            {isUser && msg.attachedFiles && msg.attachedFiles.length > 0 && (
                                <FileChips files={msg.attachedFiles} />
                            )}
                            <div className="whitespace-pre-wrap break-words">{renderMarkdown(messageText)}</div>
                        </>
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
                {/* Structured artifacts (tables, etc.) */}
                {!isLoading && msg.artifacts && msg.artifacts.length > 0 && (
                    <ArtifactRenderer artifacts={msg.artifacts} />
                )}
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
            <div className="h-full bg-[#5C1427] rounded-full transition-all duration-500"
                style={{ width: `${Math.round(confidence * 100)}%` }} />
        </div>
        <span className="font-medium text-gray-600">{Math.round(confidence * 100)}%</span>
    </div>
);

// ─── Quick prompts ────────────────────────────────────────────────────────────
const INGESTION_PROMPTS = [
    'What tables did you identify?',
    'Accept the recommendations and proceed.',
    'Generate realistic sample data for me.',
    'The column mapping looks correct — continue.',
    'Finalize and lock the dataset.',
];

const GOAL_PROMPTS = [
    'Prioritize underserved or high-need areas.',
    'Match staff qualifications to facility requirements.',
    'Minimize total travel or deployment distance.',
    'Ensure equitable workload distribution across teams.',
    'Add a capacity constraint so no site is overloaded.',
];

// ─── Main wizard ──────────────────────────────────────────────────────────────
const SmartUploadWizard: React.FC<{ initialSessionId?: string }> = ({ initialSessionId }) => {
    const {
        sessionId, messages, phase, isComplete, isSending, isLoadingHistory,
        goalModel, dataContext, goals, gaParams, error,
        sendMessage, downloadDataset, reset,
    } = useUnifiedChat(initialSessionId);

    const { startOptimization } = useSessionOrchestrator();
    const { setSessionId, sessionStatus } = useSessionStore();
    const { user } = useUserStore();

    const [input, setInput] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isRunningOptimization, setIsRunningOptimization] = useState(false);

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Stores the text already in the box when recording starts, so interim
    // speech is appended rather than replacing what the user typed.
    const speechBaseRef = useRef('');

    // ── Speech input ──────────────────────────────────────────────────────────
    const { isListening, isSupported: isSpeechSupported, toggle: toggleSpeech } =
        useSpeechInput({
            onTranscript: (text, isFinal) => {
                const base = speechBaseRef.current;
                const sep = base && !base.endsWith(' ') ? ' ' : '';
                const next = (base + sep + text).trimStart();
                setInput(next);
                // Resize textarea to fit
                requestAnimationFrame(() => {
                    if (inputRef.current) {
                        inputRef.current.style.height = 'auto';
                        inputRef.current.style.height =
                            Math.min(inputRef.current.scrollHeight, 150) + 'px';
                    }
                });
                // After a final result, advance the base so the next utterance appends
                if (isFinal) {
                    speechBaseRef.current = next.trimEnd();
                }
            },
        });

    const handleMicToggle = useCallback(() => {
        if (!isListening) {
            // Snapshot current input so speech is appended, not overwritten
            speechBaseRef.current = input.trimEnd();
        }
        toggleSpeech(input);
    }, [isListening, input, toggleSpeech]);

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
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 pb-2">

            {/* ── Header (Only show when not idle to match Gemini's immersive welcome) ───────────────────────── */}
         

            {/* ── Dataset download bar ────────────────────────────────────── */}
            {!isIdle && dataContext && (dataContext.status === 'partial' || dataContext.status === 'complete') && (
                <DatasetDownloadBar context={dataContext} onDownload={downloadDataset} />
            )}

            {/* ── Error banner ────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex-shrink-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                </div>
            )}

            {/* ── History loading skeleton ────────────────────────────────── */}
            {isLoadingHistory && <HistorySkeleton />}

            {/* ── Messages area (only when not idle) ─────────────────────── */}
            {!isLoadingHistory && !isIdle && (
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
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

            {/* ── Empty State / Idle View ──────────────────────────────────── */}
            {!isLoadingHistory && isIdle && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col justify-center w-full max-w-3xl mx-auto"
                >
                    <div className=" mt-10 md:mt-0 text-left px-2">
                        <h1 className="text-4xl md:text-[56px] leading-tight font-semibold mb-2 tracking-tight">
                            <span className="bg-gradient-to-r from-[#5C1427] via-[#731931] to-[#8A1E3A] bg-clip-text text-transparent">
                                Hi {user?.name?.split(' ')[0] || 'there'}
                            </span>
                        </h1>
                        <h2 className="text-4xl md:text-[56px] leading-tight font-semibold text-gray-300 tracking-tight">
                            Where should we start?
                        </h2>
                    </div>

                    <div className="w-full relative bg-[#F9F9F9] rounded-[28px] p-2 shadow-sm focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 transition-all border border-gray-200/60 mt-4">
                        {/* Attached files */}
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-3 pt-2">
                                {attachedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-sm">
                                        <FileSpreadsheet className="w-3 h-3 text-[#5C1427]" />
                                        <span className="max-w-[140px] truncate font-medium">{f.name}</span>
                                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                                            className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => { setInput(e.target.value); speechBaseRef.current = e.target.value; }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={isSending}
                            placeholder={isListening ? 'Listening…' : 'Ask Intellign AI or describe your problem...'}
                            rows={1}
                            className="w-full bg-transparent resize-none outline-none px-4 pt-4 pb-2 text-gray-900 placeholder:text-gray-500 text-base max-h-[150px] disabled:opacity-50 font-medium"
                            style={{ minHeight: '52px' }}
                            onInput={e => {
                                const el = e.target as HTMLTextAreaElement;
                                el.style.height = '52px';
                                el.style.height = Math.min(el.scrollHeight, 150) + 'px';
                            }}
                        />

                        <div className="flex items-center justify-between px-2 pb-1 mt-1">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach files"
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
                                    <Database className="w-4 h-4" />
                                    Data sources
                                </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
                                    Smart <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                                {isSpeechSupported && (
                                    <button
                                        type="button"
                                        onClick={handleMicToggle}
                                        title={isListening ? 'Stop recording' : 'Voice input'}
                                        className={cn(
                                            'relative p-2 rounded-full transition-colors hidden sm:flex items-center justify-center',
                                            isListening
                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                : 'hover:bg-gray-200 text-gray-600'
                                        )}
                                    >
                                        <Mic className="w-5 h-5" />
                                        {isListening && (
                                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                    </button>
                                )}

                                {(input.trim() || attachedFiles.length > 0) && (
                                    <button
                                        onClick={handleSend}
                                        disabled={isSending}
                                        className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-50 ml-1"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.json,.geojson,.parquet,.ods,.feather,.html,.gpkg,.shp,.kml,.tsv"
                            onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
                        />
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {[
                            {
                                icon: <Database className="w-4 h-4 text-[#5C1427]" />,
                                text: "Deploy health workers to facilities",
                                prompt: "I need to assign healthcare workers to clinics and hospitals based on qualifications, availability, and facility needs."
                            },
                            {
                                icon: <Target className="w-4 h-4 text-[#731931]" />,
                                text: "Match field officers to communities",
                                prompt: "I want to assign field officers to communities, matching their expertise to the population's needs and minimising travel distance."
                            },
                            {
                                icon: <Zap className="w-4 h-4 text-[#8A1E3A]" />,
                                text: "Allocate teachers to schools",
                                prompt: "I need to allocate teachers to schools, matching subject specialisations to school requirements and respecting capacity limits."
                            },
                            {
                                icon: <FileSpreadsheet className="w-4 h-4 text-green-600" />,
                                text: "Schedule aid distribution routes",
                                prompt: "I want to optimise the distribution of aid supplies to beneficiary communities, minimising logistics cost and ensuring equitable coverage."
                            },
                        ].map((p, i) => (
                            <button key={i} onClick={() => sendMessage(p.prompt)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#F9F9F9] hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-full text-sm font-medium text-gray-800 transition-all">
                                {p.icon}
                                {p.text}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ── Input Area (when NOT idle, docked to bottom) ─────────────────────────────── */}
            {!isLoadingHistory && !isIdle && (
                <div className="flex-shrink-0 pt-2 border-t border-transparent bg-white/80 backdrop-blur-sm relative z-10 w-full max-w-3xl mx-auto">
                    <div className="w-full relative bg-[#F9F9F9] rounded-[24px] p-1 shadow-sm focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 transition-all border border-gray-200/60">
                        {/* Attached files */}
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-3 pt-2">
                                {attachedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-sm">
                                        <FileSpreadsheet className="w-3 h-3 text-[#5C1427]" />
                                        <span className="max-w-[140px] truncate font-medium">{f.name}</span>
                                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                                            className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => { setInput(e.target.value); speechBaseRef.current = e.target.value; }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={isSending}
                            placeholder={
                                isListening
                                    ? 'Listening…'
                                    : phase === 'goal_definition'
                                        ? 'Describe your optimization goals...'
                                        : 'Ask Intellign AI or describe your problem...'
                            }
                            rows={1}
                            className="w-full bg-transparent resize-none outline-none px-4 pt-3 pb-1 text-gray-900 placeholder:text-gray-500 text-sm max-h-[120px] disabled:opacity-50 font-medium"
                            style={{ minHeight: '44px' }}
                            onInput={e => {
                                const el = e.target as HTMLTextAreaElement;
                                el.style.height = '44px';
                                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                            }}
                        />

                        <div className="flex items-center justify-between px-2 pb-1">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach files"
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                {isSpeechSupported && (
                                    <button
                                        type="button"
                                        onClick={handleMicToggle}
                                        title={isListening ? 'Stop recording' : 'Voice input'}
                                        className={cn(
                                            'relative p-2 rounded-full transition-colors',
                                            isListening
                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                : 'hover:bg-gray-200 text-gray-600'
                                        )}
                                    >
                                        <Mic className="w-4 h-4" />
                                        {isListening && (
                                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleSend}
                                    disabled={(!input.trim() && attachedFiles.length === 0) || isSending}
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ml-1',
                                        (input.trim() || attachedFiles.length > 0) && !isSending
                                            ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    )}
                                >
                                    {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 ml-0.5" />}
                                </button>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.json,.geojson,.parquet,.ods,.feather,.html,.gpkg,.shp,.kml,.tsv"
                            onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Intellign AI can make mistakes. Consider verifying important information.</p>
                </div>
            )}
        </div>
    );
};

export default SmartUploadWizard;
