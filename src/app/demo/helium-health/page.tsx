"use client";

/**
 * /demo/helium-health — Helium Health pitch demo.
 * Same chat + sliding-canvas shell as the main /demo page, fed with real
 * generated data and real solver output for three HeliumOS opportunities.
 * Bed Assignment and Appointment Scheduling are precomputed (real pipeline
 * output captured ahead of time); Ward Personnel Assignment runs live
 * against the real backend on click, with a silent fallback to a captured
 * snapshot if the live call errors or times out.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, User, CheckCircle2, Database, Target, Zap, ChevronRight, Download,
    ChevronDown, Check, Edit3, X, Search,
    Minimize2, Plus, Trash2, Save, Settings, Share2,
    TrendingUp, Play, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    HELIUM_SCENARIOS, bundleToScenario, toGoals, toAssignments,
    type HeliumScenario as Scenario, type MockGoal, type MockAssignment, type RawBundle,
} from './demoData';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://intellign.up.railway.app').replace(/\/$/, '');
const WARD_RUN_URL = `${API_URL}/demo/helium-health/ward-personnel/run`;

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    bone:      '#F4EFE7',
    boneDeep:  '#E8E0D2',
    boneDarker:'#DDD5C5',
    maroon:    '#5C1427',
    maroonDeep:'#3E0E1A',
    maroonRich:'#731931',
    maroonMid: '#8A1E3A',
    ink:       '#14110F',
    neutral50: '#FAFAF8',
    neutral100:'#F2F1ED',
    neutral200:'#E5E3DC',
    neutral300:'#CDCBC2',
    neutral400:'#9E9C92',
    neutral500:'#6F6E66',
    neutral600:'#4A4945',
    neutral700:'#2E2D2A',
};

// ── Shared components ──────────────────────────────────────────────────────────

const ShareButton: React.FC<{ slug: string }> = ({ slug }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        navigator.clipboard?.writeText(`${origin}/share/helium-${slug}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    };
    return (
        <button onClick={copy} title="Share this session (demo)"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 13, color: T.neutral600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <Check size={13} /> : <Share2 size={13} />} {copied ? 'Link copied' : 'Share'}
        </button>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const s: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        modified: 'bg-blue-100 text-blue-700',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', s[status] ?? 'bg-gray-100 text-gray-600')}>{status}</span>;
};

const FitnessChart = ({ history, avgHistory }: { history: number[]; avgHistory: number[] }) => {
    const w = 560; const h = 140; const pad = 24;
    if (!history || history.length < 2) {
        return (
            <div style={{ background: T.ink, borderRadius: 10, padding: '16px 18px', color: T.neutral400, fontSize: 12.5, textAlign: 'center' }}>
                Run the optimization to see the convergence curve.
            </div>
        );
    }
    const avg = avgHistory && avgHistory.length === history.length ? avgHistory : history;
    const maxV = Math.max(...history, ...avg);
    const minV = Math.min(...history, ...avg);
    const range = maxV - minV || 1;
    const gx = (i: number) => pad + (i / (history.length - 1)) * (w - 2 * pad);
    const gy = (v: number) => h - pad - ((v - minV) / range) * (h - 2 * pad);
    const fitPath = history.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const avgPath = avg.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const last = [gx(history.length - 1), gy(history[history.length - 1])];
    return (
        <div style={{ background: T.ink, borderRadius: 10, padding: '16px 18px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: T.bone, fontSize: 13, fontWeight: 600 }}>Fitness convergence · {history.length} generations</span>
                <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#999' }}><span style={{ display: 'inline-block', width: 14, height: 2, background: '#D49AAA' }} /> Best</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#999' }}><span style={{ display: 'inline-block', width: 14, height: 2, background: '#6B7280', opacity: 0.5 }} /> Average</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 130 }}>
                <defs>
                    <linearGradient id="fg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#D49AAA" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#D49AAA" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(t => (
                    <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - 2 * pad)} y2={h - pad - t * (h - 2 * pad)} stroke="rgba(255,255,255,0.06)" />
                ))}
                <path d={`${fitPath} L${last[0].toFixed(1)} ${(h - pad).toFixed(1)} L${pad} ${(h - pad).toFixed(1)} Z`} fill="url(#fg)" />
                <path d={avgPath} fill="none" stroke="rgba(107,114,128,0.4)" strokeWidth="1.5" />
                <path d={fitPath} fill="none" stroke="#D49AAA" strokeWidth="2" />
                <circle cx={last[0]} cy={last[1]} r="3.5" fill={T.ink} stroke="#D49AAA" strokeWidth="1.5" />
            </svg>
        </div>
    );
};

// ── Canvas tabs ────────────────────────────────────────────────────────────────

const TIMELINE = [
    { stage: 'ingest',    label: 'Data validated',            sub: 'Resources & targets checked' },
    { stage: 'translate', label: 'Goals compiled',            sub: 'Goals → executable fitness function' },
    { stage: 'init',      label: 'Solver selected',           sub: 'Router picked best-fit solver for this problem' },
    { stage: 'solve',     label: 'Solver running',            sub: 'Evaluating candidate assignments' },
    { stage: 'converge',  label: 'Convergence detected',      sub: 'Fitness plateau reached' },
    { stage: 'explain',   label: 'Rationale generated',       sub: 'Per-assignment notes ready' },
];

const MonitorTab = ({ runStage, scenario, isLiveWaiting }: { runStage: string; scenario: Scenario; isLiveWaiting: boolean }) => {
    const stageIdx = ['idle','ingest','translate','init','solve','converge','explain','done'].indexOf(runStage);
    const done = runStage === 'done';
    const m = scenario.metrics;
    const stats = [
        { lbl: 'Generation', val: done ? String(m.generations_run) : isLiveWaiting ? '…' : '0' },
        { lbl: 'Best fitness', val: done ? m.best_fitness.toFixed(3) : '—' },
        { lbl: 'Elapsed', val: done ? `${m.elapsed_time_seconds.toFixed(1)}s` : isLiveWaiting ? '…' : '—' },
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isLiveWaiting && (
                <div style={{ padding: '8px 12px', background: 'rgba(92,20,39,0.06)', border: `1px solid rgba(92,20,39,0.15)`, borderRadius: 8, fontSize: 12, color: T.maroonDeep }}>
                    Generating real synthetic data and solving live — this genuinely takes ~30–45s, not a canned animation.
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {stats.map(s => (
                    <div key={s.lbl} style={{ background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 6 }}>{s.lbl}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1, fontWeight: 400, color: (s.val === '0' || s.val === '—' || s.val === '…') ? T.neutral400 : T.ink, letterSpacing: '-0.02em' }}>{s.val}</div>
                    </div>
                ))}
            </div>
            <FitnessChart history={done ? scenario.fitnessHistory : []} avgHistory={scenario.avgHistory} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TIMELINE.map((t, i) => {
                    const tDone = i < stageIdx;
                    const active = i === stageIdx;
                    return (
                        <div key={t.stage} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral400, flexShrink: 0, paddingTop: 1, width: 16, textAlign: 'center' }}>
                                {tDone ? '✓' : active ? '…' : '·'}
                            </div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${T.maroon}`, background: tDone ? T.maroon : active ? '#F59E0B' : T.boneDeep, borderColor: active ? '#F59E0B' : T.maroon, marginTop: 3, flexShrink: 0 }} />
                            <div style={{ flex: 1, color: T.ink }}>
                                {t.label}
                                <span style={{ display: 'block', color: T.neutral500, fontSize: 11.5, marginTop: 1 }}>{t.sub}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ResultsTab = ({ scenario }: { scenario: Scenario }) => {
    const m = scenario.metrics;
    const counts = scenario.assignments.reduce<Record<string, number>>((acc, a) => {
        acc[a.approval_status] = (acc[a.approval_status] ?? 0) + 1;
        return acc;
    }, {});
    const total = scenario.assignments.length || 1;
    const rows: [string, string][] = [
        ['approved', '#10B981'], ['pending', '#F59E0B'], ['rejected', '#EF4444'], ['modified', '#3B82F6'],
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                    { lbl: 'Resources assigned', val: String(m.assigned_count), sub: `of ${m.total_resources}`, hi: true },
                    { lbl: 'Target pool', val: String(m.total_targets) },
                    { lbl: 'Best fitness', val: m.best_fitness.toFixed(3) },
                    { lbl: 'Generations', val: String(m.generations_run) },
                ].map(mt => (
                    <div key={mt.lbl} style={{ background: '#fff', border: `1px solid ${mt.hi ? 'rgba(92,20,39,0.22)' : T.neutral200}`, borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.neutral500, marginBottom: 4 }}>{mt.lbl}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: mt.hi ? T.maroon : T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{mt.val}</span>
                            {mt.sub && <span style={{ fontSize: 12, color: T.neutral500 }}>{mt.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>
            <FitnessChart history={scenario.fitnessHistory} avgHistory={scenario.avgHistory} />
            <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: T.ink }}>
                    {m.quality_label} · {m.coverage_pct}% coverage · solved by {m.solver_used}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: 11.5, color: T.neutral500 }}>
                    Approval status (auto-approved for this demo run — a human review workflow is available for lower-confidence pairs)
                </p>
                {rows.map(([lbl, c]) => (
                    <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.neutral600 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                            {lbl.charAt(0).toUpperCase() + lbl.slice(1)}
                        </span>
                        <span style={{ fontWeight: 600, color: T.ink }}>{counts[lbl] ?? 0}</span>
                    </div>
                ))}
                <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', marginTop: 10, background: T.neutral100 }}>
                    {rows.map(([lbl, c]) => (
                        <div key={lbl} style={{ height: '100%', width: `${((counts[lbl] ?? 0) / total) * 100}%`, background: c }} />
                    ))}
                </div>
                {scenario.note && (
                    <p style={{ marginTop: 12, fontSize: 11.5, color: T.neutral500, borderTop: `1px dashed ${T.neutral200}`, paddingTop: 10 }}>
                        {scenario.note}
                    </p>
                )}
            </div>
        </div>
    );
};

const AssignmentsTab = ({ assignments }: { assignments: MockAssignment[] }) => {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<Record<string, string>>(
        Object.fromEntries(assignments.map(a => [a.assignment_id, a.approval_status]))
    );
    useEffect(() => {
        setStatuses(Object.fromEntries(assignments.map(a => [a.assignment_id, a.approval_status])));
    }, [assignments]);
    return (
        <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                    <tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
                        <th style={{ width: 28, padding: '8px 10px' }}></th>
                        {['Resource', 'Target', 'Score', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {assignments.slice(0, 120).map(a => {
                        const isExp = expanded === a.assignment_id;
                        const status = statuses[a.assignment_id] ?? a.approval_status;
                        return (
                            <React.Fragment key={a.assignment_id}>
                                <tr style={{ borderTop: `1px solid ${T.neutral200}`, background: isExp ? T.neutral50 : undefined, transition: 'background 140ms' }}>
                                    <td style={{ padding: '8px 10px' }}>
                                        <button onClick={() => setExpanded(isExp ? null : a.assignment_id)}
                                            style={{ width: 22, height: 22, border: 0, background: 'transparent', color: T.neutral400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer' }}>
                                            <ChevronDown size={13} style={{ transform: isExp ? 'rotate(180deg)' : undefined, transition: 'transform 140ms' }} />
                                        </button>
                                    </td>
                                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: T.neutral700 }}>{a.resource.id}</td>
                                    <td style={{ padding: '8px 12px', color: T.neutral600 }}>{a.target.id}</td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#047857' }}>{a.score.toFixed(a.score > 3 ? 0 : 3)}</td>
                                    <td style={{ padding: '8px 12px' }}><StatusBadge status={status} /></td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', gap: 3 }}>
                                            {(['approved','modified','rejected'] as const).map((s, si) => (
                                                <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [a.assignment_id]: s }))}
                                                    style={{ width: 26, height: 26, borderRadius: 6, border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: status === s ? [T.maroon, '#1D4ED8', '#B91C1C'][si] : T.neutral400 }}
                                                    title={s}>
                                                    {si === 0 ? <Check size={13} /> : si === 1 ? <Edit3 size={13} /> : <X size={13} />}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                                {isExp && (
                                    <tr>
                                        <td colSpan={6} style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}`, padding: '10px 14px 14px 14px' }}>
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, margin: '0 0 6px' }}>Why this pairing</p>
                                            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: T.neutral700, margin: '0 0 10px' }}>
                                                {a.notes ?? `Resource ${a.resource.id} assigned to Target ${a.target.id}. Score reflects the weighted objective function across all defined goals.`}
                                            </p>
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, margin: '0 0 6px' }}>Match score</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 5, background: T.neutral200, borderRadius: 999, overflow: 'hidden', maxWidth: 200 }}>
                                                    <div style={{ height: '100%', width: `${Math.min(100, Math.round(a.score > 3 ? a.score : a.score * 100))}%`, background: '#10B981', borderRadius: 999 }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#047857' }}>{a.score.toFixed(a.score > 3 ? 0 : 3)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ── Goals tab — full CRUD (decorative, same as the main demo) ─────────────────

const LOGIC_TYPES = ['weighted_scoring', 'categorical_match', 'spatial_proximity', 'numeric_threshold', 'set_coverage', 'temporal_match'];
const LOGIC_LABELS: Record<string, string> = {
    weighted_scoring: 'Weighted Scoring', categorical_match: 'Attribute Matching',
    spatial_proximity: 'Distance / Proximity', numeric_threshold: 'Numeric Threshold',
    set_coverage: 'Skill Coverage', temporal_match: 'Schedule Matching',
};

interface GoalsTabProps {
    goals: MockGoal[];
    onAdd: (g: MockGoal) => void;
    onUpdate: (id: string, patch: Partial<MockGoal>) => void;
    onDelete: (id: string) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ goals, onAdd, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [draft, setDraft] = useState<Partial<MockGoal>>({});
    const total = goals.reduce((s, g) => s + g.weight, 0);

    const startEdit = (g: MockGoal) => { setEditingId(g.id); setDraft({ ...g }); setAddingNew(false); };
    const startAdd = () => { setAddingNew(true); setEditingId(null); setDraft({ description: '', award_type: 'Reward', weight: 25, logic_type: 'categorical_match' }); };
    const cancelEdit = () => { setEditingId(null); setAddingNew(false); setDraft({}); };

    const saveEdit = () => {
        if (!draft.description?.trim()) return;
        if (addingNew) {
            onAdd({ id: `g${Date.now()}`, description: draft.description!, award_type: draft.award_type ?? 'Reward', weight: draft.weight ?? 25, logic_type: draft.logic_type ?? 'categorical_match', resource_columns: [], target_columns: [] });
        } else if (editingId) {
            onUpdate(editingId, draft);
        }
        cancelEdit();
    };

    const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: `1px solid ${T.neutral200}`, borderRadius: 6, fontSize: 12, outline: 'none', background: '#fff', color: T.ink, fontFamily: 'inherit' };
    const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 4 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: T.neutral600 }}>
                    {goals.length} goal{goals.length !== 1 ? 's' : ''} · weights total{' '}
                    <b style={{ fontFamily: 'var(--font-mono)', color: total === 100 ? '#047857' : '#B45309' }}>{total}%</b>
                </span>
                <button onClick={startAdd}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: T.maroon, color: T.bone, border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={12} /> Add goal
                </button>
            </div>

            {addingNew && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#fff', border: `2px solid ${T.maroon}`, borderRadius: 10, padding: 14 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, margin: '0 0 12px', fontWeight: 600 }}>New goal</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div><label style={labelStyle}>Description</label>
                            <textarea value={draft.description ?? ''} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="e.g. Maximize skill match score" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={labelStyle}>Type</label>
                                <select value={draft.award_type ?? 'Reward'} onChange={e => setDraft(p => ({ ...p, award_type: e.target.value as any }))} style={inputStyle}>
                                    <option>Reward</option><option>Penalty</option>
                                </select>
                            </div>
                            <div><label style={labelStyle}>Logic</label>
                                <select value={draft.logic_type ?? 'categorical_match'} onChange={e => setDraft(p => ({ ...p, logic_type: e.target.value }))} style={inputStyle}>
                                    {LOGIC_TYPES.map(t => <option key={t} value={t}>{LOGIC_LABELS[t]}</option>)}
                                </select>
                            </div>
                        </div>
                        <div><label style={labelStyle}>Weight — <b style={{ color: T.maroon }}>{draft.weight ?? 25}%</b></label>
                            <input type="range" min={0} max={100} step={5} value={draft.weight ?? 25} onChange={e => setDraft(p => ({ ...p, weight: Number(e.target.value) }))} style={{ width: '100%', accentColor: T.maroon }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={cancelEdit} style={{ padding: '6px 12px', border: 0, background: 'transparent', color: T.neutral500, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: T.maroon, color: T.bone, border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <Save size={12} /> Save
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {goals.map(g => {
                const isEditing = editingId === g.id;
                return (
                    <div key={g.id} style={{ background: '#fff', border: `1px solid ${isEditing ? T.maroon : T.neutral200}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 140ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', background: g.award_type === 'Reward' ? '#D1FAE5' : '#FEE2E2', color: g.award_type === 'Reward' ? '#047857' : '#B91C1C' }}>
                                {g.award_type}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, lineHeight: 1.4 }}>{g.description}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral500, marginTop: 2 }}>{LOGIC_LABELS[g.logic_type] ?? g.logic_type}</div>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: T.neutral700, flexShrink: 0 }}>{g.weight}%</span>
                            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                <button onClick={() => isEditing ? cancelEdit() : startEdit(g)}
                                    style={{ width: 28, height: 28, border: 0, background: 'transparent', color: T.neutral400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}
                                    title={isEditing ? 'Cancel' : 'Edit'}>
                                    {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                                </button>
                                <button onClick={() => onDelete(g.id)}
                                    style={{ width: 28, height: 28, border: 0, background: 'transparent', color: T.neutral400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}
                                    title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        {!isEditing && (
                            <div style={{ height: 3, background: T.neutral100, marginBottom: 0 }}>
                                <div style={{ height: '100%', width: `${g.weight}%`, background: `linear-gradient(90deg, ${T.maroon}, ${T.maroonRich})` }} />
                            </div>
                        )}
                        {isEditing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ borderTop: `1px solid ${T.neutral100}`, padding: '12px 14px', background: T.neutral50 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div><label style={labelStyle}>Description</label>
                                        <textarea value={draft.description ?? ''} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div><label style={labelStyle}>Type</label>
                                            <select value={draft.award_type ?? g.award_type} onChange={e => setDraft(p => ({ ...p, award_type: e.target.value as any }))} style={inputStyle}>
                                                <option>Reward</option><option>Penalty</option>
                                            </select>
                                        </div>
                                        <div><label style={labelStyle}>Logic</label>
                                            <select value={draft.logic_type ?? g.logic_type} onChange={e => setDraft(p => ({ ...p, logic_type: e.target.value }))} style={inputStyle}>
                                                {LOGIC_TYPES.map(t => <option key={t} value={t}>{LOGIC_LABELS[t]}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div><label style={labelStyle}>Weight — <b style={{ color: T.maroon }}>{draft.weight ?? g.weight}%</b></label>
                                        <input type="range" min={0} max={100} step={5} value={draft.weight ?? g.weight} onChange={e => setDraft(p => ({ ...p, weight: Number(e.target.value) }))} style={{ width: '100%', accentColor: T.maroon }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button onClick={cancelEdit} style={{ padding: '6px 12px', border: 0, background: 'transparent', color: T.neutral500, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                        <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: T.maroon, color: T.bone, border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                            <Save size={12} /> Save changes
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                );
            })}

            {goals.length === 0 && (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: T.neutral400 }}>
                    <Target size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: T.maroonDeep }}>No goals yet.</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Run the scenario to compile goals from the conversation.</p>
                </div>
            )}
        </div>
    );
};

const ConfigTab = ({ scenario }: { scenario: Scenario }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>Solver</span><span style={{ color: T.maroon }}>Auto-selected by Intellign</span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(92,20,39,0.05)', border: `1px solid ${T.maroon}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.maroonDeep }}>{scenario.solver}</div>
                <div style={{ fontSize: 11.5, color: T.neutral500, marginTop: 2, lineHeight: 1.4 }}>
                    Routed automatically based on problem type ({scenario.task.toLowerCase()}) and data scale — no manual solver selection needed.
                </div>
            </div>
        </div>
        <div style={{ borderTop: `1px dashed ${T.neutral200}`, paddingTop: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 10 }}>Run parameters</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div style={{ color: T.neutral600 }}>Population size <b style={{ color: T.ink, float: 'right' }}>100</b></div>
                <div style={{ color: T.neutral600 }}>Max generations <b style={{ color: T.ink, float: 'right' }}>{Math.max(scenario.metrics.generations_run, 40)}</b></div>
            </div>
        </div>
    </div>
);

const DatasetsTab = ({ scenario }: { scenario: Scenario }) => {
    const [active, setActive] = useState<'resources' | 'targets'>('resources');
    const rows = active === 'resources' ? scenario.resources : scenario.targets;
    if (!rows.length) {
        return <div style={{ padding: 40, textAlign: 'center', color: T.neutral400, fontSize: 13 }}>Run the scenario to generate data.</div>;
    }
    const cols = Object.keys(rows[0] ?? {}).map(k => k.replace(/_/g, ' '));
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', padding: 3, background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 999, gap: 2 }}>
                    {(['resources', 'targets'] as const).map(t => (
                        <button key={t} onClick={() => setActive(t)}
                            style={{ padding: '4px 12px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: active === t ? T.maroon : 'transparent', color: active === t ? T.bone : T.neutral600 }}>
                            {t === 'resources'
                                ? `${scenario.resourceLabel} · ${scenario.resourceCount}`
                                : `${scenario.targetLabel} · ${scenario.targetCount}`}
                        </button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 6, fontSize: 12, color: T.neutral600, cursor: 'pointer' }}>
                    <Download size={12} /> Export .csv
                </button>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                        <tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
                            {cols.map(c => (
                                <th key={c} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r: any, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${T.neutral200}` }}>
                                {Object.values(r).map((v: any, j) => (
                                    <td key={j} style={{ padding: '8px 12px', fontFamily: j === 0 ? 'var(--font-mono)' : undefined, fontSize: j === 0 ? 11 : 12, color: j === 0 ? T.ink : T.neutral600 }}>{String(v)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '8px 12px', fontSize: 11, color: T.neutral400, fontFamily: 'var(--font-mono)', borderTop: `1px solid ${T.neutral100}` }}>
                    Showing {rows.length} of {active === 'resources' ? scenario.resourceCount : scenario.targetCount} · real generated data ({scenario.title})
                </div>
            </div>
        </div>
    );
};

// ── Canvas panel ──────────────────────────────────────────────────────────────

type CanvasTab = 'monitor' | 'results' | 'assignments' | 'goals' | 'config' | 'datasets';

interface CanvasProps {
    runStage: string;
    isLiveWaiting: boolean;
    goals: MockGoal[];
    onGoalAdd: (g: MockGoal) => void;
    onGoalUpdate: (id: string, patch: Partial<MockGoal>) => void;
    onGoalDelete: (id: string) => void;
    tab: CanvasTab;
    onTabChange: (t: CanvasTab) => void;
    onClose: () => void;
    onMinimize: () => void;
    scenario: Scenario;
}

const Canvas: React.FC<CanvasProps> = ({ scenario, runStage, isLiveWaiting, goals, onGoalAdd, onGoalUpdate, onGoalDelete, tab, onTabChange, onClose, onMinimize }) => {
    const isDone = runStage === 'done';
    const tabs: { id: CanvasTab; label: string; badge?: number }[] = [
        { id: 'monitor', label: 'Monitor' },
        { id: 'results', label: 'Results' },
        { id: 'assignments', label: 'Assignments', badge: scenario.assignments.length },
        { id: 'goals', label: 'Goals', badge: goals.length },
        { id: 'config', label: 'Config' },
        { id: 'datasets', label: 'Datasets' },
    ];
    return (
        <aside style={{
            width: "min(720px, 100%)", flexShrink: 1, minWidth: 0, background: '#fff',
            borderLeft: `1px solid ${T.neutral200}`,
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.neutral200}`, background: T.neutral50, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : runStage !== 'idle' ? '#F59E0B' : T.maroon, boxShadow: runStage !== 'idle' && !isDone ? '0 0 0 4px rgba(245,158,11,0.18)' : undefined, display: 'inline-block' }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: T.maroonDeep, letterSpacing: '-0.015em', margin: 0 }}>{scenario.title}</h2>
                    {scenario.live && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(92,20,39,0.08)', color: T.maroon, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={onMinimize} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }} title="Minimize"><Minimize2 size={15} /></button>
                    <button onClick={onClose} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }} title="Close"><X size={15} /></button>
                </div>
            </div>

            <div style={{ display: 'flex', padding: '0 18px', borderBottom: `1px solid ${T.neutral200}`, background: '#fff', flexShrink: 0 }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => onTabChange(t.id)}
                        style={{
                            position: 'relative', padding: '11px 16px', border: 0, background: 'transparent',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                            color: tab === t.id ? T.maroon : T.neutral500,
                            borderBottom: `2px solid ${tab === t.id ? T.maroon : 'transparent'}`,
                            marginBottom: -1,
                        }}>
                        {t.label}
                        {t.badge !== undefined && t.badge > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(92,20,39,0.1)', color: T.maroonDeep, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 999, marginLeft: 5 }}>
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                {tab === 'monitor' && <MonitorTab runStage={runStage} scenario={scenario} isLiveWaiting={isLiveWaiting} />}
                {tab === 'results' && (isDone ? <ResultsTab scenario={scenario} /> : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: T.maroonDeep }}>Results appear once the solver converges.</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Watch the Monitor tab live. We&rsquo;ll switch you over automatically.</p>
                    </div>
                ))}
                {tab === 'assignments' && (isDone ? <AssignmentsTab assignments={scenario.assignments} /> : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: T.maroonDeep }}>No assignments yet.</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Once converged, every resource → target pairing lands here for review.</p>
                    </div>
                ))}
                {tab === 'goals' && <GoalsTab goals={goals} onAdd={onGoalAdd} onUpdate={onGoalUpdate} onDelete={onGoalDelete} />}
                {tab === 'config' && <ConfigTab scenario={scenario} />}
                {tab === 'datasets' && <DatasetsTab scenario={scenario} />}
            </div>
        </aside>
    );
};

// ── Message bubble ─────────────────────────────────────────────────────────────

const renderMd = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        const isTableHeader = trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && /^\|[\s|:-]+\|/.test(lines[i + 1].trim());
        if (isTableHeader) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) { tableLines.push(lines[i]); i++; }
            if (tableLines.length >= 2) {
                const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
                const isSep = (l: string) => /^[\s|:-]+$/.test(l.replace(/\|/g, ''));
                const headers = parseRow(tableLines[0]);
                const bodyRows = tableLines.slice(2).filter(l => !isSep(l)).map(parseRow);
                result.push(
                    <div key={`tbl-${i}`} style={{ overflowX: 'auto', margin: '6px 0', borderRadius: 8, border: `1px solid ${T.neutral200}` }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead><tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>{headers.map((h, hi) => <th key={hi} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: T.neutral600, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                            <tbody>{bodyRows.map((row, ri) => <tr key={ri} style={{ borderTop: `1px solid ${T.neutral100}` }}>{row.map((cell, ci) => <td key={ci} style={{ padding: '6px 10px', color: T.neutral700 }}>{cell}</td>)}</tr>)}</tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }
        const isBullet = /^[-*]\s+/.test(line);
        const content = isBullet ? line.replace(/^[-*]\s+/, '') : line;
        const inline: React.ReactNode[] = [];
        const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
        let last = 0; let m: RegExpExecArray | null;
        while ((m = regex.exec(content)) !== null) {
            if (m.index > last) inline.push(content.slice(last, m.index));
            if (m[1]) inline.push(<strong key={m.index} style={{ color: T.ink, fontWeight: 700 }}>{m[1]}</strong>);
            else if (m[2]) inline.push(<code key={m.index} style={{ padding: '1px 5px', background: 'rgba(0,0,0,0.06)', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{m[2]}</code>);
            last = m.index + m[0].length;
        }
        if (last < content.length) inline.push(content.slice(last));
        const rendered = inline.length ? inline : [content];
        result.push(
            <React.Fragment key={i}>
                {isBullet ? <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', margin: '3px 0' }}><span style={{ marginTop: 9, width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.4, flexShrink: 0 }} /><span>{rendered}</span></div> : <span>{rendered}</span>}
                {i < lines.length - 1 && !isBullet && <br />}
            </React.Fragment>
        );
        i++;
    }
    return result;
};

// Build the demo conversation from the active scenario so chat always matches it.
const buildMessages = (s: Scenario) => {
    const goalLines = s.goals.length
        ? s.goals.map(g => `- ${g.description} · **${g.weight}%**`).join('\n')
        : '- (compiled once you generate the sample below)';
    const sample = s.resources.slice(0, 3);
    const cols = sample.length ? Object.keys(sample[0] ?? {}).slice(0, 4) : [];
    const head = cols.length ? `| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|` : '';
    const tableRows = sample.map((r: any) => `| ${cols.map(c => r[c]).join(' | ')} |`).join('\n');
    const liveNote = s.live
        ? '\n\n*This one runs live — clicking Run below actually generates fresh synthetic data and solves it against our real backend, right now, not a replay.*'
        : '';
    return [
        { id: '1', role: 'user' as const, content: s.userPrompt, ts: '09:41' },
        { id: '2', role: 'assistant' as const, content: `Got it — here's what I understand:\n\n- **${s.resourceLabel}** → **${s.targetLabel}**\n- **Objectives:** ${s.goals.map(g => g.description.replace(/\.$/, '')).join(' · ') || 'match need to capability, balance load'}${liveNote}\n\nPick a data source and confirm the goals you care about:`, ts: '09:41', action: null, chips: ['Generate a sample for me', "I'll upload my data"] },
        { id: '3', role: 'user' as const, content: `Generate a sample for me.`, ts: '09:42' },
        { id: '4', role: 'assistant' as const, content: `Generating a realistic sample now — **${s.resourceCount} ${s.resourceLabel}** and **${s.targetCount} ${s.targetLabel}**.\n\n${head}\n${tableRows}\n\nI've compiled your goals (tune weights in the **Goals** tab):\n\n${goalLines}\n\n**Shall I run the optimization now?**`, ts: '09:42', action: 'generate_sample_dataset', goals: true },
        { id: '5', role: 'user' as const, content: 'Yes, run it.', ts: '09:43' },
        { id: '6', role: 'assistant' as const, content: `Optimization dispatched via the **${s.solver}** — the canvas shows live progress. Every assignment comes back with a per-decision rationale you can review, approve, or modify.`, ts: '09:43', action: 'optimization_started', run: true },
    ];
};

const MessageBubble = ({ msg, onOpenCanvas, onStartRun, runStage }: { msg: any; onOpenCanvas: (tab: CanvasTab) => void; onStartRun: () => void; runStage: string }) => {
    const isUser = msg.role === 'user';
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUser ? T.boneDeep : `linear-gradient(135deg, #6B1A30, #9A3050)`, border: isUser ? `1px solid ${T.neutral300}` : 'none' }}>
                {isUser ? <User size={13} style={{ color: T.neutral600 }} /> : <Bot size={13} style={{ color: T.bone }} />}
            </div>
            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={isUser ? { background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: '18px 4px 18px 18px', padding: '9px 14px', fontSize: 14, lineHeight: 1.55, color: T.ink } : { fontSize: 14, lineHeight: 1.6, color: T.ink, paddingTop: 2 }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{renderMd(msg.content)}</div>
                    {msg.action && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'rgba(92,20,39,0.08)', color: T.maroon, marginTop: 8 }}>
                            <CheckCircle2 size={10} /> {msg.action}
                        </div>
                    )}
                    {msg.chips && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                            {msg.chips.map((c: string) => (
                                <span key={c} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid rgba(92,20,39,0.2)`, background: 'rgba(92,20,39,0.05)', color: T.maroonDeep, fontWeight: 500 }}>
                                    {c}
                                </span>
                            ))}
                        </div>
                    )}
                    {msg.goals && (
                        <button onClick={() => onOpenCanvas('goals')}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: T.maroon, background: 'rgba(92,20,39,0.06)', border: `1px solid rgba(92,20,39,0.15)`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Target size={12} /> Open Goals tab in canvas →
                        </button>
                    )}
                    {msg.run && runStage === 'idle' && (
                        <button onClick={onStartRun}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 600, color: T.bone, background: T.maroon, border: 0, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Play size={13} fill={T.bone} /> Watch the solve live
                        </button>
                    )}
                </div>
                <div style={{ fontSize: 10, color: T.neutral400, padding: '0 3px' }}>{msg.ts}</div>
            </div>
        </div>
    );
};

// ── Main demo page ─────────────────────────────────────────────────────────────

const STAGES = ['ingest','translate','init','solve','converge','explain','done'] as const;

export default function HeliumHealthDemoPage() {
    const [canvasOpen, setCanvasOpen] = useState(false);
    const [canvasMinimized, setCanvasMinimized] = useState(false);
    const [canvasTab, setCanvasTab] = useState<CanvasTab>('monitor');
    const [runStage, setRunStage] = useState('idle');
    const [scenarioId, setScenarioId] = useState(HELIUM_SCENARIOS[0].id);
    const baseScenario = HELIUM_SCENARIOS.find(s => s.id === scenarioId) ?? HELIUM_SCENARIOS[0];
    const [liveOverride, setLiveOverride] = useState<Partial<Scenario> | null>(null);
    const [isLiveWaiting, setIsLiveWaiting] = useState(false);
    const [goals, setGoals] = useState<MockGoal[]>(baseScenario.goals);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const runTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const finishTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const scenario: Scenario = useMemo(
        () => (baseScenario.live && liveOverride ? { ...baseScenario, ...liveOverride } : baseScenario),
        [baseScenario, liveOverride],
    );

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, []);

    const openCanvas = useCallback((tab: CanvasTab = 'monitor') => {
        setCanvasOpen(true);
        setCanvasMinimized(false);
        setCanvasTab(tab);
    }, []);

    const runLiveWard = useCallback(async (): Promise<Partial<Scenario>> => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 55_000);
            const res = await fetch(WARD_RUN_URL, { method: 'POST', signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const raw = (await res.json()) as RawBundle;
            const built = bundleToScenario(raw, {
                id: 'ward', heliumModule: baseScenario.heliumModule, domain: baseScenario.domain, task: baseScenario.task,
                title: baseScenario.title, blurb: baseScenario.blurb, resourceLabel: baseScenario.resourceLabel,
                targetLabel: baseScenario.targetLabel, userPrompt: baseScenario.userPrompt, live: true,
            });
            return built;
        } catch {
            // Silent fallback to the captured snapshot — same shape, presenter never sees an error.
            const { wardPersonnelFallbackScenario } = await import('./demoData');
            return wardPersonnelFallbackScenario;
        }
    }, [baseScenario]);

    const startRun = useCallback(() => {
        openCanvas('monitor');
        setRunStage('ingest');
        let idx = 0;
        if (runTimer.current) clearInterval(runTimer.current);
        if (finishTimer.current) clearInterval(finishTimer.current);

        if (scenario.live) {
            setIsLiveWaiting(true);
            let resolved = false;
            runLiveWard().then(bundle => {
                resolved = true;
                setLiveOverride(bundle);
            });
            runTimer.current = setInterval(() => {
                const nextIdx = idx + 1;
                const nextStage = STAGES[nextIdx];
                // Hold at 'solve' until the real call resolves — this is genuinely
                // waiting on network + LLM generation + solver time, not a fixed animation.
                if (nextStage === 'converge' && !resolved) return;
                idx = nextIdx;
                setRunStage(nextStage);
                if (nextStage === 'converge') {
                    setIsLiveWaiting(false);
                    clearInterval(runTimer.current!);
                    finishTimer.current = setInterval(() => {
                        idx++;
                        if (idx >= STAGES.length) {
                            setRunStage('done');
                            setCanvasTab('results');
                            clearInterval(finishTimer.current!);
                            return;
                        }
                        setRunStage(STAGES[idx]);
                    }, 500);
                }
            }, 1400);
        } else {
            runTimer.current = setInterval(() => {
                idx++;
                if (idx >= STAGES.length) {
                    setRunStage('done');
                    setCanvasTab('results');
                    clearInterval(runTimer.current!);
                } else {
                    setRunStage(STAGES[idx]);
                }
            }, 700);
        }
    }, [openCanvas, scenario.live, runLiveWard]);

    useEffect(() => () => {
        if (runTimer.current) clearInterval(runTimer.current);
        if (finishTimer.current) clearInterval(finishTimer.current);
    }, []);

    const handleGoalAdd = (g: MockGoal) => setGoals(prev => [...prev, g]);
    const handleGoalUpdate = (id: string, patch: Partial<MockGoal>) => setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
    const handleGoalDelete = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

    const switchScenario = useCallback((id: string) => {
        const sc = HELIUM_SCENARIOS.find(s => s.id === id) ?? HELIUM_SCENARIOS[0];
        if (runTimer.current) clearInterval(runTimer.current);
        if (finishTimer.current) clearInterval(finishTimer.current);
        setScenarioId(id);
        setGoals(sc.goals);
        setLiveOverride(null);
        setIsLiveWaiting(false);
        setRunStage('idle');
        setCanvasOpen(false);
    }, []);

    const canvasVisible = canvasOpen && !canvasMinimized;
    const isDone = runStage === 'done';

    return (
        <div data-theme="light" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '7px 16px', background: T.maroonDeep, color: T.bone, fontSize: 12.5, flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Helium Health × Intellign · {scenario.heliumModule}</span>
                <span>{scenario.blurb} · real generated data{scenario.live ? ', runs live' : ''}.</span>
                <Link href="/demo/helium-health/sandbox" style={{ color: T.bone, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    See the integration sandbox →
                </Link>
            </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', background: T.bone, overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
            <aside style={{ width: 260, background: T.bone, borderRight: `1px solid ${T.boneDeep}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '14px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, fontFamily: 'var(--font-display)', fontSize: 22, color: T.maroonDeep }}>
                        Intellign
                    </div>
                    <Link href="/demo" title="All demos" style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}>
                        <ArrowLeft size={17} />
                    </Link>
                </div>
                <div style={{ padding: '0 12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: T.boneDeep }}>
                        <Search size={14} style={{ color: T.neutral600, flexShrink: 0 }} />
                        <input placeholder="Search chats" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 13.5, color: T.ink, fontFamily: 'inherit' }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.ink, padding: '6px 8px', marginBottom: 2 }}>HeliumOS opportunities</p>
                    {HELIUM_SCENARIOS.map(s => {
                        const activeS = scenarioId === s.id;
                        return (
                            <div key={s.id} onClick={() => switchScenario(s.id)}
                                style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: activeS ? T.boneDeep : 'transparent', marginBottom: 1 }}
                                onMouseEnter={e => { if (!activeS) (e.currentTarget as HTMLDivElement).style.background = T.boneDeep; }}
                                onMouseLeave={e => { if (!activeS) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                                <div style={{ fontSize: 13, color: T.ink, fontWeight: activeS ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {s.title}
                                    {s.live && <Play size={9} fill={T.maroon} style={{ color: T.maroon, flexShrink: 0 }} />}
                                </div>
                                <div style={{ fontSize: 10.5, color: T.neutral500, marginTop: 1 }}>{s.heliumModule}</div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ padding: '8px 12px 10px' }}>
                    <Link href="/demo/helium-health/sandbox"
                        style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'rgba(92,20,39,0.06)', border: `1px solid rgba(92,20,39,0.15)` }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.maroon, fontWeight: 700 }}>Integration proof</span>
                        <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>POST /api/v1/optimize →</span>
                    </Link>
                </div>
                <div style={{ borderTop: `1px solid ${T.boneDeep}`, padding: '8px 12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(92,20,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: T.maroon, flexShrink: 0 }}>H</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Helium Health</p>
                            <p style={{ fontSize: 11, color: T.neutral500, margin: 0 }}>Design partner walkthrough</p>
                        </div>
                    </div>
                </div>
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'max-width 280ms cubic-bezier(0.2,0,0,1)', maxWidth: canvasVisible ? 'calc(100% - 720px)' : '100%' }}>
                <header style={{ height: 54, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244,239,231,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid transparent`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: T.maroonDeep, padding: '5px 8px' }}>Intellign AI</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.neutral400 }}>
                            <ChevronDown size={13} />
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShareButton slug={scenario.id} />
                        {!canvasOpen && (
                            <button onClick={() => openCanvas('goals')}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 13, color: T.neutral600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <Settings size={13} /> Canvas
                            </button>
                        )}
                        <button onClick={startRun}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: T.maroon, color: T.bone, border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Play size={13} fill={T.bone} /> Run optimization
                        </button>
                    </div>
                </header>

                <div style={{ padding: '8px 16px 4px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', padding: '9px 14px', background: T.boneDeep, border: `1px solid ${T.neutral200}`, borderRadius: 14, fontSize: 12 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, paddingRight: 12, borderRight: `1px solid rgba(0,0,0,0.08)` }}>Active problem</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <b style={{ color: T.ink, fontFamily: 'var(--font-sans)' }}>{scenario.title}</b>
                        </span>
                        <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <Database size={12} style={{ color: T.neutral500 }} />
                            <b style={{ color: T.ink }}>{scenario.resourceCount}</b> {scenario.resourceLabel} · <b style={{ color: T.ink }}>{scenario.targetCount}</b> {scenario.targetLabel}
                        </span>
                        <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <Target size={12} style={{ color: T.neutral500 }} />
                            <b style={{ color: T.ink }}>{goals.length}</b> goals
                        </span>
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '1px solid rgba(0,0,0,0.08)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isDone ? '#10B981' : runStage !== 'idle' ? '#F59E0B' : '#10B981', display: 'inline-block', boxShadow: isDone ? undefined : runStage !== 'idle' ? '0 0 0 3px rgba(245,158,11,0.18)' : '0 0 0 3px rgba(16,185,129,0.16)' }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: isDone ? '#047857' : runStage !== 'idle' ? '#B45309' : '#047857' }}>
                                {isDone ? 'Converged' : runStage !== 'idle' ? (isLiveWaiting ? 'Generating + solving live…' : 'Solving…') : 'Ready to optimize'}
                            </span>
                            {runStage === 'idle' && (
                                <button onClick={startRun} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: T.maroon, color: T.bone, border: 0, borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 4 }}>
                                    <Zap size={11} /> Run
                                </button>
                            )}
                            {isDone && (
                                <button onClick={() => openCanvas('results')} style={{ fontSize: 11, color: T.maroon, background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'inherit', marginLeft: 4 }}>
                                    Open canvas
                                </button>
                            )}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        {[
                            { label: 'Data ready', done: scenario.resources.length > 0 || runStage !== 'idle', tab: 'datasets' as CanvasTab },
                            { label: 'Goals defined', done: goals.length > 0, tab: 'goals' as CanvasTab },
                            { label: 'Ready to optimize', done: isDone, tab: 'results' as CanvasTab },
                        ].map((item, idx, arr) => (
                            <React.Fragment key={item.label}>
                                <button onClick={() => openCanvas(item.tab)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, border: `1px solid ${item.done ? 'rgba(92,20,39,0.2)' : T.neutral200}`, background: item.done ? 'rgba(92,20,39,0.07)' : T.boneDeep, color: item.done ? T.maroon : T.neutral400, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em' }}>
                                    {item.done ? <CheckCircle2 size={11} /> : <span style={{ width: 10, height: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>○</span>}
                                    {item.label}
                                </button>
                                {idx < arr.length - 1 && <ChevronRight size={11} style={{ color: T.neutral300, flexShrink: 0 }} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {buildMessages(scenario).map(msg => <MessageBubble key={msg.id} msg={msg} onOpenCanvas={openCanvas} onStartRun={startRun} runStage={runStage} />)}
                </div>

                <div style={{ padding: '8px 16px 10px', background: 'rgba(244,239,231,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
                    <div style={{ background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: 24, padding: '4px 6px 4px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Continue the conversation…"
                            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 14, fontFamily: 'inherit', color: T.ink, height: 38 }} />
                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: input.trim() ? T.maroon : T.neutral200, border: 0, cursor: input.trim() ? 'pointer' : 'default', color: input.trim() ? T.bone : T.neutral400, flexShrink: 0 }}>
                            <Zap size={15} />
                        </button>
                    </div>
                </div>

                {canvasOpen && canvasMinimized && (
                    <button onClick={() => setCanvasMinimized(false)}
                        style={{ position: 'absolute', right: 22, bottom: 80, display: 'flex', alignItems: 'center', gap: 8, background: T.maroon, color: T.bone, border: 0, borderRadius: 999, padding: '9px 16px', boxShadow: '0 6px 18px rgba(92,20,39,0.28)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFD08A', animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
                        {isDone ? `Optimization complete · ${scenario.metrics.assigned_count} / ${scenario.metrics.total_resources} assigned` : (isLiveWaiting ? 'Generating + solving live…' : 'Solving…')}
                        <TrendingUp size={14} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {canvasVisible && (
                    <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                        <Canvas
                            scenario={scenario}
                            runStage={runStage}
                            isLiveWaiting={isLiveWaiting}
                            goals={goals}
                            onGoalAdd={handleGoalAdd}
                            onGoalUpdate={handleGoalUpdate}
                            onGoalDelete={handleGoalDelete}
                            tab={canvasTab}
                            onTabChange={setCanvasTab}
                            onClose={() => { setCanvasOpen(false); setCanvasMinimized(false); }}
                            onMinimize={() => setCanvasMinimized(true)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </div>
    );
}
