"use client";

/**
 * ConfidenceHero — the results screen's headline statement of solver certainty.
 * Replaces a plain "Best Fitness" number with an honest read on what the solver
 * actually proved: exact optimum, a bounded gap, or just the best heuristic found.
 *
 * `quality_state` is a proposed backend field that doesn't exist yet — when it's
 * absent we fall back to `best_found`, which reads correctly against today's API
 * (a heuristic/GA result with no optimality bound).
 */

import React from 'react';
import { Check, Equal, HelpCircle } from 'lucide-react';

export type QualityState = 'proven' | 'within_gap' | 'best_found';

interface ConfidenceHeroProps {
    qualityState?: QualityState;
    gapPercentage?: number | null;
    solverBadge?: string;
    solverUsed?: string;
    elapsedSeconds?: number;
}

const STATE_META: Record<QualityState, {
    bg: string; border: string; fg: string; iconBg: string;
    icon: React.ReactNode;
    title: (p: { gap: number; elapsed: string }) => string;
    subtitle: (p: { gap: number; elapsed: string }) => string;
}> = {
    proven: {
        bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.28)', fg: '#047857', iconBg: '#10B981',
        icon: <Check size={16} color="#fff" strokeWidth={3} />,
        title: () => 'Proven best possible — no assignment scores higher',
        subtitle: () => 'Gap = 0.00% · nothing scores higher, checked exhaustively.',
    },
    within_gap: {
        bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.28)', fg: '#B45309', iconBg: '#F59E0B',
        icon: <Equal size={16} color="#fff" strokeWidth={3} />,
        title: ({ gap }) => `Within ${gap}% of the best possible route`,
        subtitle: ({ gap }) => `Ran out of time before proving it — but nothing could beat this by more than ${gap}%.`,
    },
    best_found: {
        bg: 'var(--neutral-50)', border: 'var(--border-subtle)', fg: 'var(--fg-secondary)', iconBg: 'var(--fg-tertiary)',
        icon: <HelpCircle size={16} color="#fff" strokeWidth={3} />,
        title: ({ elapsed }) => `Best found in ${elapsed} — not proven`,
        subtitle: () => 'No bound available for this solver yet. Still the strongest answer found.',
    },
};

export const ConfidenceHero: React.FC<ConfidenceHeroProps> = ({
    qualityState, gapPercentage, solverBadge, solverUsed, elapsedSeconds,
}) => {
    const state = qualityState ?? 'best_found';
    const meta = STATE_META[state];
    const gap = typeof gapPercentage === 'number' ? gapPercentage : 0;
    const elapsed = typeof elapsedSeconds === 'number' ? `${elapsedSeconds.toFixed(1)}s` : '—';
    const badge = solverBadge ?? solverUsed;

    return (
        <div
            className="rounded-xl p-4 flex items-start justify-between gap-3"
            style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
        >
            <div className="flex items-start gap-3 min-w-0">
                <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: meta.iconBg }}
                >
                    {meta.icon}
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: meta.fg }}>
                        {meta.title({ gap, elapsed })}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--fg-tertiary)' }}>
                        {meta.subtitle({ gap, elapsed })}
                    </p>
                </div>
            </div>
            {badge && (
                <span
                    className="px-2 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-mono)', background: 'var(--brand-maroon-50, rgba(92,20,39,0.08))', color: 'var(--brand-maroon)' }}
                    title="Solver"
                >
                    {badge}
                </span>
            )}
        </div>
    );
};

export default ConfidenceHero;
