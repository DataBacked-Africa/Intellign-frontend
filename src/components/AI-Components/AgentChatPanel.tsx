"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    Loader2,
    Check,
    ChevronDown,
    Trash2,
    Bot,
    User,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentChat, ChatMessage, AgentSuggestions } from '@/hooks/useAgentChat';
import { useSessionStore } from '@/store/useSessionStore';

const QUICK_PROMPTS = [
    "What columns are available in my dataset?",
    "Suggest optimization goals for this data",
    "Help me match resources to targets by location",
    "Create a capacity constraint goal",
    "How should I weight my goals?",
];

const TypingIndicator = () => (
    <div className="flex items-center gap-1.5 px-4 py-3">
        <div className="flex gap-1">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </div>
        <span className="text-xs text-gray-400 ml-1">Thinking...</span>
    </div>
);

const SuggestionsCard: React.FC<{
    suggestions: AgentSuggestions;
    onApply: (suggestions: AgentSuggestions, mode: 'append' | 'replace') => void;
    isApplying: boolean;
}> = ({ suggestions, onApply, isApplying }) => {
    const goalCount = suggestions.goals?.length || 0;
    const hasGaParams = !!suggestions.ga_params;

    if (!goalCount && !hasGaParams) return null;

    return (
        <div className="mt-3 p-3 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-xs font-bold text-violet-800 uppercase tracking-wide">
                    Suggested Configuration
                </span>
            </div>

            {goalCount > 0 && (
                <div className="mb-2">
                    <p className="text-xs text-violet-700 mb-1.5">{goalCount} goal{goalCount > 1 ? 's' : ''} suggested:</p>
                    <div className="space-y-1">
                        {suggestions.goals!.map((goal: any, i: number) => (
                            <div key={i} className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-gray-700 border border-violet-100">
                                <span className="font-semibold text-violet-900">{goal.description || `Goal ${i + 1}`}</span>
                                {goal.weight && <span className="text-violet-500 ml-1">({goal.weight}%)</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasGaParams && (
                <p className="text-xs text-violet-600 mb-2">
                    + GA parameters: pop={suggestions.ga_params?.population_size}, gen={suggestions.ga_params?.generations}
                </p>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => onApply(suggestions, 'append')}
                    disabled={isApplying}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                    {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Add to Goals
                </button>
                <button
                    onClick={() => onApply(suggestions, 'replace')}
                    disabled={isApplying}
                    className="px-3 py-2 bg-white text-violet-700 rounded-lg text-xs font-semibold border border-violet-200 hover:bg-violet-50 transition-colors disabled:opacity-50"
                >
                    Replace All
                </button>
            </div>
        </div>
    );
};

const MessageBubble: React.FC<{
    message: ChatMessage;
    onApply: (suggestions: AgentSuggestions, mode: 'append' | 'replace') => void;
    isApplying: boolean;
}> = ({ message, onApply, isApplying }) => {
    const isUser = message.role === 'user';

    if (message.isLoading) {
        return (
            <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm max-w-[85%]">
                    <TypingIndicator />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex gap-2.5 items-start", isUser && "flex-row-reverse")}>
            <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                isUser
                    ? "bg-gray-900"
                    : "bg-gradient-to-br from-violet-500 to-indigo-600"
            )}>
                {isUser
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                }
            </div>
            <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5",
                isUser
                    ? "bg-gray-900 text-white rounded-tr-sm"
                    : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
            )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                {!isUser && message.suggestions && (
                    <SuggestionsCard
                        suggestions={message.suggestions}
                        onApply={onApply}
                        isApplying={isApplying}
                    />
                )}
            </div>
        </div>
    );
};

const AgentChatPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { sessionId, sessionStatus } = useSessionStore();
    const {
        messages,
        isLoading,
        isApplying,
        sendMessage,
        applySuggestions,
        loadHistory,
        clearChat,
    } = useAgentChat();

    // Load history when panel opens
    useEffect(() => {
        if (isOpen && sessionId) {
            loadHistory();
        }
    }, [isOpen, sessionId, loadHistory]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        setInput('');
        setShowQuickPrompts(false);
        await sendMessage(trimmed);
    }, [input, isLoading, sendMessage]);

    const handleQuickPrompt = (prompt: string) => {
        setShowQuickPrompts(false);
        setInput('');
        sendMessage(prompt);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Don't show if no session
    if (!sessionId) return null;

    return (
        <>
            {/* Floating Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 transition-all group"
                    >
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        {messages.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {messages.filter(m => m.role === 'assistant').length}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] max-h-[90vh] bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-700 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">AI Assistant</h3>
                                    <p className="text-violet-200 text-[11px]">Goal definition helper</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 text-violet-500" />
                                    </div>
                                    <h4 className="text-gray-900 font-bold text-base mb-1">
                                        How can I help?
                                    </h4>
                                    <p className="text-gray-500 text-xs leading-relaxed max-w-[260px]">
                                        Describe your optimization goals in plain English. I'll help configure them for the engine.
                                    </p>
                                </div>
                            )}

                            {messages.map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    onApply={applySuggestions}
                                    isApplying={isApplying}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        {showQuickPrompts && messages.length === 0 && (
                            <div className="px-4 pb-2 flex-shrink-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Try asking</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickPrompt(prompt)}
                                            className="px-3 py-1.5 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-100 hover:border-violet-200 rounded-full text-[11px] text-gray-600 font-medium transition-colors"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe a goal or ask about your data..."
                                    rows={1}
                                    className="flex-1 resize-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 transition-all max-h-[100px]"
                                    style={{ minHeight: '42px' }}
                                    onInput={e => {
                                        const el = e.target as HTMLTextAreaElement;
                                        el.style.height = '42px';
                                        el.style.height = Math.min(el.scrollHeight, 100) + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                        input.trim() && !isLoading
                                            ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                                            : "bg-gray-100 text-gray-300"
                                    )}
                                >
                                    {isLoading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4" />
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AgentChatPanel;
