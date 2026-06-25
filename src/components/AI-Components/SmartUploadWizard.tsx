"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Sparkles, Loader2, CheckCircle2, FileSpreadsheet, X, Send,
    Bot, User, Trash2, Download, Zap, ChevronRight, Target, Database,
    AlertCircle, BarChart2, Plus, ChevronDown, Mic, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedChat, ChatMessage, AttachedFileInfo } from '@/hooks/useUnifiedChat';
import { GoalDefinition, GoalModel, DataContext, Artifact } from '@/types/models';
import { useSessionStore } from '@/store/useSessionStore';
import { showToast } from '@/components/ui/CustomToast';
import { useUserStore } from '@/store/useUserStore';
import { useSpeechInput } from '@/hooks/useSpeechInput';
import GoalDetailPanel from '@/components/AI-Components/GoalDetailPanel';
import { useCanvas } from '@/contexts/CanvasContext';
import { SuggestedResponseChips } from '@/components/AI-Components/SuggestedResponseChips';
import { MultiQuestionChips, QuestionGroup } from '@/components/AI-Components/MultiQuestionChips';

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
                <FileSpreadsheet className="w-3 h-3 text-[var(--brand-maroon)] shrink-0" />
                <div className="leading-none">
                    <p className="text-[11px] font-medium text-gray-800 truncate max-w-[140px]">{f.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{fmt(f.size)}</p>
                </div>
            </div>
        ))}
    </div>
);

// ─── Inline markdown (bold + code) ───────────────────────────────────────────
const renderInline = (content: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let last = 0; let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
        if (m.index > last) parts.push(content.slice(last, m.index));
        if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>);
        else if (m[2]) parts.push(<code key={m.index} className="px-1 py-0.5 bg-black/10 rounded text-[11px] font-mono">{m[2]}</code>);
        last = m.index + m[0].length;
    }
    if (last < content.length) parts.push(content.slice(last));
    return parts.length ? parts : [content];
};

