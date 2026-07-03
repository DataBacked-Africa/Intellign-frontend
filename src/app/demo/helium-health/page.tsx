"use client";

/**
 * /demo/helium-health — Helium Health pitch demo.
 * Three scenarios mapped to real HeliumOS modules (bed assignment, appointment
 * scheduling, ward personnel assignment). Bed Assignment and Appointment
 * Scheduling are real generation+solver output captured ahead of time. Ward
 * Personnel Assignment runs live against the real backend on click, with a
 * silent fallback to a captured snapshot if the live call errors or times out.
 */

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Play, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemoBundle } from './data/types';
import bedAssignmentData from './data/bed_assignment.json';
import appointmentSchedulingData from './data/appointment_scheduling.json';
import wardPersonnelFallbackData from './data/ward_personnel_fallback.json';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://intellign.up.railway.app').replace(/\/$/, '');
const WARD_RUN_URL = `${API_URL}/demo/helium-health/ward-personnel/run`;
const LIVE_TIMEOUT_MS = 55_000;

const T = {
    bone: '#F4EFE7', boneDeep: '#E8E0D2', maroon: '#5C1427', maroonDeep: '#3E0E1A',
    maroonRich: '#731931', ink: '#14110F',
    neutral50: '#FAFAF8', neutral100: '#F2F1ED', neutral200: '#E5E3DC',
    neutral400: '#9E9C92', neutral500: '#6F6E66', neutral600: '#4A4945', neutral700: '#2E2D2A',
};

type ScenarioId = 'bed' | 'appointment' | 'ward';

interface ScenarioDef {
    id: ScenarioId;
    heliumModule: string;
    title: string;
    blurb: string;
    resourceLabel: string;
    targetLabel: string;
    live: boolean;
    data: DemoBundle | null;
}

const SCENARIOS: ScenarioDef[] = [
    {
        id: 'bed', heliumModule: 'Bed Management', title: 'Bed Assignment',
        blurb: '60 patients → 20 beds, matching condition to ward type and prioritising acuity.',
        resourceLabel: 'patients', targetLabel: 'beds', live: false,
        data: bedAssignmentData as unknown as DemoBundle,
    },
    {
        id: 'appointment', heliumModule: 'Appointment Scheduling', title: 'Appointment Scheduling',
        blurb: '30 doctors → 8 clinic departments, covering a week of patient appointment demand.',
        resourceLabel: 'doctors', targetLabel: 'clinic departments', live: false,
        data: appointmentSchedulingData as unknown as DemoBundle,
    },
    {
        id: 'ward', heliumModule: 'Not yet in HeliumOS — new opportunity', title: 'Ward Personnel Assignment',
        blurb: '40 staff → 10 wards, matching specialization to ward need and ward acuity.',
        resourceLabel: 'staff', targetLabel: 'wards', live: true,
        data: null,
    },
];

const StatusBadge = ({ status }: { status: string }) => {
    const s: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700',
        pending_review: 'bg-amber-100 text-amber-700',
        pending: 'bg-amber-100 text-amber-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', s[status] ?? 'bg-gray-100 text-gray-600')}>{status.replace(/_/g, ' ')}</span>;
};

const FitnessChart = ({ history }: { history: number[] }) => {
    if (!history || history.length < 2) return null;
    const w = 560, h = 130, pad = 20;
    const maxV = Math.max(...history);
    const minV = Math.min(...history);
    const range = maxV - minV || 1;
    const gx = (i: number) => pad + (i / (history.length - 1)) * (w - 2 * pad);
    const gy = (v: number) => h - pad - ((v - minV) / range) * (h - 2 * pad);
    const path = history.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const last = [gx(history.length - 1), gy(history[history.length - 1])];
    return (
        <div style={{ background: T.ink, borderRadius: 10, padding: '14px 16px 8px' }}>
            <div style={{ color: T.bone, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Fitness convergence ({history.length} generations)</div>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 110 }}>
                <defs>
                    <linearGradient id="fg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#D49AAA" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#D49AAA" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`${path} L${last[0].toFixed(1)} ${(h - pad).toFixed(1)} L${pad} ${(h - pad).toFixed(1)} Z`} fill="url(#fg)" />
                <path d={path} fill="none" stroke="#D49AAA" strokeWidth="2" />
                <circle cx={last[0]} cy={last[1]} r="3.5" fill={T.ink} stroke="#D49AAA" strokeWidth="1.5" />
            </svg>
        </div>
    );
};

