"use client";

/**
 * /demo — Full DS shell: sidebar + chat (narrows on canvas open) + sliding canvas panel.
 * Canvas has Monitor / Results / Assignments / Goals / Config / Datasets tabs.
 * Goals tab has full CRUD (add, edit weight/type/description, delete).
 * No backend required — all mock data.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, User, CheckCircle2, Database, Target, Zap, ChevronRight, Download,
    Sparkles, ChevronDown, Check, Edit3, X, Search, SquarePen, LogOut,
    PanelLeftClose, Minimize2, Plus, Trash2, Save, Cpu, Settings,
    TrendingUp, Play, BarChart2, ChevronLeft, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GoalDetailPanel from '@/components/AI-Components/GoalDetailPanel';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    bone:      '#F4EFE7',
    boneDeep:  '#E8E0D2',
    boneDarker:'#DDD5C5',
    maroon:    '#5C1427',   // CTAs, active tabs, weight bars, badges — sparingly
    maroonDeep:'#3E0E1A',   // Display headlines only
    maroonRich:'#731931',
    maroonMid: '#8A2B42',   // Softer accent for non-CTA uses
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

// ── Mock data ─────────────────────────────────────────────────────────────────

interface MockGoal {
    id: string;
    description: string;
    award_type: 'Reward' | 'Penalty';
    weight: number;
    logic_type: string;
    resource_columns: string[];
    target_columns: string[];
}

const INITIAL_GOALS: MockGoal[] = [
    { id: 'g1', description: 'Prioritise high-need, underserved facilities.', award_type: 'Reward', weight: 45, logic_type: 'weighted_scoring', resource_columns: [], target_columns: ['need_score'] },
    { id: 'g2', description: 'Match nurse qualifications to facility requirements.', award_type: 'Reward', weight: 35, logic_type: 'categorical_match', resource_columns: ['qualifications'], target_columns: ['required_skills'] },
    { id: 'g3', description: 'Penalise long deployment distances.', award_type: 'Penalty', weight: 20, logic_type: 'spatial_proximity', resource_columns: ['location_x', 'location_y'], target_columns: ['location_x', 'location_y'] },
];

const MOCK_ASSIGNMENTS = [
    { assignment_id: '1', resource: { id: 'HW-0042' }, target: { id: 'FAC-LAG-12' }, score: 0.962, approval_status: 'approved' as const, notes: 'Adaeze N. (RN, ICU) matched to Lagos PHC — ICU + emergency cover priority. Closest ICU-trained resource (5 km, in-state). No shift conflicts next week.' },
    { assignment_id: '2', resource: { id: 'HW-0118' }, target: { id: 'FAC-KAN-03' }, score: 0.941, approval_status: 'approved' as const, notes: 'Yusuf I. (RN, Pediatrics) to Kano Cottage — same-state assignment, pediatric specialisation exact match.' },
    { assignment_id: '3', resource: { id: 'HW-0067' }, target: { id: 'FAC-ENU-08' }, score: 0.912, approval_status: 'pending' as const, notes: 'Chiamaka O. (Midwife) to Enugu MCH — exact specialty fit. Score slightly reduced: 3× deployments in last 30 days (load-balancing penalty).' },
    { assignment_id: '4', resource: { id: 'HW-0089' }, target: { id: 'FAC-ABU-21' }, score: 0.876, approval_status: 'modified' as const, notes: null },
    { assignment_id: '5', resource: { id: 'HW-0014' }, target: { id: 'FAC-PHC-05' }, score: 0.854, approval_status: 'approved' as const, notes: null },
    { assignment_id: '6', resource: { id: 'HW-0103' }, target: { id: 'FAC-IBA-02' }, score: 0.831, approval_status: 'pending' as const, notes: null },
    { assignment_id: '7', resource: { id: 'HW-0029' }, target: { id: 'FAC-KAD-14' }, score: 0.791, approval_status: 'rejected' as const, notes: null },
];

const RESOURCES = [
    { id: 'HW-0042', name: 'Adaeze N.',   qualifications: 'RN, ICU',         state: 'Lagos',  availability: 'Mon–Sat' },
    { id: 'HW-0118', name: 'Yusuf I.',    qualifications: 'RN, Pediatrics',  state: 'Kano',   availability: 'Mon–Fri' },
    { id: 'HW-0067', name: 'Chiamaka O.', qualifications: 'Midwife',         state: 'Enugu',  availability: 'Mon–Sun' },
    { id: 'HW-0089', name: 'Tunde A.',    qualifications: 'Community CHEW',  state: 'FCT',    availability: 'Mon–Fri' },
    { id: 'HW-0014', name: 'Folake B.',   qualifications: 'RN, Cardio',      state: 'PH',     availability: 'Mon–Sat' },
];
const TARGETS = [
    { id: 'FAC-LAG-12', name: 'Lagos PHC, Ajeromi',  need: 'ICU + emergency',      state: 'Lagos',  capacity: 4 },
    { id: 'FAC-KAN-03', name: 'Kano Cottage Hospital',need: 'Pediatric + maternal', state: 'Kano',   capacity: 6 },
    { id: 'FAC-ENU-08', name: 'Enugu MCH',            need: 'Midwife + outreach',   state: 'Enugu',  capacity: 3 },
    { id: 'FAC-ABU-21', name: 'FCT Field clinic',     need: 'CHEW',                 state: 'FCT',    capacity: 8 },
    { id: 'FAC-PHC-05', name: 'PH Health Centre',     need: 'Cardio + general',     state: 'Rivers', capacity: 5 },
];

const FITNESS_HISTORY = Array.from({ length: 60 }, (_, i) =>
    parseFloat(Math.min(0.987, 0.55 + 0.41 * (1 - Math.exp(-i / 14))).toFixed(3))
);
const AVG_HISTORY = Array.from({ length: 60 }, (_, i) =>
    parseFloat(Math.min(0.92, 0.4 + 0.42 * (1 - Math.exp(-i / 22))).toFixed(3))
);

const SESSIONS = [
    { id: 's1', name: 'Q4 nurse roster · Lagos University Hospital' },
    { id: 's2', name: 'Logistics — multi-stop delivery routes' },
    { id: 's3', name: 'Teacher placement, Greater Accra' },
    { id: 's4', name: 'Field worker assignment, Northern region' },
];

// ── Shared components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const s: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        modified: 'bg-blue-100 text-blue-700',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', s[status] ?? 'bg-gray-100 text-gray-600')}>{status}</span>;
};

const FitnessChart = () => {
    const w = 560; const h = 140; const pad = 24;
    const maxV = Math.max(...FITNESS_HISTORY, ...AVG_HISTORY);
    const minV = Math.min(...FITNESS_HISTORY, ...AVG_HISTORY);
    const range = maxV - minV || 1;
    const gx = (i: number) => pad + (i / (FITNESS_HISTORY.length - 1)) * (w - 2 * pad);
    const gy = (v: number) => h - pad - ((v - minV) / range) * (h - 2 * pad);
    const fitPath = FITNESS_HISTORY.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const avgPath = AVG_HISTORY.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const last = [gx(FITNESS_HISTORY.length - 1), gy(FITNESS_HISTORY[FITNESS_HISTORY.length - 1])];
    return (
        <div style={{ background: T.ink, borderRadius: 10, padding: '16px 18px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: T.bone, fontSize: 13, fontWeight: 600 }}>Fitness convergence</span>
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
    { stage: 'ingest',    label: 'Data ingested',             sub: '150 resources · 20 targets' },
    { stage: 'translate', label: 'Problem translated',        sub: 'Goals + constraints formalised' },
    { stage: 'init',      label: 'Population seeded',         sub: '256 candidate assignments' },
    { stage: 'solve',     label: 'Genetic algorithm running', sub: 'Mutating, crossing over, evaluating' },
    { stage: 'converge',  label: 'Convergence detected',      sub: 'Δ-fitness < 1e-4 for 50 generations' },
    { stage: 'explain',   label: 'Rationale generated',       sub: 'Per-assignment notes ready' },
];

const MonitorTab = ({ runStage }: { runStage: string }) => {
    const stageIdx = ['idle','ingest','translate','init','solve','converge','explain','done'].indexOf(runStage);
    const stats = [
        { lbl: 'Generation', val: runStage === 'done' ? '1,847' : '0' },
        { lbl: 'Best fitness', val: runStage === 'done' ? '0.987' : '—' },
        { lbl: 'Elapsed', val: runStage === 'done' ? '4.2s' : '—' },
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {stats.map(s => (
                    <div key={s.lbl} style={{ background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 6 }}>{s.lbl}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1, fontWeight: 400, color: s.val === '0' || s.val === '—' ? T.neutral400 : T.ink, letterSpacing: '-0.02em' }}>{s.val}</div>
                    </div>
                ))}
            </div>
            <FitnessChart />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TIMELINE.map((t, i) => {
                    const done = i < stageIdx;
                    const active = i === stageIdx;
                    return (
                        <div key={t.stage} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral400, flexShrink: 0, paddingTop: 1, width: 16, textAlign: 'center' }}>
                                {done ? '✓' : active ? '…' : '·'}
                            </div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${T.maroon}`, background: done ? T.maroon : active ? '#F59E0B' : T.boneDeep, borderColor: active ? '#F59E0B' : T.maroon, marginTop: 3, flexShrink: 0 }} />
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

const ResultsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
                { lbl: 'Resources assigned', val: '118', sub: 'of 150', hi: true },
                { lbl: 'Target pool', val: '20' },
                { lbl: 'Best fitness', val: '0.987' },
                { lbl: 'Generations', val: '1,847' },
            ].map(m => (
                <div key={m.lbl} style={{ background: '#fff', border: `1px solid ${m.hi ? 'rgba(92,20,39,0.22)' : T.neutral200}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.neutral500, marginBottom: 4 }}>{m.lbl}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: m.hi ? T.maroon : T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{m.val}</span>
                        {m.sub && <span style={{ fontSize: 12, color: T.neutral500 }}>{m.sub}</span>}
                    </div>
                </div>
            ))}
        </div>
        <FitnessChart />
        <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: T.ink }}>Approval status</h3>
            {[
                { lbl: 'Approved', n: 92, c: '#10B981' }, { lbl: 'Pending', n: 18, c: '#F59E0B' },
                { lbl: 'Rejected', n: 4, c: '#EF4444' }, { lbl: 'Modified', n: 4, c: '#3B82F6' },
            ].map(item => (
                <div key={item.lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.neutral600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.c, display: 'inline-block' }} />
                        {item.lbl}
                    </span>
                    <span style={{ fontWeight: 600, color: T.ink }}>{item.n}</span>
                </div>
            ))}
            <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', marginTop: 10, background: T.neutral100 }}>
                {[78, 15.3, 3.4, 3.4].map((pct, i) => (
                    <div key={i} style={{ height: '100%', width: `${pct}%`, background: ['#10B981','#F59E0B','#EF4444','#3B82F6'][i] }} />
                ))}
            </div>
        </div>
    </div>
);

const AssignmentsTab = () => {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [statuses, setStatuses] = useState(
        Object.fromEntries(MOCK_ASSIGNMENTS.map(a => [a.assignment_id, a.approval_status]))
    );
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
                    {MOCK_ASSIGNMENTS.map(a => {
                        const isExp = expanded === a.assignment_id;
                        const status = statuses[a.assignment_id];
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
                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#047857' }}>{a.score.toFixed(3)}</td>
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
                                                {a.notes ?? `Resource ${a.resource.id} assigned to Target ${a.target.id}. Score reflects weighted objective function across all defined goals.`}
                                            </p>
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, margin: '0 0 6px' }}>Match score</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 5, background: T.neutral200, borderRadius: 999, overflow: 'hidden', maxWidth: 200 }}>
                                                    <div style={{ height: '100%', width: `${Math.round(a.score * 100)}%`, background: '#10B981', borderRadius: 999 }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#047857' }}>{a.score.toFixed(3)}</span>
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

// ── Goals tab — full CRUD ─────────────────────────────────────────────────────

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
            {/* Header */}
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

            {/* Add new form */}
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

            {/* Goal list */}
            {goals.map(g => {
                const isEditing = editingId === g.id;
                return (
                    <div key={g.id} style={{ background: '#fff', border: `1px solid ${isEditing ? T.maroon : T.neutral200}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 140ms' }}>
                        {/* Row header */}
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

                        {/* Weight bar */}
                        {!isEditing && (
                            <div style={{ height: 3, background: T.neutral100, marginBottom: 0 }}>
                                <div style={{ height: '100%', width: `${g.weight}%`, background: `linear-gradient(90deg, ${T.maroon}, ${T.maroonRich})` }} />
                            </div>
                        )}

                        {/* Inline edit form */}
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
                    <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add goal" to define your first objective.</p>
                </div>
            )}
        </div>
    );
};

const ConfigTab = () => {
    const [solver, setSolver] = useState('ga');
    const [pop, setPop] = useState(256);
    const [maxGens, setMaxGens] = useState(2000);
    const solvers = [
        { id: 'ga', name: 'Genetic algorithm', desc: 'Best for large assignment problems.' },
        { id: 'greedy', name: 'Greedy solver', desc: 'Fast, good for initial estimates.' },
        { id: 'ortools', name: 'OR-Tools CP', desc: 'When constraints dominate search.' },
        { id: 'schedule', name: 'Schedule solver', desc: 'Shift/time-window problems.' },
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Solver</span><span style={{ color: T.maroon }}>Auto-selected by Intellign</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {solvers.map(s => (
                        <button key={s.id} onClick={() => setSolver(s.id)}
                            style={{ textAlign: 'left', cursor: 'pointer', padding: '10px 12px', borderRadius: 6, background: solver === s.id ? 'rgba(92,20,39,0.05)' : '#fff', border: `1px solid ${solver === s.id ? T.maroon : T.neutral200}`, fontFamily: 'inherit' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: solver === s.id ? T.maroonDeep : T.ink }}>{s.name}</div>
                            <div style={{ fontSize: 11.5, color: T.neutral500, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ borderTop: `1px dashed ${T.neutral200}`, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                    { lbl: 'Population size', val: pop, min: 64, max: 1024, step: 32, set: setPop },
                    { lbl: 'Max generations', val: maxGens, min: 500, max: 5000, step: 100, set: setMaxGens },
                ].map(r => (
                    <div key={r.lbl}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.neutral600, marginBottom: 4 }}>
                            <span>{r.lbl}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: T.maroonDeep, fontWeight: 600 }}>{r.val.toLocaleString()}</span>
                        </div>
                        <input type="range" min={r.min} max={r.max} step={r.step} value={r.val}
                            onChange={e => r.set(Number(e.target.value))}
                            style={{ width: '100%', accentColor: T.maroon }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const DatasetsTab = () => {
    const [active, setActive] = useState<'resources' | 'targets'>('resources');
    const rows = active === 'resources' ? RESOURCES : TARGETS;
    const cols = active === 'resources' ? ['ID', 'Name', 'Qualifications', 'State', 'Availability'] : ['ID', 'Name', 'Need profile', 'State', 'Capacity'];
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', padding: 3, background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 999, gap: 2 }}>
                    {(['resources', 'targets'] as const).map(t => (
                        <button key={t} onClick={() => setActive(t)}
                            style={{ padding: '4px 12px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: active === t ? T.maroon : 'transparent', color: active === t ? T.bone : T.neutral600 }}>
                            {t === 'resources' ? 'Resources · 150' : 'Targets · 20'}
                        </button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 6, fontSize: 12, color: T.neutral600, cursor: 'pointer' }}>
                    <Download size={12} /> Export .csv
                </button>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
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
                                    <td key={j} style={{ padding: '8px 12px', fontFamily: j === 0 ? 'var(--font-mono)' : undefined, fontSize: j === 0 ? 11 : 12, color: j === 0 ? T.ink : T.neutral600 }}>{v}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '8px 12px', fontSize: 11, color: T.neutral400, fontFamily: 'var(--font-mono)', borderTop: `1px solid ${T.neutral100}` }}>
                    Showing {rows.length} of {active === 'resources' ? 150 : 20} · source: {active === 'resources' ? 'uploaded + synthetic columns' : 'generated'}
                </div>
            </div>
        </div>
    );
};

// ── Canvas panel ──────────────────────────────────────────────────────────────

type CanvasTab = 'monitor' | 'results' | 'assignments' | 'goals' | 'config' | 'datasets';

interface CanvasProps {
    runStage: string;
    goals: MockGoal[];
    onGoalAdd: (g: MockGoal) => void;
    onGoalUpdate: (id: string, patch: Partial<MockGoal>) => void;
    onGoalDelete: (id: string) => void;
    tab: CanvasTab;
    onTabChange: (t: CanvasTab) => void;
    onClose: () => void;
    onMinimize: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ runStage, goals, onGoalAdd, onGoalUpdate, onGoalDelete, tab, onTabChange, onClose, onMinimize }) => {
    const isDone = runStage === 'done';
    const tabs: { id: CanvasTab; label: string; badge?: number }[] = [
        { id: 'monitor', label: 'Monitor' },
        { id: 'results', label: 'Results' },
        { id: 'assignments', label: 'Assignments', badge: MOCK_ASSIGNMENTS.length },
        { id: 'goals', label: 'Goals', badge: goals.length },
        { id: 'config', label: 'Config' },
        { id: 'datasets', label: 'Datasets' },
    ];
    return (
        <aside style={{
            width: 720, flexShrink: 0, background: '#fff',
            borderLeft: `1px solid ${T.neutral200}`,
            display: 'flex', flexDirection: 'column',
            animation: 'canvas-in 280ms cubic-bezier(0.2,0,0,1)',
        }}>
            {/* Head */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.neutral200}`, background: T.neutral50, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : runStage !== 'idle' ? '#F59E0B' : T.maroon, boxShadow: runStage !== 'idle' && !isDone ? '0 0 0 4px rgba(245,158,11,0.18)' : undefined, display: 'inline-block' }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: T.maroonDeep, letterSpacing: '-0.015em', margin: 0 }}>Healthcare deployment</h2>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral400 }}>· 0a8f3c</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={onMinimize} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }} title="Minimize"><Minimize2 size={15} /></button>
                    <button onClick={onClose} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }} title="Close"><X size={15} /></button>
                </div>
            </div>

            {/* Tabs */}
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
                        {t.badge !== undefined && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(92,20,39,0.1)', color: T.maroonDeep, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 999, marginLeft: 5 }}>
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                {tab === 'monitor' && <MonitorTab runStage={runStage} />}
                {tab === 'results' && (isDone ? <ResultsTab /> : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: T.maroonDeep }}>Results appear once the solver converges.</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Watch the Monitor tab live. We'll switch you over automatically.</p>
                    </div>
                ))}
                {tab === 'assignments' && (isDone ? <AssignmentsTab /> : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: T.maroonDeep }}>No assignments yet.</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Once converged, every resource → target pairing lands here for review.</p>
                    </div>
                ))}
                {tab === 'goals' && <GoalsTab goals={goals} onAdd={onGoalAdd} onUpdate={onGoalUpdate} onDelete={onGoalDelete} />}
                {tab === 'config' && <ConfigTab />}
                {tab === 'datasets' && <DatasetsTab />}
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

