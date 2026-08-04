"use client";

/**
 * ParetoExplorer — shown instead of a single result when a run's goals genuinely
 * conflict (multi-objective). Renders the Pareto-optimal set as two synchronized
 * chart views (bubble scatter, parallel coordinates) plus the full options table,
 * which is the ground truth — unrounded, deduped, and complete.
 */

import React, { useMemo, useState } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Check, Loader2 } from 'lucide-react';
import { GoalDefinition } from '@/types/models';
import { resultsService, ParetoFront, ParetoOption } from '@/services/resultsService';
import { showToast } from '@/components/ui/CustomToast';

interface ParetoExplorerProps {
    jobId: string;
    data: ParetoFront;
    goals: GoalDefinition[];
    onSelected?: () => void;
}

const GOAL_COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#06B6D4'];

// ── Parallel coordinates (no chart lib supports this — hand-rolled SVG) ────────
const ParallelCoordinates: React.FC<{
    options: ParetoOption[];
    axes: string[];
    hoveredId: string | null;
    onHover: (id: string | null) => void;
}> = ({ options, axes, hoveredId, onHover }) => {
    const w = 520, h = 200, padX = 48, padY = 24;
    const axisX = (i: number) => padX + (i / Math.max(1, axes.length - 1)) * (w - 2 * padX);

    // Normalize each axis independently to its own min/max across all options.
    const ranges = axes.map(axis => {
        const values = options.map(o => o.objectives.find(x => x.goal_description === axis)?.value ?? 0);
        const min = Math.min(...values), max = Math.max(...values);
        return { min, max: max - min === 0 ? min + 1 : max };
    });
    const y = (axisIdx: number, value: number) => {
        const { min, max } = ranges[axisIdx];
        const t = (value - min) / (max - min || 1);
        return h - padY - t * (h - 2 * padY);
    };

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 200 }}>
            {/* Axes */}
            {axes.map((axis, i) => (
                <g key={axis}>
                    <line x1={axisX(i)} x2={axisX(i)} y1={padY} y2={h - padY} stroke="rgba(255,255,255,0.12)" />
                    <text x={axisX(i)} y={h - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
                        {axis.length > 14 ? `${axis.slice(0, 13)}…` : axis}
                    </text>
                </g>
            ))}
            {/* Lines — non-hovered first so the highlighted one draws on top */}
            {[...options].sort((a, b) => (a.option_id === hoveredId ? 1 : b.option_id === hoveredId ? -1 : 0)).map(opt => {
                const isHovered = opt.option_id === hoveredId;
                const points = axes.map((axis, i) => {
                    const v = opt.objectives.find(x => x.goal_description === axis)?.value ?? 0;
                    return `${axisX(i)},${y(i, v)}`;
                }).join(' ');
                return (
                    <polyline
                        key={opt.option_id}
                        points={points}
                        fill="none"
                        stroke={isHovered ? '#D49AAA' : 'rgba(255,255,255,0.18)'}
                        strokeWidth={isHovered ? 2.5 : 1.25}
                        opacity={isHovered || !hoveredId ? 1 : 0.35}
                        onMouseEnter={() => onHover(opt.option_id)}
                        onMouseLeave={() => onHover(null)}
                        style={{ cursor: 'pointer' }}
                    />
                );
            })}
        </svg>
    );
};

