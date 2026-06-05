"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Sparkles, Loader2, Check, Trash2, Bot, User,
    Zap, ChevronRight, Database, Target, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentChat, ChatMessage, AgentSuggestions } from '@/hooks/useAgentChat';
import { useSessionStore } from '@/store/useSessionStore';
import { MarkdownMessage } from '@/components/ui/MarkdownMessage';
import { SuggestedResponseChips } from './SuggestedResponseChips';
import { MultiQuestionChips, QuestionGroup } from './MultiQuestionChips';

// ─── Available models ─────────────────────────────────────────────────────────
const MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro' },
];

// ─── Inline markdown renderer ─────────────────────────────────────────────────
const renderInline = (content: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let lastIdx = 0; let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
        if (m.index > lastIdx) parts.push(content.slice(lastIdx, m.index));
        if (m[1] !== undefined) parts.push(<strong key={m.index}>{m[1]}</strong>);
        else if (m[2] !== undefined)
            parts.push(<code key={m.index} className="px-1 py-0.5 bg-black/10 rounded text-[11px] font-mono">{m[2]}</code>);
        lastIdx = m.index + m[0].length;
    }
    if (lastIdx < content.length) parts.push(content.slice(lastIdx));
    return parts.length > 0 ? parts : [content];
};

const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
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
                const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
                const isSep = (l: string) => /^[\s|:-]+$/.test(l.replace(/\|/g, ''));
                const headers = parseRow(tableLines[0]);
                const bodyRows = tableLines.slice(2).filter(l => !isSep(l)).map(parseRow);
                result.push(
                    <div key={`tbl-${i}`} className="overflow-x-auto my-2 rounded-lg border border-gray-200 text-xs">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {headers.map((h, hi) => <th key={hi} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{renderInline(h)}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {bodyRows.map((row, ri) => (
                                    <tr key={ri} className="border-t border-gray-100 even:bg-gray-50/40">
                                        {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-gray-700">{renderInline(cell)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }
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

// ─── Suggestions card ─────────────────────────────────────────────────────────
const SuggestionsCard: React.FC<{
    suggestions: AgentSuggestions;
    onApply: (s: AgentSuggestions, mode: 'append' | 'replace') => void;
    isApplying: boolean;
}> = ({ suggestions, onApply, isApplying }) => {
    const goalCount = suggestions.goals?.length ?? 0;
    const hasGaParams = !!suggestions.ga_params;
    if (!goalCount && !hasGaParams) return null;
    return (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-100/70 border-b border-violet-200">
                <Zap className="w-3 h-3 text-violet-600" />
                <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wide">
                    {goalCount} Goal{goalCount !== 1 ? 's' : ''} Suggested
                </span>
            </div>
            <div className="p-3 space-y-1.5">
                {suggestions.goals?.map((goal: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-white/80 rounded-lg px-2.5 py-2 border border-violet-100">
                        <Target className="w-3 h-3 text-violet-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-violet-900">{goal.description || `Goal ${i + 1}`}</span>
                            {goal.weight !== undefined && (
                                <span className="text-violet-400 ml-1.5 text-[10px]">weight {goal.weight}%</span>
                            )}
                        </div>
                    </div>
                ))}
                {hasGaParams && suggestions.ga_params && (
                    <p className="text-[10px] text-violet-500 pt-0.5 px-0.5">
                        + Solver: pop={suggestions.ga_params?.population_size}, gen={suggestions.ga_params?.generations}
                    </p>
                )}
            </div>
            <div className="flex gap-2 px-3 pb-3">
                <button onClick={() => onApply(suggestions, 'append')} disabled={isApplying}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                    {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Add to Goals
                </button>
                <button onClick={() => onApply(suggestions, 'replace')} disabled={isApplying}
                    className="px-3 py-2 bg-white hover:bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold border border-violet-200 transition-colors disabled:opacity-50">
                    Replace All
                </button>
            </div>
        </div>
    );
};

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
    message: ChatMessage;
    onApply: (s: AgentSuggestions, mode: 'append' | 'replace') => void;
    isApplying: boolean;
}> = ({ message, onApply, isApplying }) => {
    const isUser = message.role === 'user';
    if (message.isLoading) {
        return (
            <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5"><TypingIndicator /></div>
            </div>
        );
    }
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className={cn('flex gap-2.5 items-start', isUser && 'flex-row-reverse')}>
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
                isUser ? 'bg-gray-900' : 'bg-gradient-to-br from-violet-500 to-indigo-600')}>
                {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={cn('max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                isUser ? 'bg-gray-900 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm')}>
                <MarkdownMessage content={message.content} inverted={message.role === 'user'} />
                {!isUser && message.suggestions && (
                    <SuggestionsCard suggestions={message.suggestions} onApply={onApply} isApplying={isApplying} />
                )}
                <div className={cn('text-[10px] mt-1.5 opacity-40', isUser ? 'text-right' : 'text-left')}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Model selector ───────────────────────────────────────────────────────────
const ModelSelector: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const current = MODELS.find(m => m.id === value) ?? MODELS[0];
    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-medium text-gray-600 transition-colors">
                {current.label}<ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                        {MODELS.map(m => (
                            <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); }}
                                className={cn('w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors',
                                    m.id === value ? 'font-semibold text-violet-700 bg-violet-50/60' : 'text-gray-700')}>
                                {m.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Context banner ───────────────────────────────────────────────────────────
const ContextBanner: React.FC<{ context: any }> = ({ context }) => {
    const [expanded, setExpanded] = useState(false);
    if (!context) return null;
    const cols: any[] = context.columns ?? context.resource_columns ?? [];
    const colCount = cols.length;
    return (
        <div className="mx-4 mb-2 rounded-xl border border-blue-100 bg-blue-50/50 overflow-hidden">
            <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-2 px-3 py-2">
                <Database className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-blue-700 font-medium flex-1 text-left">
                    Dataset context loaded
                    {colCount > 0 && <span className="font-normal text-blue-500"> · {colCount} columns</span>}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-blue-400 transition-transform', expanded && 'rotate-180')} />
            </button>
            <AnimatePresence>
                {expanded && colCount > 0 && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-blue-100">
                        <div className="px-3 py-2 flex flex-wrap gap-1">
                            {cols.slice(0, 20).map((col: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-white border border-blue-100 rounded text-[10px] font-mono text-blue-700">
                                    {col.name ?? col}
                                </span>
                            ))}
                            {colCount > 20 && <span className="text-[10px] text-blue-400 py-0.5">+{colCount - 20} more</span>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Empty state / quick prompts ──────────────────────────────────────────────
const QUICK_PROMPTS = [
    "What columns are in my dataset?",
    "Suggest optimization goals for my data",
    "Match resources to targets by location",
    "Create a capacity constraint goal",
    "How should I weight competing goals?",
    "Explain the optimization approach",
];

const EmptyState: React.FC<{ onPrompt: (p: string) => void; hasSession: boolean }> = ({ onPrompt, hasSession }) => (
    <div className="flex flex-col items-center justify-center h-full px-5 text-center gap-6">
        <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-violet-500" />
            </div>
            <div>
                <h4 className="text-gray-900 font-bold text-sm">AI Goal Assistant</h4>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed max-w-[220px] mx-auto">
                    {hasSession
                        ? "Describe your optimization goals in plain language — I'll configure them for the engine."
                        : "Upload data and initialize a session to start the conversation."}
                </p>
            </div>
        </div>
        {hasSession && (
            <div className="w-full space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Try asking</p>
                {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => onPrompt(p)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-200 text-xs text-gray-600 hover:text-violet-700 transition-all group">
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-violet-500 flex-shrink-0 transition-opacity" />
                        {p}
                    </button>
                ))}
            </div>
        )}
    </div>
);

// ─── Session expired banner ───────────────────────────────────────────────────
const SessionExpiredBanner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full px-5 text-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
            <h4 className="text-gray-900 font-bold text-sm">AI Session Expired</h4>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed max-w-[230px] mx-auto">
                The AI server no longer holds data for this session. Sessions are temporary — please start a new one to chat.
            </p>
        </div>
        <a href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-colors">
            Start New Session
        </a>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, string> = {
    IDLE:        'bg-gray-100 text-gray-500',
    PROCESSING:  'bg-amber-100 text-amber-700',
    CONFIGURING: 'bg-blue-100 text-blue-700',
    COMPLETED:   'bg-green-100 text-green-700',
    FAILED:      'bg-red-100 text-red-700',
};

const AgentConversationPanel: React.FC = () => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { sessionId, sessionStatus } = useSessionStore();
    const {
        messages, isLoading, isApplying, context, model, setModel,
        sessionNotFound, sendMessage, applySuggestions, loadHistory, clearChat, fetchContext,
    } = useAgentChat();

    useEffect(() => {
        if (sessionId) { loadHistory(); fetchContext(); }
    }, [sessionId, loadHistory, fetchContext]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        setInput('');
        if (inputRef.current) inputRef.current.style.height = '42px';
        await sendMessage(trimmed);
    }, [input, isLoading, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const statusClass = STATUS_CFG[sessionStatus ?? 'IDLE'] ?? STATUS_CFG.IDLE;
    const statusLabel = (sessionStatus ?? 'IDLE').charAt(0) + (sessionStatus ?? 'IDLE').slice(1).toLowerCase();

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">AI Assistant</h3>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', statusClass)}>
                            {statusLabel}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <ModelSelector value={model} onChange={setModel} />
                    {messages.length > 0 && (
                        <button onClick={clearChat} title="Clear conversation"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dataset context banner */}
            {context && (
                <div className="pt-2 flex-shrink-0">
                    <ContextBanner context={context} />
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {sessionNotFound
                    ? <SessionExpiredBanner />
                    : messages.length === 0
                        ? <EmptyState onPrompt={sendMessage} hasSession={!!sessionId} />
                        : (<>
                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} onApply={applySuggestions} isApplying={isApplying} />
                            ))}
                            {(() => {
                                const lastAsst = [...messages].reverse().find(m => m.role === 'assistant') as any;
                                if (!lastAsst || isLoading) return null;
                                if (lastAsst.multiQuestion?.length) {
                                    return (
                                        <div className="px-4 pb-2">
                                            <MultiQuestionChips
                                                groups={lastAsst.multiQuestion as QuestionGroup[]}
                                                onSubmit={(combined) => sendMessage(combined)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    );
                                }
                                if (lastAsst.suggestedResponses?.length) {
                                    return (
                                        <div className="px-4 pb-2">
                                            <SuggestedResponseChips
                                                suggestions={lastAsst.suggestedResponses}
                                                onSelect={(v) => sendMessage(v)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div ref={messagesEndRef} />
                        </>)
                }
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/40">
                {!sessionId && (
                    <p className="text-center text-[11px] text-gray-400 mb-2">No active session — initialize one to chat</p>
                )}
                {sessionNotFound && (
                    <p className="text-center text-[11px] text-amber-500 mb-2">Session expired — start a new session to chat</p>
                )}
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!sessionId || isLoading || sessionNotFound}
                        placeholder={
                            sessionNotFound ? 'Session expired'
                            : sessionId ? 'Describe a goal or ask about your data...'
                            : 'No active session'
                        }
                        rows={1}
                        className="flex-1 resize-none bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: '42px' }}
                        onInput={e => {
                            const el = e.target as HTMLTextAreaElement;
                            el.style.height = '42px';
                            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading || !sessionId || sessionNotFound}
                        className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                            input.trim() && !isLoading && sessionId && !sessionNotFound
                                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/25'
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        )}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
        </div>
    );
};

export default AgentConversationPanel;