const MOCK_MESSAGES_LIST = [
    { id: '1', role: 'user' as const, content: 'I need to assign 150 nurses to 20 clinics based on qualifications, availability, and minimize travel distance.', ts: '09:41' },
    { id: '2', role: 'assistant' as const, content: "Got it. Before we look at data, a few quick questions:\n\n- Roughly how many nurses and clinics are involved?\n- What are the main constraints — availability windows, skill requirements?\n- Do you have existing data to upload, or should I generate a sample dataset?", ts: '09:41', action: null },
    { id: '3', role: 'user' as const, content: '150 nurses, 20 clinics. Key constraints are availability and specialization match. I have a CSV.', ts: '09:42' },
    { id: '4', role: 'assistant' as const, content: "Perfect — please share your file and I'll analyse it.\n\nI've set up the goal model:\n- **Problem type:** Staff assignment\n- **Entities:** Nurses → Clinics\n- **Objectives:** Minimize overtime · Match specializations\n- **Scale:** Medium", ts: '09:42', action: 'await_data_upload' },
    { id: '5', role: 'user' as const, content: 'Here is my nurse data.', ts: '09:43', files: [{ name: 'nurses.csv', size: '48 KB' }] },
    { id: '6', role: 'assistant' as const, content: "I've reviewed your nurse data — **150 records**, looks clean.\n\nBased on your goal I also need clinic information, and I noticed gaps:\n\n- Clinic table (id, name, capacity, required_skills)\n- Nurse columns: hourly_cost, location_x, location_y\n\nWant me to generate realistic clinic data and fill the missing nurse columns?", ts: '09:43', action: 'ingest_files' },
    { id: '7', role: 'user' as const, content: 'Generate it all.', ts: '09:44' },
    { id: '8', role: 'assistant' as const, content: "Generated **20 clinic profiles** and filled the nurse gaps — here's a preview.\n\n| Clinic ID | Name | Capacity | Required skills |\n|---|---|---|---|\n| C001 | Port Clinic | 8 | General, Triage |\n| C002 | Heart Centre | 12 | Cardio, General |\n| C003 | North Hub | 6 | Surgery, General |\n\nConfirm to finalize.", ts: '09:44', action: 'generate_missing_tables' },
    { id: '9', role: 'user' as const, content: 'Looks good, finalize.', ts: '09:45' },
    { id: '10', role: 'assistant' as const, content: "All set.\n- **Resources:** 150 nurses (your data + synthetic columns)\n- **Targets:** 20 clinics (generated)\n\nNow tell me your optimization goals in plain English.", ts: '09:45', action: 'finalize' },
    { id: '11', role: 'user' as const, content: 'Prioritize underserved areas, match qualifications to clinic needs, and minimize travel distance.', ts: '09:46' },
    { id: '12', role: 'assistant' as const, content: "Three goals captured — weights distributed to reflect your priorities. You can adjust them in the **Goals** tab of the canvas.", ts: '09:46', action: 'goal_definition_turn', goals: true },
];