export const ParetoExplorer: React.FC<ParetoExplorerProps> = ({ jobId, data, goals, onSelected }) => {
    const [view, setView] = useState<'bubble' | 'parallel'>('bubble');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selecting, setSelecting] = useState<string | null>(null);

    const options = data.options ?? [];
    const axes = useMemo(
        () => options[0]?.objectives.map(o => o.goal_description) ?? [],
        [options]
    );

    const totalWeight = goals.reduce((s, g) => s + (g.weight ?? 0), 0) || 1;

    const bubbleData = useMemo(() => options.map(opt => ({
        id: opt.option_id,
        label: opt.label,
        x: opt.objectives[0]?.value ?? 0,
        y: opt.objectives[1]?.value ?? 0,
        z: opt.objectives[2]?.value ?? 1,
    })), [options]);

    const handleSelect = async (optionId: string) => {
        setSelecting(optionId);
        try {
            await resultsService.selectParetoOption(jobId, optionId);
            showToast.success('Option selected', 'Finalizing assignments for this trade-off.');
            onSelected?.();
        } catch {
            showToast.error('Not wired up yet', 'The backend endpoint for selecting a trade-off isn\'t live.');
        } finally {
            setSelecting(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Intro */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.22)' }}>
                <p className="text-sm font-semibold" style={{ color: '#6D28D9' }}>Genuinely different ways to balance this</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--fg-tertiary)' }}>
                    These goals were defined for this run and pull in different directions — no single assignment wins on all of them,
                    so every non-dominated option is shown plotted against the goals themselves.
                </p>
            </div>

            {/* Goal chips — literal weights from this run's GoalDefinitions, not generic labels */}
            {goals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {goals.map((g, i) => (
                        <span key={g.description + i}
                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
                            style={{ background: 'var(--neutral-50)', border: '1px solid var(--border-subtle)', color: 'var(--fg-secondary)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOAL_COLORS[i % GOAL_COLORS.length] }} />
                            {g.description} · {Math.round(((g.weight ?? 0) / totalWeight) * 100)}%
                        </span>
                    ))}
                </div>
            )}

            {/* Chart toggle */}
            <div className="rounded-xl p-4" style={{ background: '#14110F' }}>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-semibold">
                        {view === 'bubble' ? 'Skill match vs. prefer-far' : 'All goals at once — one line per option'}
                    </span>
                    <div style={{ display: 'inline-flex', padding: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, gap: 2 }}>
                        {(['bubble', 'parallel'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)}
                                style={{ padding: '4px 12px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: view === v ? '#D49AAA' : 'transparent', color: view === v ? '#14110F' : 'rgba(255,255,255,0.6)' }}>
                                {v === 'bubble' ? 'Bubble' : 'Parallel'}
                            </button>
                        ))}
                    </div>
                </div>
                {view === 'bubble' ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                            <XAxis type="number" dataKey="x" name={axes[0] ?? 'Goal 1'} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                            <YAxis type="number" dataKey="y" name={axes[1] ?? 'Goal 2'} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                            <ZAxis type="number" dataKey="z" range={[60, 400]} name={axes[2] ?? 'Goal 3'} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#20201f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                                labelStyle={{ color: '#fff' }} itemStyle={{ color: 'rgba(255,255,255,0.8)' }} />
                            <Scatter
                                data={bubbleData}
                                onMouseEnter={(p: any) => setHoveredId(p?.id ?? null)}
                                onMouseLeave={() => setHoveredId(null)}
                                shape={(props: any) => {
                                    const isHovered = props.payload?.id === hoveredId;
                                    return (
                                        <circle
                                            cx={props.cx} cy={props.cy} r={Math.max(4, Math.sqrt(props.payload.z) * 2)}
                                            fill={isHovered ? '#D49AAA' : 'rgba(212,154,170,0.35)'}
                                            stroke={isHovered ? '#fff' : 'none'} strokeWidth={1.5}
                                        />
                                    );
                                }}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : (
                    <ParallelCoordinates options={options} axes={axes} hoveredId={hoveredId} onHover={setHoveredId} />
                )}
            </div>

            {/* Options table — the ground truth, unrounded and complete */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--neutral-0)', border: '1px solid var(--border-subtle)' }}>
                <div className="p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>All {options.length} options</span>
                    {typeof data.population_size === 'number' && data.population_size !== options.length && (
                        <span className="ml-2 text-[10px]" style={{ color: 'var(--fg-tertiary)' }}>
                            deduped from {data.population_size} individuals
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--neutral-50)' }}>
                            <tr>
                                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>Option</th>
                                {axes.map(axis => (
                                    <th key={axis} className="text-left px-3 py-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>{axis}</th>
                                ))}
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {options.map(opt => {
                                const isHovered = opt.option_id === hoveredId;
                                return (
                                    <tr key={opt.option_id}
                                        onMouseEnter={() => setHoveredId(opt.option_id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        style={{ borderTop: '1px solid var(--border-subtle)', background: isHovered ? 'var(--neutral-50)' : opt.is_recommended ? 'rgba(16,185,129,0.05)' : undefined }}>
                                        <td className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--fg-primary)' }}>
                                            {opt.label}
                                            {opt.is_recommended && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">balanced pick</span>}
                                        </td>
                                        {opt.objectives.map(o => (
                                            <td key={o.goal_description} className="px-3 py-2 text-xs tabular-nums" style={{ color: 'var(--fg-secondary)' }}>{o.display}</td>
                                        ))}
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                onClick={() => handleSelect(opt.option_id)}
                                                disabled={selecting === opt.option_id}
                                                className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50"
                                                style={{ background: 'var(--brand-maroon)', border: 0, cursor: 'pointer' }}
                                            >
                                                {selecting === opt.option_id
                                                    ? <Loader2 size={11} className="animate-spin inline" />
                                                    : <span className="inline-flex items-center gap-1"><Check size={11} /> Select</span>}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ParetoExplorer;