const MetricsGrid = ({ bundle }: { bundle: DemoBundle }) => {
    const m = bundle.metrics;
    const showRawFitness = bundle.solver_used !== 'schedule';
    const tiles = [
        { lbl: 'Assigned', val: `${m.assigned_count}`, sub: `of ${m.total_resources}` },
        { lbl: 'Quality', val: m.quality_label, hi: true },
        { lbl: 'Coverage', val: `${m.coverage_pct}%` },
        showRawFitness
            ? { lbl: 'Best fitness', val: m.best_fitness.toFixed(2) }
            : { lbl: 'Solver', val: m.solver_used },
    ];
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {tiles.map(t => (
                <div key={t.lbl} style={{ background: '#fff', border: `1px solid ${(t as any).hi ? 'rgba(92,20,39,0.22)' : T.neutral200}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.neutral500, marginBottom: 4 }}>{t.lbl}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: (t as any).hi ? T.maroon : T.ink }}>{t.val}</div>
                </div>
            ))}
        </div>
    );
};

const GoalsList = ({ goals }: { goals: DemoBundle['goals'] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {goals.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8 }}>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', background: g.award_type === 'Reward' ? '#D1FAE5' : '#FEE2E2', color: g.award_type === 'Reward' ? '#047857' : '#B91C1C' }}>
                    {g.award_type}
                </span>
                <div style={{ flex: 1, fontSize: 13, color: T.ink }}>{g.description}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: T.neutral700 }}>{g.weight}%</span>
            </div>
        ))}
    </div>
);

const AssignmentsTable = ({ assignments, showScore }: { assignments: DemoBundle['assignments']; showScore: boolean }) => (
    <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
                    {['Resource', 'Target', ...(showScore ? ['Fit %'] : []), 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {assignments.slice(0, 100).map(a => (
                    <tr key={a.assignment_id} style={{ borderTop: `1px solid ${T.neutral200}` }}>
                        <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: T.neutral700 }}>{a.resource_id}</td>
                        <td style={{ padding: '7px 12px', color: T.neutral600 }}>{a.target_id}</td>
                        {showScore && <td style={{ padding: '7px 12px', fontWeight: 600, color: '#047857' }}>{a.score.toFixed(0)}</td>}
                        <td style={{ padding: '7px 12px' }}><StatusBadge status={a.approval_status} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

type LiveState = 'idle' | 'generating' | 'error';

export default function HeliumHealthDemoPage() {
    const [activeId, setActiveId] = useState<ScenarioId>('bed');
    const [liveState, setLiveState] = useState<LiveState>('idle');
    const [liveBundle, setLiveBundle] = useState<DemoBundle | null>(null);
    const [usedFallback, setUsedFallback] = useState(false);

    const active = SCENARIOS.find(s => s.id === activeId)!;
    const bundle: DemoBundle | null = active.live ? liveBundle : active.data;

    const runLive = useCallback(async () => {
        setLiveState('generating');
        setUsedFallback(false);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
        try {
            const res = await fetch(WARD_RUN_URL, { method: 'POST', signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as DemoBundle;
            setLiveBundle(data);
            setLiveState('idle');
        } catch {
            setLiveBundle(wardPersonnelFallbackData as unknown as DemoBundle);
            setUsedFallback(true);
            setLiveState('idle');
        } finally {
            clearTimeout(timeout);
        }
    }, []);

    return (
        <div data-theme="light" style={{ minHeight: '100dvh', width: '100%', background: T.bone, fontFamily: 'var(--font-sans)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', background: T.maroonDeep, color: T.bone, fontSize: 12.5, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>Helium Health &times; Intellign</span>
                <span>Three HeliumOS optimization opportunities — real generated data, real solver runs.</span>
                <Link href="/demo" style={{ marginLeft: 'auto', color: T.bone, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    <ArrowLeft size={13} /> All demos
                </Link>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 26 }}>
                    {SCENARIOS.map(s => {
                        const isActive = s.id === activeId;
                        return (
                            <button key={s.id} onClick={() => setActiveId(s.id)}
                                style={{
                                    textAlign: 'left', padding: '16px 16px', borderRadius: 12, cursor: 'pointer',
                                    background: isActive ? '#fff' : T.boneDeep,
                                    border: `2px solid ${isActive ? T.maroon : 'transparent'}`,
                                    fontFamily: 'inherit',
                                }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.live ? T.maroon : T.neutral500, marginBottom: 6 }}>
                                    {s.heliumModule}
                                </div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: T.ink, marginBottom: 4 }}>{s.title}</div>
                                <div style={{ fontSize: 12, color: T.neutral600, lineHeight: 1.4 }}>{s.blurb}</div>
                                {s.live && (
                                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(92,20,39,0.08)', color: T.maroon }}>
                                        <Play size={9} fill={T.maroon} /> RUNS LIVE
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {active.live && (
                    <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button onClick={runLive} disabled={liveState === 'generating'}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: T.maroon, color: T.bone, border: 0, borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: liveState === 'generating' ? 'default' : 'pointer', opacity: liveState === 'generating' ? 0.7 : 1 }}>
                            {liveState === 'generating' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill={T.bone} />}
                            {liveState === 'generating' ? 'Generating + solving live…' : bundle ? 'Run again' : 'Run live'}
                        </button>
                        <span style={{ fontSize: 12, color: T.neutral500 }}>
                            {liveState === 'generating'
                                ? 'Real synthetic ward-staffing data is being generated now, then solved — this takes ~30–40s.'
                                : bundle
                                    ? (usedFallback ? 'Showing a captured snapshot (live call did not complete in time).' : 'Live result from this run.')
                                    : 'Nothing generated yet — click to generate real data and solve it live.'}
                        </span>
                    </div>
                )}

                {bundle ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <MetricsGrid bundle={bundle} />
                        <FitnessChart history={bundle.fitness_history} />
                        <div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 10px' }}>Goals</h3>
                            <GoalsList goals={bundle.goals} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 10px' }}>
                                Assignments <span style={{ color: T.neutral500, fontWeight: 400 }}>({bundle.assignments.length})</span>
                            </h3>
                            <AssignmentsTable assignments={bundle.assignments} showScore={bundle.solver_used !== 'schedule'} />
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: T.neutral500, fontSize: 13 }}>
                        Click &ldquo;Run live&rdquo; above to generate and solve this scenario.
                    </div>
                )}

                <div style={{ marginTop: 30, padding: '14px 16px', background: 'rgba(92,20,39,0.05)', border: `1px solid rgba(92,20,39,0.15)`, borderRadius: 10, fontSize: 12.5, color: T.neutral700, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <CheckCircle2 size={16} style={{ color: T.maroon, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 260 }}>
                        Integrating Intellign into HeliumOS means calling one endpoint &mdash; <code style={{ fontFamily: 'var(--font-mono)' }}>POST /api/v1/optimize</code> &mdash;
                        with your own resources, targets, and goals, and getting solved assignments back. No chat, no manual review workflow required.
                    </span>
                    <Link href="/demo/helium-health/sandbox"
                        style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: T.maroon, color: T.bone, borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>
                        Try the sandbox &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