const MessageBubble = ({ msg, onOpenCanvas }: { msg: any; onOpenCanvas: (tab: CanvasTab) => void }) => {
    const isUser = msg.role === 'user';
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUser ? T.boneDeep : `linear-gradient(135deg, #6B1A30, #9A3050)`, border: isUser ? `1px solid ${T.neutral300}` : 'none' }}>
                {isUser ? <User size={13} style={{ color: T.neutral600 }} /> : <Bot size={13} style={{ color: T.bone }} />}
            </div>
            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={isUser ? { background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: '18px 4px 18px 18px', padding: '9px 14px', fontSize: 14, lineHeight: 1.55, color: T.ink } : { fontSize: 14, lineHeight: 1.6, color: T.ink, paddingTop: 2 }}>
                    {msg.files && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {msg.files.map((f: any, i: number) => (
                                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 11, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                    <span style={{ color: T.maroon }}>📄</span>
                                    <span style={{ fontWeight: 500 }}>{f.name}</span>
                                    <span style={{ color: T.neutral400 }}>{f.size}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{renderMd(msg.content)}</div>
                    {msg.action && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'rgba(92,20,39,0.08)', color: T.maroon, marginTop: 8 }}>
                            <CheckCircle2 size={10} /> {msg.action}
                        </div>
                    )}
                    {msg.goals && (
                        <button onClick={() => onOpenCanvas('goals')}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: T.maroon, background: 'rgba(92,20,39,0.06)', border: `1px solid rgba(92,20,39,0.15)`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Target size={12} /> Open Goals tab in canvas →
                        </button>
                    )}
                </div>
                <div style={{ fontSize: 10, color: T.neutral400, padding: '0 3px' }}>{msg.ts}</div>
            </div>
        </div>
    );
};