// ─── Full markdown renderer (supports tables) ─────────────────────────────────
const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect table: current line has pipes AND next line is a separator row
        const isTableHeader =
            trimmed.startsWith('|') && trimmed.endsWith('|') &&
            i + 1 < lines.length &&
            /^\|[\s|:-]+\|/.test(lines[i + 1].trim());

        if (isTableHeader) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                tableLines.push(lines[i]);
                i++;
            }

            if (tableLines.length >= 2) {
                const parseRow = (l: string) =>
                    l.split('|').slice(1, -1).map(c => c.trim());

                const isSep = (l: string) => /^[\s|:-]+$/.test(l.replace(/\|/g, ''));
                const headers = parseRow(tableLines[0]);
                const bodyRows = tableLines.slice(2).filter(l => !isSep(l)).map(parseRow);

                result.push(
                    <div key={`tbl-${i}`} className="overflow-x-auto my-2 rounded-lg border border-gray-200 text-xs">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {headers.map((h, hi) => (
                                        <th key={hi} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                            {renderInline(h)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bodyRows.map((row, ri) => (
                                    <tr key={ri} className="border-t border-gray-100 even:bg-gray-50/40">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-3 py-2 text-gray-700">
                                                {renderInline(cell)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }

        // Normal line: bullets and inline formatting
        const isBullet = /^[-*]\s+/.test(line);
        const content = isBullet ? line.replace(/^[-*]\s+/, '') : line;
        const rendered = renderInline(content);
        const isLast = i === lines.length - 1;

        result.push(
            <React.Fragment key={i}>
                {isBullet
                    ? <div className="flex items-start gap-1.5 my-0.5"><span className="mt-2 w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-40" /><span>{rendered}</span></div>
                    : <span>{rendered}</span>}
                {!isLast && !isBullet && <br />}
            </React.Fragment>
        );
        i++;
    }

    return result;
};

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
const GoalsPanel: React.FC<{ goals: GoalDefinition[]; onViewGoal: (goal: GoalDefinition, idx: number) => void }> = ({ goals, onViewGoal }) => {
    if (!goals.length) return null;
    const total = goals.reduce((s, g) => s + (g.weight ?? 0), 0);
    return (
        <div className="mt-3 rounded-xl border border-[var(--brand-maroon)]/20 bg-[var(--brand-maroon)]/5 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--brand-maroon)]/10 border-b border-[var(--brand-maroon)]/20">
                <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-[var(--brand-maroon)]" />
                    <span className="font-bold text-[var(--brand-maroon)] uppercase tracking-wide">
                        {goals.length} Goal{goals.length !== 1 ? 's' : ''} Defined
                    </span>
                </div>
                <span className={cn(
                    'font-mono font-bold text-[10px]',
                    total === 100 ? 'text-emerald-600' : 'text-amber-600'
                )}>
                    {total}% total
                </span>
            </div>
            <div className="p-3 space-y-2">
                {goals.map((g, i) => (
                    <div key={i} className="bg-white rounded-lg px-2.5 py-2 border border-[var(--brand-maroon)]/10 space-y-1.5">
                        <div className="flex items-start gap-2">
                            <span className={cn(
                                'mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold',
                                g.award_type === 'Reward' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            )}>{g.award_type}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 leading-snug">{g.description}</p>
                                <p className="text-gray-400 text-[10px] mt-0.5">{g.logic_config?.logic_type?.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[var(--brand-maroon)] font-bold tabular-nums">{g.weight}%</span>
                                <button
                                    onClick={() => onViewGoal(g, i)}
                                    className="text-[10px] text-gray-400 hover:text-[var(--brand-maroon)] underline underline-offset-2 transition-colors"
                                >view</button>
                            </div>
                        </div>
                        {/* Weight bar */}
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--brand-maroon)] rounded-full transition-all duration-500"
                                style={{ width: `${g.weight ?? 0}%` }}
                            />
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
        <div className="flex items-center gap-2 px-3 py-2 border-b text-xs flex-shrink-0" style={{ background: 'var(--brand-bone-deep)', borderColor: 'var(--border-subtle)' }}>
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
    onViewGoal: (goal: GoalDefinition, idx: number) => void;
}> = ({ msg, isLoading, onDownload, onViewGoal }) => {
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
            <div
                className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm', isUser ? '' : 'bg-gradient-to-br from-[var(--brand-maroon)] to-[var(--brand-maroon-bright)]')}
                style={isUser ? { background: 'var(--product-panel)', border: '1px solid var(--border-subtle)', color: 'var(--fg-tertiary)' } : {}}
            >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={cn('max-w-[82%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
                <div
                    className={cn('text-sm leading-relaxed', isUser ? 'rounded-2xl rounded-tr-sm shadow-sm px-4 py-2.5' : 'pt-1')}
                    style={isUser ? { background: 'var(--product-panel)', color: 'var(--fg-primary)', border: '1px solid rgba(0,0,0,0.05)' } : { color: 'var(--fg-primary)' }}
                >
                    {isLoading ? <TypingIndicator /> : (
                        <>
                            {isUser && msg.attachedFiles && msg.attachedFiles.length > 0 && (
                                <FileChips files={msg.attachedFiles} />
                            )}
                            <div className="whitespace-pre-wrap break-words">{renderMarkdown(messageText)}</div>
                        </>
                    )}
                    {!isLoading && msg.actionTaken && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md w-fit" style={{ background: 'var(--brand-maroon-50)', color: 'var(--brand-maroon-deep)' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            {msg.actionTaken}
                        </div>
                    )}
                    {!isLoading && (
                        <div className={cn('flex items-center gap-2 mt-1', isUser ? 'justify-end' : 'justify-start')}>
                            <span className="text-[10px] opacity-40">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isUser && msg.content && (
                                <button
                                    onClick={() => navigator.clipboard?.writeText(msg.content)}
                                    title="Copy message"
                                    aria-label="Copy message"
                                    className="text-[10px] opacity-30 hover:opacity-80 underline underline-offset-2 transition-opacity cursor-pointer"
                                >copy</button>
                            )}
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
                    <GoalsPanel goals={msg.goals} onViewGoal={onViewGoal} />
                )}
            </div>
        </motion.div>
    );
};

// ─── Context bar ──────────────────────────────────────────────────────────────
const ContextBar: React.FC<{
    goalModel: GoalModel | null;
    dataContext: DataContext | null;
    phase: string;
    isComplete: boolean;
    goalsCount: number;
    onRun: () => void;
}> = ({ goalModel, dataContext, phase, isComplete, goalsCount, onRun }) => {
    // Show even with null dataContext (resumed sessions) — hide only if nothing meaningful to show
    if (!goalModel && !dataContext) return null;
    const resCount = dataContext?.resources_metadata?.count;
    const tgtCount = dataContext?.targets_metadata?.count;
    const problemName =
        goalModel?.description ||
        (goalModel?.entities?.resources?.name && goalModel?.entities?.targets?.name
            ? `${goalModel.entities.resources.name} → ${goalModel.entities.targets.name}`
            : goalModel?.problem_type?.replace(/_/g, ' ') ?? 'Optimization');
    const statusLabel = isComplete ? 'Ready' : phase === 'goal_definition' ? 'Defining goals' : 'Ingesting';
    const statusColor = isComplete
        ? 'bg-emerald-100 text-emerald-700'
        : phase === 'goal_definition'
        ? 'bg-[var(--brand-maroon)]/10 text-[var(--brand-maroon)]'
        : 'bg-amber-100 text-amber-700';
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[16px] text-xs mb-1.5 flex-shrink-0 flex-wrap shadow-sm" style={{ background: 'var(--brand-bone)', border: '1px solid var(--brand-bone-deep)' }}>
            <span className="font-semibold text-gray-900 truncate max-w-[220px]">{problemName}</span>
            <span className="text-gray-200 select-none">·</span>
            {(resCount != null || tgtCount != null) && (
                <>
                    <span className="flex items-center gap-1 text-gray-500">
                        <Database className="w-3 h-3 shrink-0" />
                        {resCount != null && <span><b className="text-gray-800 tabular-nums">{resCount}</b> resources</span>}
                        {resCount != null && tgtCount != null && <span className="text-gray-300 mx-0.5">·</span>}
                        {tgtCount != null && <span><b className="text-gray-800 tabular-nums">{tgtCount}</b> targets</span>}
                    </span>
                    <span className="text-gray-200 select-none">·</span>
                </>
            )}
            {goalsCount > 0 && (
                <>
                    <span className="flex items-center gap-1 text-gray-500">
                        <Target className="w-3 h-3 shrink-0" />
                        <b className="text-gray-800 tabular-nums">{goalsCount}</b> goals
                    </span>
                    <span className="text-gray-200 select-none">·</span>
                </>
            )}
            <span className={cn('px-2 py-0.5 rounded-full font-semibold', statusColor)}>{statusLabel}</span>
            {isComplete && (
                <button
                    onClick={onRun}
                    className="ml-auto flex items-center gap-1 px-3 py-1 bg-[var(--brand-maroon)] hover:bg-[#7a1b35] text-white rounded-full font-semibold transition-colors"
                >
                    <Zap className="w-3 h-3" /> Run
                </button>
            )}
        </div>
    );
};

// ─── Readiness strip ──────────────────────────────────────────────────────────
const ReadinessStrip: React.FC<{
    dataContext: DataContext | null;
    goalsCount: number;
    isComplete: boolean;
    phase: string;
    onOpenCanvas: (tab: 'datasets' | 'goals' | 'results' | 'monitor') => void;
}> = ({ dataContext, goalsCount, isComplete, phase, onOpenCanvas }) => {
    const { chat: sharedChat, sessionStatus } = useSessionStore();
    const hint = sharedChat.phaseUiHint;

    // Five-step ladder: Goal → Data → Goals → Run → Results.
    const phaseIsPostIngestion = ['goal_definition', 'finalization', 'optimization', 'optimization_review'].includes(phase);
    const goalCaptured = phase !== 'ingestion' || phaseIsPostIngestion;
    const dataReady = dataContext
        ? (dataContext.status === 'partial' || dataContext.status === 'complete')
        : phaseIsPostIngestion || isComplete;
    const goalsReady = goalsCount > 0 || (sharedChat.goals?.length ?? 0) > 0 || isComplete;
    const running = hint === 'running' || sessionStatus === 'PROCESSING';
    const resultsReady = hint === 'results' || sessionStatus === 'COMPLETED';

    const items = [
        { label: 'Goal',    done: goalCaptured,                       active: !goalCaptured,                          tab: 'goals'    as const },
        { label: 'Data',    done: dataReady,                          active: goalCaptured && !dataReady,             tab: 'datasets' as const },
        { label: 'Goals',   done: goalsReady,                         active: dataReady && !goalsReady,               tab: 'goals'    as const },
        { label: 'Run',     done: running || resultsReady,            active: goalsReady && !running && !resultsReady, tab: 'monitor'  as const },
        { label: 'Results', done: resultsReady,                       active: running,                                 tab: 'results'  as const },
    ];
    return (
        <div className="flex items-center gap-1 mb-2 flex-shrink-0" role="navigation" aria-label="Progress">
            {items.map((item, i) => (
                <React.Fragment key={item.label}>
                    <button
                        onClick={() => onOpenCanvas(item.tab)}
                        aria-current={item.active ? 'step' : undefined}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${item.active ? 'animate-pulse' : ''}`}
                        style={item.done
                            ? { background: 'light-dark(#ECFDF5, #16302E)', color: 'light-dark(#047857, #34D399)', border: '1px solid light-dark(#A7F3D0, #1F6E6A)' }
                            : item.active
                                ? { background: 'rgba(92,20,39,0.07)', color: 'var(--brand-maroon)', border: '1px solid rgba(92,20,39,0.25)' }
                                : { background: 'var(--product-panel)', color: 'var(--fg-tertiary)', border: '1px solid var(--border-subtle)' }}
                    >
                        {item.done
                            ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            : <span className="w-2.5 h-2.5 flex items-center justify-center opacity-50">○</span>}
                        {item.label}
                    </button>
                    {i < items.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// ─── Confidence bar ───────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => (
    <div className="flex items-center gap-2 text-xs text-gray-400">
        <BarChart2 className="w-3 h-3" />
        <span>Goal confidence</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[120px]" style={{ background: 'var(--brand-bone-deep)' }}>
            <div className="h-full bg-[var(--brand-maroon)] rounded-full transition-all duration-500"
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
interface SmartUploadWizardProps {
    initialSessionId?: string;
    /** Called once after the first message is sent and the session is registered. */
    onSessionCreated?: (sessionId: string) => void;
}

const SmartUploadWizard: React.FC<SmartUploadWizardProps> = ({ initialSessionId, onSessionCreated }) => {
    const {
        sessionId, messages, phase, isComplete, isSending, isLoadingHistory,
        goalModel, dataContext, goals, gaParams, error, latestJobId,
        sendMessage, uploadFiles, uploads, stopGenerating, downloadDataset, reset,
    } = useUnifiedChat({ initialSessionId, onSessionCreated });

    const { setSessionId, chat: sharedChat, setChatShared } = useSessionStore();
    const readyToRun = sharedChat.readyToRun;
    const { user } = useUserStore();
    const canvas = useCanvas();

    const [input, setInput] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    // Keep modal as fallback when canvas context is unavailable
    const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
    const [preexistingJobId, setPreexistingJobId] = useState<string | null>(null);
    const [goalDetailOpen, setGoalDetailOpen] = useState(false);
    const [goalDetailIndex, setGoalDetailIndex] = useState(0);
    const [goalDetailTarget, setGoalDetailTarget] = useState<GoalDefinition | null>(null);

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

    // Keep canvas context synced on every state change — so Datasets tab always
    // has current dataContext even when canvas was opened before data arrived.
    useEffect(() => {
        canvas.sync({
            sessionId,
            goals,
            dataContext,
            problemName: goalModel
                ? (goalModel.description
                    || (goalModel.entities?.resources?.name && goalModel.entities?.targets?.name
                        ? `${goalModel.entities.resources.name} → ${goalModel.entities.targets.name}`
                        : goalModel.problem_type?.replace(/_/g, ' ') ?? null))
                : null,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataContext, goals, sessionId, goalModel]);

    const scrollBoxRef = useRef<HTMLDivElement>(null);
    const [pinnedToBottom, setPinnedToBottom] = useState(true);
    const [hasNewBelow, setHasNewBelow] = useState(false);

    // Auto-scroll only while the user is pinned to the bottom — never yank the
    // view mid-read. A "new messages" pill appears instead.
    useEffect(() => {
        if (pinnedToBottom) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
            setHasNewBelow(false);
        } else {
            setHasNewBelow(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, isSending]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setPinnedToBottom(nearBottom);
        if (nearBottom) setHasNewBelow(false);
    }, []);

    const deriveProblemName = () => {
        if (goalModel?.description) return goalModel.description;
        if (goalModel?.entities?.resources?.name && goalModel?.entities?.targets?.name)
            return `${goalModel.entities.resources.name} → ${goalModel.entities.targets.name}`;
        return goalModel?.problem_type?.replace(/_/g, ' ') ?? null;
    };

    // Auto-open canvas when ML API starts a job via the chat flow
    useEffect(() => {
        if (latestJobId) {
            setPreexistingJobId(latestJobId);
            canvas.open('monitor', { sessionId, goals, gaParams, preexistingJobId: latestJobId, dataContext, problemName: deriveProblemName() });
        }
    }, [latestJobId]); // eslint-disable-line

    const handleSend = useCallback(() => {
        const trimmed = input.trim();
        if ((!trimmed && attachedFiles.length === 0) || isSending) return;
        setInput('');
        setAttachedFiles([]);
        if (inputRef.current) inputRef.current.style.height = '42px';
        sendMessage(trimmed || 'Here are my files.', attachedFiles);
    }, [input, attachedFiles, isSending, sendMessage]);

    const handleRunOptimization = () => {
        canvas.open('monitor', { sessionId, goals, gaParams, preexistingJobId: null, dataContext, problemName: deriveProblemName() });
    };

    const handleViewGoal = useCallback((goal: GoalDefinition, idx: number) => {
        setGoalDetailTarget(goal);
        setGoalDetailIndex(idx);
        setGoalDetailOpen(true);
    }, []);

    const addFiles = (incoming: File[]) => {
        const fresh = incoming.filter(f => !attachedFiles.find(p => p.name === f.name));
        if (fresh.length === 0) return;
        setAttachedFiles(prev => [...prev, ...fresh]);
        // Eager upload: ingestion starts NOW, while the user is still typing.
        void uploadFiles(fresh, input.trim());
    };

    const chipFor = (f: File) => uploads.find(u => u.key === `${f.name}:${f.size}`);
    const chipBadge = (f: File): { label: string; cls: string } => {
        const c = chipFor(f);
        if (!c) return { label: '', cls: '' };
        if (c.state === 'uploading') return { label: 'uploading…', cls: 'text-gray-400' };
        if (c.state === 'ingesting') return { label: 'analysing…', cls: 'text-amber-600' };
        if (c.state === 'complete') {
            const r = c.rows; const total = (r?.resources ?? 0) + (r?.targets ?? 0);
            return { label: `✓ ${total} rows`, cls: 'text-emerald-600' };
        }
        return { label: `✗ ${c.error ? 'failed' : 'failed'}`, cls: 'text-red-500' };
    };

    const promptsForPhase = phase === 'goal_definition' ? GOAL_PROMPTS : INGESTION_PROMPTS;
    const isIdle = messages.length === 0;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 pb-2">

            {/* ── Header (Only show when not idle to match Gemini's immersive welcome) ───────────────────────── */}
         

            {/* ── Dataset download bar ────────────────────────────────────── */}
            {!isIdle && dataContext && (dataContext.status === 'partial' || dataContext.status === 'complete') && (
                <DatasetDownloadBar context={dataContext} onDownload={downloadDataset} />
            )}

            {/* ── Context bar + readiness strip ───────────────────────────── */}
            {!isIdle && !isLoadingHistory && (
                <>
                    <ContextBar
                        goalModel={goalModel}
                        dataContext={dataContext}
                        phase={phase}
                        isComplete={isComplete}
                        goalsCount={goals.length}
                        onRun={handleRunOptimization}
                    />
                    <ReadinessStrip
                        dataContext={dataContext}
                        goalsCount={goals.length}
                        isComplete={isComplete}
                        phase={phase}
                        onOpenCanvas={(tab) => canvas.open(tab, { sessionId, goals, gaParams })}
                    />
                </>
            )}

            {/* ── Error banner ────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex-shrink-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button
                        onClick={() => {
                            const lastUser = [...messages].reverse().find(m => m.role === 'user');
                            if (lastUser) sendMessage(lastUser.content);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 transition-colors cursor-pointer">
                        Retry
                    </button>
                </div>
            )}

            {/* ── History loading skeleton ────────────────────────────────── */}
            {isLoadingHistory && <HistorySkeleton />}

            {/* ── Messages area (only when not idle) ─────────────────────── */}
            {!isLoadingHistory && !isIdle && (
                <div ref={scrollBoxRef} onScroll={handleScroll}
                    className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4 relative" aria-live="polite" aria-busy={isSending}>
                    {hasNewBelow && (
                        <button
                            onClick={() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); setPinnedToBottom(true); setHasNewBelow(false); }}
                            className="sticky top-1 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-md cursor-pointer"
                            style={{ background: 'var(--brand-maroon)' }}
                        >↓ New messages</button>
                    )}
                    {messages.map((msg, i) => {
                        const isLastAssistant = msg.role === 'assistant';
                        const showLoading = isLastAssistant && isSending && i === messages.length - 1 && msg.content === '';
                        return (
                            <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isLoading={showLoading}
                                onDownload={downloadDataset}
                                onViewGoal={handleViewGoal}
                            />
                        );
                    })}

                    {/* Dynamic response chips from the last assistant turn, with
                        static phase prompts as a fallback when the AI emitted none. */}
                    {!isSending && messages.length > 0 && !isComplete && (() => {
                        const lastAsst = [...messages].reverse().find(m => m.role === 'assistant' && m.content !== '');
                        if (lastAsst?.multiQuestion?.length) {
                            return (
                                <MultiQuestionChips
                                    groups={lastAsst.multiQuestion as QuestionGroup[]}
                                    onSubmit={(combined) => sendMessage(combined)}
                                    disabled={isSending}
                                />
                            );
                        }
                        if (lastAsst?.suggestedResponses?.length) {
                            return (
                                <SuggestedResponseChips
                                    suggestions={lastAsst.suggestedResponses}
                                    onSelect={(v) => sendMessage(v)}
                                    disabled={isSending}
                                />
                            );
                        }
                        // Fallback: static phase-appropriate quick prompts
                        return (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {promptsForPhase.map(p => (
                                    <button key={p} onClick={() => sendMessage(p)}
                                        className="px-3 py-1.5 border rounded-full text-xs transition-colors" style={{ background: 'var(--product-panel)', borderColor: 'var(--border-subtle)', color: 'var(--fg-secondary)' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--neutral-100)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-primary)'; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--product-panel)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-secondary)'; }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        );
                    })()}


                    {/* ── Turn-2.5 Run card: generation finished + goals compiled while
                        the user watched — one click instead of typing a third message. */}
                    {readyToRun && !isSending && (
                        <div className="flex items-center gap-3 p-3.5 rounded-xl border"
                            style={{ background: 'rgba(92,20,39,0.04)', borderColor: 'rgba(92,20,39,0.18)' }}>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: 'var(--brand-maroon-deep)' }}>
                                    Data ready — goals compiled.
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-secondary)' }}>
                                    {sharedChat.goals?.length ?? 0} goal{(sharedChat.goals?.length ?? 0) === 1 ? '' : 's'} set ·{' '}
                                    <button onClick={() => canvas.open('goals', { sessionId, goals, gaParams })}
                                        className="underline underline-offset-2 cursor-pointer" style={{ color: 'var(--brand-maroon)' }}>
                                        review & edit
                                    </button>
                                    {' '}· mode: <b>{useSessionStore.getState().qualityMode}</b>
                                    {' '}({useSessionStore.getState().qualityMode === 'fast' ? '~seconds' : useSessionStore.getState().qualityMode === 'balanced' ? '~30s' : '~1-2 min'})
                                </p>
                            </div>
                            <button
                                onClick={() => { setChatShared({ readyToRun: false }); sendMessage('Yes, run the optimization now.'); }}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 cursor-pointer"
                                style={{ background: 'var(--brand-maroon)' }}>
                                Run optimization
                            </button>
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
                            <span className="bg-gradient-to-r from-[var(--brand-maroon)] via-[#731931] to-[var(--brand-maroon-bright)] bg-clip-text text-transparent">
                                Hi {user?.name?.split(' ')[0] || 'there'}
                            </span>
                        </h1>
                        <h2 className="text-4xl md:text-[56px] leading-tight font-semibold text-gray-300 tracking-tight">
                            Where should we start?
                        </h2>
                    </div>

                    <div className="w-full relative rounded-[28px] p-2 shadow-sm transition-all mt-4" style={{ background: 'var(--product-panel)', border: '1px solid var(--border-subtle)' }}>
                        {/* Attached files */}
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-3 pt-2">
                                {attachedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-sm">
                                        <FileSpreadsheet className="w-3 h-3 text-[var(--brand-maroon)]" />
                                        <span className="max-w-[140px] truncate font-medium">{f.name}</span>
                                        {chipBadge(f).label && (
                                            <span className={`text-[10px] font-semibold ${chipBadge(f).cls}`} title={chipFor(f)?.error ?? undefined}>
                                                {chipBadge(f).label}
                                            </span>
                                        )}
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
                            </div>
                            <div className="flex items-center gap-1.5">
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

                                {isSending ? (
                                    <button
                                        onClick={stopGenerating}
                                        title="Stop generating"
                                        aria-label="Stop generating"
                                        className="w-10 h-10 rounded-full bg-gray-900 hover:bg-red-700 text-white flex items-center justify-center transition-all ml-1 cursor-pointer"
                                    >
                                        <span className="w-3 h-3 bg-white rounded-[2px]" />
                                    </button>
                                ) : (input.trim() || attachedFiles.length > 0) && (
                                    <button
                                        onClick={handleSend}
                                        className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all ml-1 cursor-pointer"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
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
                                icon: <Database className="w-4 h-4 text-[var(--brand-maroon)]" />,
                                text: "Deploy health workers to facilities",
                                prompt: "I need to assign healthcare workers to clinics and hospitals based on qualifications, availability, and facility needs."
                            },
                            {
                                icon: <Target className="w-4 h-4 text-[#731931]" />,
                                text: "Match field officers to communities",
                                prompt: "I want to assign field officers to communities, matching their expertise to the population's needs and minimising travel distance."
                            },
                            {
                                icon: <Zap className="w-4 h-4 text-[var(--brand-maroon-bright)]" />,
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
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all" style={{ background: 'var(--brand-bone-deep)', color: 'var(--fg-primary)', border: '1px solid transparent' }} onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-default)'; el.style.background = '#E2D8CB'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'transparent'; el.style.background = 'var(--brand-bone-deep)'; }}>
                                {p.icon}
                                {p.text}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ── Run Optimization CTA (appears when goals are ready) ────────── */}
            {!isLoadingHistory && !isIdle && (phase === 'goal_definition' || isComplete) && !isSending && (
                <div className="flex-shrink-0 flex justify-center pb-2 pt-1">
                    <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleRunOptimization}
                        className="flex items-center gap-2 px-5 py-2 bg-[var(--brand-maroon)] hover:bg-[#7a1b35] text-white rounded-full text-sm font-medium shadow-sm transition-colors"
                    >
                        <Zap className="w-4 h-4" />
                        Run Optimization
                    </motion.button>
                </div>
            )}

            {/* ── Input Area (when NOT idle, docked to bottom) ─────────────────────────────── */}
            {!isLoadingHistory && !isIdle && (
                <div className="flex-shrink-0 pt-2 pb-2 border-t border-transparent relative z-10 w-full max-w-3xl mx-auto" style={{ background: 'var(--bg-header)', backdropFilter: 'blur(12px)' }}>
                    <div className="w-full relative rounded-[24px] p-1 shadow-sm transition-all" style={{ background: 'var(--product-panel)', border: '1px solid var(--border-subtle)' }}>
                        {/* Attached files */}
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-3 pt-2">
                                {attachedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-sm">
                                        <FileSpreadsheet className="w-3 h-3 text-[var(--brand-maroon)]" />
                                        <span className="max-w-[140px] truncate font-medium">{f.name}</span>
                                        {chipBadge(f).label && (
                                            <span className={`text-[10px] font-semibold ${chipBadge(f).cls}`} title={chipFor(f)?.error ?? undefined}>
                                                {chipBadge(f).label}
                                            </span>
                                        )}
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
                </div>
            )}

            {/* ── Goal Detail Panel ────────────────────────────────────────── */}
            <GoalDetailPanel
                isOpen={goalDetailOpen}
                onClose={() => setGoalDetailOpen(false)}
                goal={goalDetailTarget}
                goalIndex={goalDetailIndex}
            />
        </div>
    );
};

export default SmartUploadWizard;
