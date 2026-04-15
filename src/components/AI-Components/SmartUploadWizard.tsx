"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Sparkles, Loader2, CheckCircle2,
    FileSpreadsheet, X, Send, Bot, User, ArrowRight, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmartIngest, IngestMessage } from '@/hooks/useSmartIngest';

// ─── Stage label / colour ─────────────────────────────────────────────────────
const STAGE_META: Record<string, { label: string; colour: string }> = {
    processing:   { label: 'Analysing',    colour: 'bg-amber-100 text-amber-700' },
    analysed:     { label: 'Analysis done', colour: 'bg-blue-100 text-blue-700' },
    recipe_ready: { label: 'Mapping ready', colour: 'bg-indigo-100 text-indigo-700' },
    transformed:  { label: 'Transformed',  colour: 'bg-violet-100 text-violet-700' },
    complete:     { label: 'Complete',     colour: 'bg-green-100 text-green-700' },
    error:        { label: 'Error',        colour: 'bg-red-100 text-red-700' },
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

// ─── Inline markdown ──────────────────────────────────────────────────────────
const renderMarkdown = (text: string): React.ReactNode[] =>
    text.split('\n').map((line, idx, arr) => {
        const isBullet = /^[\-\*]\s+/.test(line);
        const content = isBullet ? line.replace(/^[\-\*]\s+/, '') : line;
        const parts: React.ReactNode[] = [];
        const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
        let last = 0, m: RegExpExecArray | null;
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

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: IngestMessage; isLoading?: boolean }> = ({ msg, isLoading }) => {
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
            <div className={cn(
                'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
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
        </motion.div>
    );
};

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    'What tables did you find?',
    'Use the AI recommendations and proceed.',
    'Explain the column mappings.',
    'The recipe looks good, go ahead.',
    'Generate virtual resources automatically.',
];

// ─── Upload screen ────────────────────────────────────────────────────────────
const UploadScreen: React.FC<{
    onUpload: (files: File[], hint?: string) => void;
    isUploading: boolean;
}> = ({ onUpload, isUploading }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [hint, setHint] = useState('');
    const [isDrag, setIsDrag] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = (incoming: File[]) =>
        setFiles(prev => [...prev, ...incoming.filter(f => !prev.find(p => p.name === f.name))]);

    return (
        <div className="w-full max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Smart Upload</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Drop your data files and the AI will guide you through the entire setup via chat.
                </p>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
                onDragLeave={() => setIsDrag(false)}
                onDrop={e => { e.preventDefault(); setIsDrag(false); addFiles(Array.from(e.dataTransfer.files)); }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                    isDrag ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                )}
            >
                <Upload className={cn('w-8 h-8 mx-auto mb-3', isDrag ? 'text-gray-600' : 'text-gray-300')} />
                <p className="text-sm font-semibold text-gray-700">Drop files or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Excel, CSV, JSON, GeoJSON, Parquet, Shapefile, KML</p>
                <input ref={inputRef} type="file" multiple className="hidden"
                    onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
                    accept=".csv,.xlsx,.xls,.json,.geojson,.parquet,.ods,.feather,.html,.gpkg,.shp,.kml,.tsv" />
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{f.name}</p>
                                    <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</p>
                                </div>
                            </div>
                            <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Hint */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    Context hint (optional)
                </label>
                <input value={hint} onChange={e => setHint(e.target.value)}
                    placeholder="e.g. Assign healthcare workers to facilities in Lagos"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-gray-100 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all" />
            </div>

            <button
                onClick={() => onUpload(files, hint || undefined)}
                disabled={files.length === 0 || isUploading}
                className={cn(
                    'w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all',
                    files.length > 0 && !isUploading
                        ? 'bg-gray-900 hover:bg-gray-700 shadow-lg shadow-black/10'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
            >
                {isUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    : <><Sparkles className="w-4 h-4" /> Analyse with AI</>}
            </button>
        </div>
    );
};

// ─── Chat screen ──────────────────────────────────────────────────────────────
const ChatScreen: React.FC<{
    messages: IngestMessage[];
    isChatting: boolean;
    stage: string;
    sessionId: string;
    onSend: (text: string) => void;
    onReset: () => void;
}> = ({ messages, isChatting, stage, sessionId, onSend, onReset }) => {
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isComplete = stage === 'complete';
    const meta = STAGE_META[stage] ?? { label: stage, colour: 'bg-gray-100 text-gray-500' };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatting]);

    const send = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed || isChatting || isComplete) return;
        setInput('');
        if (inputRef.current) inputRef.current.style.height = '42px';
        onSend(trimmed);
    }, [input, isChatting, isComplete, onSend]);

    return (
        <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-1 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Bot className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Data Setup Assistant</p>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', meta.colour)}>
                            {meta.label}
                        </span>
                    </div>
                </div>
                <button onClick={onReset} title="Start over"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {messages.map((msg, i) => {
                    const isLastAssistant = !msg.role || msg.role === 'assistant';
                    const showLoading = isLastAssistant && isChatting && i === messages.length - 1 && msg.content === '';
                    return <MessageBubble key={msg.id} msg={msg} isLoading={showLoading} />;
                })}

                {/* Quick prompts when idle */}
                {!isChatting && !isComplete && messages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {QUICK_PROMPTS.map(p => (
                            <button key={p} onClick={() => onSend(p)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600 hover:text-gray-900 transition-colors">
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                {/* Complete CTA */}
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-4 py-6 border-t border-gray-100 mt-2"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-sm">Data ready for optimization</p>
                            <p className="text-xs text-gray-500 mt-1">Your datasets have been processed and indexed.</p>
                        </div>
                        <a href={`/sessions/${sessionId}`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors">
                            Configure Goals <ArrowRight className="w-4 h-4" />
                        </a>
                    </motion.div>
                )}

                <div ref={endRef} />
            </div>

            {/* Input */}
            {!isComplete && (
                <div className="flex-shrink-0 pt-3 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            disabled={isChatting}
                            placeholder={
                                stage === 'processing'
                                    ? 'Analysis in progress — ask anything...'
                                    : 'Reply to the assistant...'
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
                            onClick={send}
                            disabled={!input.trim() || isChatting}
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                                input.trim() && !isChatting
                                    ? 'bg-gray-900 hover:bg-gray-700 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            )}
                        >
                            {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
                </div>
            )}
        </div>
    );
};

// ─── Main wizard ──────────────────────────────────────────────────────────────
const SmartUploadWizard: React.FC = () => {
    const { stage, sessionId, messages, isUploading, isChatting, error, uploadFiles, sendMessage, reset } = useSmartIngest();
    const inChat = stage !== 'idle' && stage !== 'uploading' && stage !== 'error';

    return (
        <div className={cn('w-full', inChat ? 'h-full flex flex-col' : 'max-w-xl mx-auto')}>
            {/* Upload error */}
            {error && stage === 'error' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <span className="text-sm text-red-700">{error}</span>
                    <button onClick={reset} className="ml-auto text-xs font-semibold text-red-600 hover:underline">Try again</button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {!inChat ? (
                    <motion.div key="upload"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <UploadScreen onUpload={uploadFiles} isUploading={isUploading} />
                    </motion.div>
                ) : (
                    <motion.div key="chat"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-h-0 flex flex-col"
                    >
                        <ChatScreen
                            messages={messages}
                            isChatting={isChatting}
                            stage={stage}
                            sessionId={sessionId ?? ''}
                            onSend={sendMessage}
                            onReset={reset}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartUploadWizard;