// ── Main demo page ─────────────────────────────────────────────────────────────

export default function DemoPage() {
    const [canvasOpen, setCanvasOpen] = useState(false);
    const [canvasMinimized, setCanvasMinimized] = useState(false);
    const [canvasTab, setCanvasTab] = useState<CanvasTab>('monitor');
    const [runStage, setRunStage] = useState('idle');
    const [goals, setGoals] = useState<MockGoal[]>(INITIAL_GOALS);
    const [activeSid, setActiveSid] = useState('s1');
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const runTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, []);

    const openCanvas = useCallback((tab: CanvasTab = 'monitor') => {
        setCanvasOpen(true);
        setCanvasMinimized(false);
        setCanvasTab(tab);
    }, []);

    const startRun = useCallback(() => {
        openCanvas('monitor');
        setRunStage('ingest');
        const stages = ['ingest','translate','init','solve','solve','solve','converge','explain','done'];
        let idx = 0;
        if (runTimer.current) clearInterval(runTimer.current);
        runTimer.current = setInterval(() => {
            idx++;
            if (idx >= stages.length) {
                setRunStage('done');
                setCanvasTab('results');
                clearInterval(runTimer.current!);
            } else {
                setRunStage(stages[idx]);
            }
        }, 700);
    }, [openCanvas]);

    useEffect(() => () => { if (runTimer.current) clearInterval(runTimer.current); }, []);

    const handleGoalAdd = (g: MockGoal) => setGoals(prev => [...prev, g]);
    const handleGoalUpdate = (id: string, patch: Partial<MockGoal>) => setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
    const handleGoalDelete = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

    const canvasVisible = canvasOpen && !canvasMinimized;
    const isDone = runStage === 'done';

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', background: T.bone, overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
            {/* Sidebar */}
            <aside style={{ width: 260, background: T.bone, borderRight: `1px solid ${T.boneDeep}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '14px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, fontFamily: 'var(--font-display)', fontSize: 22, color: T.maroonDeep }}>
                        Intellign
                    </div>
                    <button style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}>
                        <PanelLeftClose size={17} />
                    </button>
                </div>
                <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 8, fontSize: 13.5, color: T.ink, background: 'transparent', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.boneDeep)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <SquarePen size={15} style={{ color: T.neutral600, flexShrink: 0 }} /> New chat
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: T.boneDeep }}>
                        <Search size={14} style={{ color: T.neutral600, flexShrink: 0 }} />
                        <input placeholder="Search chats" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 13.5, color: T.ink, fontFamily: 'inherit' }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.ink, padding: '6px 8px', marginBottom: 2 }}>Recents</p>
                    {SESSIONS.map(s => (
                        <div key={s.id} onClick={() => setActiveSid(s.id)}
                            style={{ display: 'flex', alignItems: 'center', padding: '9px 10px', borderRadius: 8, fontSize: 13, color: T.neutral700, cursor: 'pointer', background: activeSid === s.id ? T.boneDeep : 'transparent', marginBottom: 1 }}
                            onMouseEnter={e => { if (activeSid !== s.id) (e.currentTarget as HTMLDivElement).style.background = T.boneDeep; }}
                            onMouseLeave={e => { if (activeSid !== s.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.boneDeep}`, padding: '8px 12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, cursor: 'pointer' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(92,20,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: T.maroon, flexShrink: 0 }}>A</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Adeola Adegbemijo</p>
                            <p style={{ fontSize: 11, color: T.neutral500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>adeola@databackedafrica.com</p>
                        </div>
                        <button style={{ border: 0, background: 'transparent', color: T.neutral500, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Chat area (narrows when canvas open) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'max-width 280ms cubic-bezier(0.2,0,0,1)', maxWidth: canvasVisible ? 'calc(100% - 720px)' : '100%' }}>
                {/* TopBar */}
                <header style={{ height: 54, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244,239,231,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid transparent`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: T.maroonDeep, padding: '5px 8px' }}>Intellign AI</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.neutral400 }}>
                            <ChevronDown size={13} />
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

                {/* Context bar */}
                <div style={{ padding: '8px 16px 4px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', padding: '9px 14px', background: T.boneDeep, border: `1px solid ${T.neutral200}`, borderRadius: 14, fontSize: 12 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, paddingRight: 12, borderRight: `1px solid rgba(0,0,0,0.08)` }}>Active problem</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <b style={{ color: T.ink, fontFamily: 'var(--font-sans)' }}>Nurse → Clinic Assignment</b>
                        </span>
                        <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <Database size={12} style={{ color: T.neutral500 }} />
                            <b style={{ color: T.ink }}>150</b> resources · <b style={{ color: T.ink }}>20</b> targets
                        </span>
                        <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <Target size={12} style={{ color: T.neutral500 }} />
                            <b style={{ color: T.ink }}>{goals.length}</b> goals
                        </span>
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '1px solid rgba(0,0,0,0.08)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isDone ? '#10B981' : runStage !== 'idle' ? '#F59E0B' : '#10B981', display: 'inline-block', boxShadow: isDone ? undefined : runStage !== 'idle' ? '0 0 0 3px rgba(245,158,11,0.18)' : '0 0 0 3px rgba(16,185,129,0.16)' }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: isDone ? '#047857' : runStage !== 'idle' ? '#B45309' : '#047857' }}>
                                {isDone ? 'Converged' : runStage !== 'idle' ? 'Solving…' : 'Ready to optimize'}
                            </span>
                            {runStage === 'idle' && (
                                <button onClick={startRun} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: T.maroon, color: T.bone, border: 0, borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 4 }}>
                                    <Zap size={11} /> Run
                                </button>
                            )}
                            {(isDone) && (
                                <button onClick={() => openCanvas('results')} style={{ fontSize: 11, color: T.maroon, background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'inherit', marginLeft: 4 }}>
                                    Open canvas
                                </button>
                            )}
                        </span>
                    </div>
                    {/* Readiness strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        {[
                            { label: 'Data ready', done: true, tab: 'datasets' as CanvasTab },
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

                {/* Messages */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {MOCK_MESSAGES_LIST.map(msg => <MessageBubble key={msg.id} msg={msg} onOpenCanvas={openCanvas} />)}
                </div>

                {/* Composer */}
                <div style={{ padding: '8px 16px 10px', background: 'rgba(244,239,231,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
                    <div style={{ background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: 24, padding: '4px 6px 4px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Continue the conversation…"
                            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 14, fontFamily: 'inherit', color: T.ink, height: 38 }} />
                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: input.trim() ? T.maroon : T.neutral200, border: 0, cursor: input.trim() ? 'pointer' : 'default', color: input.trim() ? T.bone : T.neutral400, flexShrink: 0 }}>
                            <Zap size={15} />
                        </button>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: 11, color: T.neutral400, marginTop: 5 }}>Intellign AI can make mistakes. Consider verifying important information.</p>
                </div>

                {/* Minimized canvas dock */}
                {canvasOpen && canvasMinimized && (
                    <button onClick={() => setCanvasMinimized(false)}
                        style={{ position: 'absolute', right: 22, bottom: 80, display: 'flex', alignItems: 'center', gap: 8, background: T.maroon, color: T.bone, border: 0, borderRadius: 999, padding: '9px 16px', boxShadow: '0 6px 18px rgba(92,20,39,0.28)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFD08A', animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
                        {isDone ? 'Optimization complete · 118 / 150 assigned' : 'Solving…'}
                        <TrendingUp size={14} />
                    </button>
                )}
            </div>

            {/* Canvas panel (slides in) */}
            <AnimatePresence>
                {canvasVisible && (
                    <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                        <Canvas
                            runStage={runStage}
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
    );
}
