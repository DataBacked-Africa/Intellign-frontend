'use client';

/**
 * NYSC deployment replay: same chat + sliding-canvas shell as /demo/helium-health,
 * driven by a recorded run instead of a live solve. Inline styles only so the same
 * component also bundles into the single-file offline export.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Bot, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Database, Minimize2,
  Pause, Play, RotateCcw, Settings, Target, TrendingUp, User, X, Zap,
} from 'lucide-react';
import { T, FONT_MONO, FONT_DISPLAY, FONT_SANS } from './tokens';
import type { Bar, NyscBundle, SampleAssignment, Stage, Step, TabId } from './data/types';

const STAGES: Stage[] = ['idle', 'ingest', 'translate', 'init', 'solve', 'converge', 'explain', 'done'];
const stageIdx = (s: Stage) => STAGES.indexOf(s);
const fmt = (n: number) => n.toLocaleString('en-US');
const TAB_LABEL: Record<TabId, string> = { monitor: 'Monitor', results: 'Results', assignments: 'Assignments', goals: 'Goals', config: 'Config', datasets: 'Datasets' };
const mono = (extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, ...extra });
const iconBtn: React.CSSProperties = { width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' };

function useNarrow(limit = 1000) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < limit);
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [limit]);
  return narrow;
}

// ── Markdown-lite (bold, code, bullets, tables), same behaviour as the Helium chat ──
const renderMd = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    const isHead = t.startsWith('|') && t.endsWith('|') && i + 1 < lines.length && /^\|[\s|:-]+\|/.test(lines[i + 1].trim());
    if (isHead) {
      const tl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) { tl.push(lines[i]); i++; }
      const parse = (l: string) => l.split('|').slice(1, -1).map((c) => c.trim());
      const headers = parse(tl[0]);
      const body = tl.slice(2).map(parse);
      out.push(
        <div key={`t${i}`} style={{ overflowX: 'auto', margin: '6px 0', borderRadius: 8, border: `1px solid ${T.neutral200}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>{headers.map((h, k) => <th key={k} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: T.neutral600, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
            <tbody>{body.map((r, ri) => <tr key={ri} style={{ borderTop: `1px solid ${T.neutral100}` }}>{r.map((c, ci) => <td key={ci} style={{ padding: '6px 10px', color: T.neutral700 }}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    const bullet = /^[-*]\s+/.test(line);
    const content = bullet ? line.replace(/^[-*]\s+/, '') : line;
    const inline: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|`(.+?)`/g;
    let last = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      if (m.index > last) inline.push(content.slice(last, m.index));
      if (m[1]) inline.push(<strong key={m.index} style={{ color: T.ink, fontWeight: 700 }}>{m[1]}</strong>);
      else if (m[2]) inline.push(<code key={m.index} style={{ padding: '1px 5px', background: 'rgba(0,0,0,0.06)', borderRadius: 3, fontSize: 11, fontFamily: FONT_MONO }}>{m[2]}</code>);
      last = m.index + m[0].length;
    }
    if (last < content.length) inline.push(content.slice(last));
    out.push(
      <React.Fragment key={i}>
        {bullet
          ? <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', margin: '3px 0' }}><span style={{ marginTop: 9, width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.4, flexShrink: 0 }} /><span>{inline.length ? inline : content}</span></div>
          : <span>{inline.length ? inline : content}</span>}
        {i < lines.length - 1 && !bullet && <br />}
      </React.Fragment>,
    );
    i++;
  }
  return out;
};

// ── Dark chart card, same look as the Helium fitness chart ──
const DarkBars = ({ title, items, source, empty }: { title: string; items: Bar[]; source?: string; empty?: string }) => {
  const max = Math.max(...items.map((i) => i.value ?? 0), 1);
  return (
    <div style={{ background: T.ink, borderRadius: 10, padding: '16px 18px 14px' }}>
      <div style={{ color: T.bone, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {empty ? (
        <div style={{ color: T.neutral400, fontSize: 12.5, textAlign: 'center', padding: '10px 0' }}>{empty}</div>
      ) : items.map((it) => (
        <div key={it.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#B8B5AD', marginBottom: 4, gap: 12 }}>
            <span>{it.label}</span>
            <span style={{ fontFamily: FONT_MONO, color: it.value === null ? '#F59E0B' : T.bone }}>{it.value === null ? it.note ?? 'not recorded' : fmt(it.value)}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', border: it.value === null ? '1px dashed rgba(255,255,255,0.25)' : 'none' }}>
            {it.value !== null && <div style={{ width: `${(it.value / max) * 100}%`, height: '100%', borderRadius: 4, background: '#D49AAA', transition: 'width 600ms ease' }} />}
          </div>
        </div>
      ))}
      {source && !empty && <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#8E8B84', lineHeight: 1.5, marginTop: 4 }}>{source}</div>}
    </div>
  );
};

const Placeholder = ({ title, body }: { title: string; body: string }) => (
  <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
    <p style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: T.maroonDeep, margin: 0 }}>{title}</p>
    <p style={{ fontSize: 13, marginTop: 6 }}>{body}</p>
  </div>
);

const MatchBadge = ({ match }: { match: boolean }) => (
  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: match ? '#D1FAE5' : '#FEF3C7', color: match ? '#047857' : '#B45309' }}>{match ? 'Matched' : 'Mismatch'}</span>
);

// ── Canvas tabs ──
const MonitorTab = ({ step, bundle }: { step: Step; bundle: NyscBundle }) => {
  const idx = stageIdx(step.stage);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {step.stats.map((s) => (
          <div key={s.lbl} style={{ background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={mono({ marginBottom: 6 })}>{s.lbl}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, lineHeight: 1, color: s.val === '0' || s.val === '—' || s.val.startsWith('0 of') ? T.neutral400 : T.ink, letterSpacing: '-0.02em' }}>{s.val}</div>
          </div>
        ))}
      </div>
      <DarkBars title="Best fitness reached in each batch" items={bundle.batches} source={bundle.batchSource} empty={idx >= 4 ? undefined : 'Play the replay to see the batch results.'} />
      {idx >= 5 && <DarkBars title="Fitness through the clean-up passes" items={bundle.cleanup} source={bundle.cleanupSource} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bundle.timeline.map((t, i) => {
          const done = i + 1 < idx; const active = i + 1 === idx;
          return (
            <div key={t.stage} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.neutral400, flexShrink: 0, paddingTop: 1, width: 16, textAlign: 'center' }}>{done ? '✓' : active ? '…' : '·'}</div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${active ? '#F59E0B' : T.maroon}`, background: done ? T.maroon : active ? '#F59E0B' : T.boneDeep, marginTop: 3, flexShrink: 0 }} />
              <div style={{ flex: 1, color: T.ink }}>{t.label}<span style={{ display: 'block', color: T.neutral500, fontSize: 11.5, marginTop: 1 }}>{t.sub}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ResultsTab = ({ bundle }: { bundle: NyscBundle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {bundle.results.map((c) => (
        <div key={c.lbl} style={{ background: '#fff', border: `1px solid ${c.hi ? 'rgba(92,20,39,0.22)' : T.neutral200}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={mono({ letterSpacing: '0.12em', marginBottom: 4 })}>{c.lbl}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: c.hi ? T.maroon : T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{c.val}</span>
            {c.sub && <span style={{ fontSize: 12, color: T.neutral500 }}>{c.sub}</span>}
          </div>
        </div>
      ))}
    </div>
    <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, overflow: 'hidden' }}>
      <h3 style={{ margin: 0, padding: '14px 16px 4px', fontSize: 13, fontWeight: 600, color: T.ink }}>Version 3 beside version 4</h3>
      <p style={{ margin: 0, padding: '0 16px 10px', fontSize: 11.5, color: T.neutral500 }}>Skill match is equal. The recorded gain is structural.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ background: T.neutral50, borderTop: `1px solid ${T.neutral200}`, borderBottom: `1px solid ${T.neutral200}` }}>
          {['Measure', ...bundle.compare.head].map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 12px', ...mono({ letterSpacing: '0.12em', fontWeight: 500 }) }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {bundle.compare.rows.map((r) => (
            <tr key={r.label} style={{ borderTop: `1px solid ${T.neutral200}` }}>
              <td style={{ padding: '8px 12px', fontWeight: 600, color: T.neutral700 }}>{r.label}</td>
              <td style={{ padding: '8px 12px', color: T.neutral600 }}>{r.a}</td>
              <td style={{ padding: '8px 12px', color: T.neutral600 }}>{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '8px 12px', fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral400, borderTop: `1px solid ${T.neutral100}` }}>Source: invention disclosure, section 12.2</div>
    </div>
    <div style={{ background: '#fff', border: `1px dashed ${T.neutral300}`, borderRadius: 10, padding: 16 }}>
      <div style={mono({ marginBottom: 8 })}>Limits we state openly</div>
      {bundle.limits.map((l) => <p key={l} style={{ margin: '0 0 6px', fontSize: 12.5, lineHeight: 1.5, color: T.neutral600 }}>{l}</p>)}
    </div>
  </div>
);

const AssignmentsTab = ({ rows, label }: { rows: SampleAssignment[]; label: string }) => {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: T.amber, fontWeight: 600 }}>{label}</p>
      <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
            <th style={{ width: 28, padding: '8px 10px' }} />
            {['Graduate', 'Facility', 'Match'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 12px', ...mono({ letterSpacing: '0.12em', fontWeight: 500 }) }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((a) => {
              const isOpen = open === a.assignmentId;
              return (
                <React.Fragment key={a.assignmentId}>
                  <tr style={{ borderTop: `1px solid ${T.neutral200}`, background: isOpen ? T.neutral50 : undefined }}>
                    <td style={{ padding: '8px 10px' }}>
                      <button aria-label="Why this pairing" onClick={() => setOpen(isOpen ? null : a.assignmentId)} style={{ ...iconBtn, width: 22, height: 22, color: T.neutral400 }}>
                        <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 140ms' }} />
                      </button>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.neutral700 }}>{a.specialization}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral400, marginTop: 1 }}>#{a.graduateId}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 12.5, color: T.neutral600 }}>{a.facilityName}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral400, marginTop: 1 }}>{a.state} · {a.centreSpecialization}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}><MatchBadge match={a.skillMatch} /></td>
                  </tr>
                  {isOpen && (
                    <tr><td colSpan={4} style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}`, padding: '10px 14px 14px' }}>
                      <p style={mono({ margin: '0 0 6px' })}>Why this pairing</p>
                      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: T.neutral700, margin: 0 }}>{a.rationale}</p>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GoalsTab = ({ bundle }: { bundle: NyscBundle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ padding: '10px 12px', background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 13, color: T.neutral600 }}>{bundle.goals.length} goals defined in plain language</div>
    {bundle.goals.map((g) => (
      <div key={g.id} style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', background: g.award_type === 'Reward' ? '#D1FAE5' : '#FEE2E2', color: g.award_type === 'Reward' ? '#047857' : '#B91C1C' }}>{g.award_type}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, lineHeight: 1.4 }}>{g.description}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.neutral500, marginTop: 2 }}>{g.logic}</div>
        </div>
      </div>
    ))}
  </div>
);

const ConfigTab = ({ bundle }: { bundle: NyscBundle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div>
      <div style={mono({ marginBottom: 10, display: 'flex', justifyContent: 'space-between' })}><span>Solver</span><span style={{ color: T.maroon }}>Auto-selected by Intellign</span></div>
      <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(92,20,39,0.05)', border: `1px solid ${T.maroon}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.maroonDeep }}>{bundle.meta.solver}</div>
        <div style={{ fontSize: 11.5, color: T.neutral500, marginTop: 2, lineHeight: 1.4 }}>Routed automatically based on problem type (assignment) and data scale. No manual solver selection needed.</div>
      </div>
    </div>
    <div style={{ borderTop: `1px dashed ${T.neutral200}`, paddingTop: 16 }}>
      <div style={mono({ marginBottom: 10 })}>How the engine works</div>
      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.65, color: T.neutral700 }}>
        {bundle.mechanism.map((m) => <li key={m} style={{ marginBottom: 4 }}>{m}</li>)}
      </ol>
    </div>
    <div style={{ borderTop: `1px dashed ${T.neutral200}`, paddingTop: 16 }}>
      <div style={mono({ marginBottom: 10 })}>Run structure</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
        {bundle.runStructure.map((r) => <div key={r.lbl} style={{ color: T.neutral600 }}>{r.lbl} <b style={{ color: T.ink, float: 'right' }}>{r.val}</b></div>)}
      </div>
    </div>
  </div>
);

const DatasetsTab = ({ bundle }: { bundle: NyscBundle }) => {
  const [active, setActive] = useState<'resources' | 'targets'>('resources');
  const res = bundle.sample.map((a) => ({ id: a.graduateId, specialization: a.specialization, state_of_posting: a.state }));
  const seen = new Set<string>();
  const tgt = bundle.sample.filter((a) => (seen.has(a.facilityName) ? false : (seen.add(a.facilityName), true)))
    .map((a) => ({ facility: a.facilityName, state: a.state, type: a.centreSpecialization, diseases: a.diseases }));
  const rows: Record<string, string>[] = active === 'resources' ? res : tgt;
  const cols = Object.keys(rows[0] ?? {}).map((k) => k.replace(/_/g, ' '));
  return (
    <div>
      <div style={{ display: 'inline-flex', padding: 3, background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 999, gap: 2, marginBottom: 12 }}>
        {(['resources', 'targets'] as const).map((t) => (
          <button key={t} onClick={() => setActive(t)} style={{ padding: '4px 12px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: active === t ? T.maroon : 'transparent', color: active === t ? T.bone : T.neutral600 }}>
            {t === 'resources' ? `${bundle.meta.resourceLabel} · ${bundle.meta.resourceCount}` : `${bundle.meta.targetLabel} · ${bundle.meta.targetCount}`}
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0 }}><tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
            {cols.map((c) => <th key={c} style={{ textAlign: 'left', padding: '8px 12px', ...mono({ letterSpacing: '0.12em', fontWeight: 500 }) }}>{c}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.neutral200}` }}>
                {Object.values(r).map((v, j) => <td key={j} style={{ padding: '8px 12px', fontFamily: j === 0 ? FONT_MONO : undefined, fontSize: j === 0 ? 11 : 12, color: j === 0 ? T.ink : T.neutral600 }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontSize: 11, color: T.neutral400, fontFamily: FONT_MONO, borderTop: `1px solid ${T.neutral100}` }}>
          Showing {rows.length} of {active === 'resources' ? bundle.meta.resourceCount : bundle.meta.targetCount} · illustrative sample
        </div>
      </div>
    </div>
  );
};

// ── Canvas panel ──
const Canvas = ({ bundle, step, tab, onTab, onClose, overlay }: { bundle: NyscBundle; step: Step; tab: TabId; onTab: (t: TabId) => void; onClose: () => void; overlay: boolean }) => {
  const idx = stageIdx(step.stage);
  const done = idx >= 6;
  const tabs: { id: TabId; badge?: number }[] = [
    { id: 'monitor' }, { id: 'results' }, { id: 'assignments', badge: bundle.sample.length }, { id: 'goals', badge: bundle.goals.length }, { id: 'config' }, { id: 'datasets' },
  ];
  return (
    <aside style={{ width: overlay ? '100%' : 'min(720px, 100%)', flexShrink: 1, minWidth: 0, background: '#fff', borderLeft: `1px solid ${T.neutral200}`, display: 'flex', flexDirection: 'column', animation: 'nyscSlide 280ms cubic-bezier(0.2,0,0,1)', ...(overlay ? { position: 'absolute', inset: 0, zIndex: 20 } : {}) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.neutral200}`, background: T.neutral50, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: done ? '#10B981' : idx > 0 ? '#F59E0B' : T.maroon, boxShadow: idx > 0 && !done ? '0 0 0 4px rgba(245,158,11,0.18)' : undefined }} />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 400, color: T.maroonDeep, letterSpacing: '-0.015em', margin: 0 }}>{bundle.meta.title}</h2>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(92,20,39,0.08)', color: T.maroon, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Replay</span>
        </div>
        <button onClick={onClose} style={iconBtn} title="Close" aria-label="Close canvas">{overlay ? <X size={15} /> : <Minimize2 size={15} />}</button>
      </div>
      <div style={{ display: 'flex', padding: '0 18px', borderBottom: `1px solid ${T.neutral200}`, background: '#fff', flexShrink: 0, overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTab(t.id)} style={{ position: 'relative', padding: '11px 14px', border: 0, background: 'transparent', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: tab === t.id ? T.maroon : T.neutral500, borderBottom: `2px solid ${tab === t.id ? T.maroon : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap' }}>
            {TAB_LABEL[t.id]}
            {t.badge !== undefined && <span style={{ display: 'inline-flex', background: 'rgba(92,20,39,0.1)', color: T.maroonDeep, fontSize: 10, fontWeight: 600, fontFamily: FONT_MONO, padding: '1px 6px', borderRadius: 999, marginLeft: 5 }}>{t.badge}</span>}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
        {tab === 'monitor' && <MonitorTab step={step} bundle={bundle} />}
        {tab === 'results' && (idx >= 6 ? <ResultsTab bundle={bundle} /> : <Placeholder title="Results appear once the engine converges." body="Play the replay or jump to the Result verified step." />)}
        {tab === 'assignments' && (idx >= 7 ? <AssignmentsTab rows={bundle.sample} label={bundle.meta.sampleLabel} /> : <Placeholder title="No assignments yet." body="Once the run ends, every graduate to facility pairing lands here with its reason." />)}
        {tab === 'goals' && <GoalsTab bundle={bundle} />}
        {tab === 'config' && <ConfigTab bundle={bundle} />}
        {tab === 'datasets' && <DatasetsTab bundle={bundle} />}
      </div>
    </aside>
  );
};

// ── Chat ──
const Bubble = ({ role, text, step, onOpen, showActions }: { role: 'user' | 'assistant'; text: string; step: Step; onOpen: (t: TabId) => void; showActions: boolean }) => {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUser ? T.boneDeep : 'linear-gradient(135deg, #6B1A30, #9A3050)', border: isUser ? `1px solid ${T.neutral300}` : 'none' }}>
        {isUser ? <User size={13} style={{ color: T.neutral600 }} /> : <Bot size={13} style={{ color: T.bone }} />}
      </div>
      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={isUser ? { background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: '18px 4px 18px 18px', padding: '9px 14px', fontSize: 14, lineHeight: 1.55, color: T.ink } : { fontSize: 14, lineHeight: 1.6, color: T.ink, paddingTop: 2 }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{renderMd(text)}</div>
          {showActions && step.action && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'rgba(92,20,39,0.08)', color: T.maroon, marginTop: 8 }}><CheckCircle2 size={10} /> {step.action}</div>
          )}
          {showActions && step.chips && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {step.chips.map((c) => <span key={c} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(92,20,39,0.2)', background: 'rgba(92,20,39,0.05)', color: T.maroonDeep, fontWeight: 500 }}>{c}</span>)}
            </div>
          )}
          {showActions && (
            <button onClick={() => onOpen(step.tab)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: T.maroon, background: 'rgba(92,20,39,0.06)', border: '1px solid rgba(92,20,39,0.15)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Target size={12} /> Open {TAB_LABEL[step.tab]} tab in canvas →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main ──
export function NyscReplay({ bundle, backHref }: { bundle: NyscBundle; backHref?: string }) {
  const { steps, meta } = bundle;
  const last = steps.length - 1;
  const narrow = useNarrow();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [canvasOpen, setCanvasOpen] = useState(true);
  const [tab, setTab] = useState<TabId>(steps[0].tab);
  const scrollRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const idx = stageIdx(step.stage);

  // Deep link (#step=N) shows that step without autoplay; otherwise autoplay unless the viewer prefers reduced motion.
  useEffect(() => {
    const m = /step=(\d+)/.exec(window.location.hash);
    if (m) { setIndex(Math.min(last, Math.max(0, Number(m[1]) - 1))); return; }
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [last]);

  useEffect(() => { if (narrow) setCanvasOpen(false); }, [narrow]);
  useEffect(() => { setTab(steps[index].tab); }, [index, steps]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [index]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setIndex((i) => i + 1), step.durationMs / speed);
    return () => clearTimeout(t);
  }, [playing, index, speed, step.durationMs, last]);

  const jump = (i: number) => { setPlaying(false); setIndex(i); };
  const openCanvas = (t: TabId) => { setTab(t); setCanvasOpen(true); };
  const status = idx >= 6 ? { txt: 'Converged', c: '#047857', dot: '#10B981' } : idx > 0 ? { txt: 'Replaying the solve…', c: '#B45309', dot: '#F59E0B' } : { txt: 'Ready to replay', c: '#047857', dot: '#10B981' };
  const overlay = narrow;
  const canvasVisible = canvasOpen;

  const btn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 13, color: T.neutral600, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div data-theme="light" style={{ display: 'contents' }}>
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden', fontFamily: FONT_SANS, color: T.ink }}>
      <style>{'@keyframes nyscSlide{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '7px 16px', background: T.maroonDeep, color: T.bone, fontSize: 12.5, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Intellign × NYSC · {meta.replayLabel}</span>
        <span>{meta.confidentialBanner}</span>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', background: T.bone, overflow: 'hidden' }}>
        {!narrow && (
          <aside style={{ width: 260, background: T.bone, borderRight: `1px solid ${T.boneDeep}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '14px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ paddingLeft: 8, fontFamily: FONT_DISPLAY, fontSize: 22, color: T.maroonDeep }}>Intellign</div>
              {backHref && <a href={backHref} title="Back to overview" style={{ ...iconBtn, textDecoration: 'none' }}><ArrowLeft size={17} /></a>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.ink, padding: '6px 8px', marginBottom: 2 }}>Recorded run, step by step</p>
              {steps.map((s, i) => {
                const on = i === index;
                return (
                  <div key={s.id} role="button" tabIndex={0} onClick={() => jump(i)} onKeyDown={(e) => { if (e.key === 'Enter') jump(i); }}
                    style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: on ? T.boneDeep : 'transparent', marginBottom: 1, opacity: i > index ? 0.6 : 1 }}>
                    <div style={{ fontSize: 13, color: T.ink, fontWeight: on ? 600 : 400 }}>{i + 1}. {s.title}</div>
                    <div style={{ fontSize: 10.5, color: T.neutral500, marginTop: 1, fontFamily: FONT_MONO }}>{s.stage}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '8px 12px 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 8, background: 'rgba(92,20,39,0.06)', border: '1px solid rgba(92,20,39,0.15)' }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.maroon, fontWeight: 700 }}>Evidence</span>
                <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>Invention disclosure, section 12.2</span>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${T.boneDeep}`, padding: '8px 12px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(92,20,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: T.maroon, flexShrink: 0 }}>N</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: T.ink, margin: 0 }}>NYSC deployment</p>
                  <p style={{ fontSize: 11, color: T.neutral500, margin: 0 }}>Supporting document</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'max-width 280ms cubic-bezier(0.2,0,0,1)', maxWidth: canvasVisible && !overlay ? 'calc(100% - 720px)' : '100%' }}>
          <header style={{ minHeight: 54, padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, background: 'rgba(244,239,231,0.85)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: T.maroonDeep, padding: '5px 8px' }}>Intellign AI</span>
              <ChevronDown size={13} style={{ color: T.neutral400 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button style={btn} onClick={() => jump(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous step"><ChevronLeft size={14} /></button>
              <button style={{ ...btn, background: T.maroon, color: T.bone, border: 0, fontWeight: 600, padding: '6px 14px' }} onClick={() => { if (index >= last) setIndex(0); setPlaying((p) => !p); }}>
                {playing ? <><Pause size={13} fill={T.bone} /> Pause</> : <><Play size={13} fill={T.bone} /> {index >= last ? 'Replay' : 'Play'}</>}
              </button>
              <button style={btn} onClick={() => jump(Math.min(last, index + 1))} disabled={index === last} aria-label="Next step"><ChevronRight size={14} /></button>
              <button style={btn} onClick={() => jump(0)} aria-label="Restart"><RotateCcw size={13} /></button>
              <select aria-label="Speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ ...btn, padding: '6px 8px' }}><option value={1}>1x</option><option value={2}>2x</option></select>
              {!canvasOpen && <button style={btn} onClick={() => setCanvasOpen(true)}><Settings size={13} /> Canvas</button>}
            </div>
          </header>

          <div style={{ padding: '8px 16px 4px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', padding: '9px 14px', background: T.boneDeep, border: `1px solid ${T.neutral200}`, borderRadius: 14, fontSize: 12 }}>
              <span style={mono({ color: T.maroon, paddingRight: 12, borderRight: '1px solid rgba(0,0,0,0.08)' })}>Active problem</span>
              <b style={{ color: T.ink }}>{meta.title}</b>
              <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}><Database size={12} style={{ color: T.neutral500 }} /><b style={{ color: T.ink }}>{meta.resourceCount}</b> {meta.resourceLabel} · <b style={{ color: T.ink }}>{meta.targetCount}</b> {meta.targetLabel}</span>
              <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}><Target size={12} style={{ color: T.neutral500 }} /><b style={{ color: T.ink }}>{bundle.goals.length}</b> goals</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '1px solid rgba(0,0,0,0.08)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.dot, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: status.c }}>{status.txt}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500 }}>step {index + 1}/{steps.length}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {[{ label: 'Data ready', done: idx >= 1, tab: 'datasets' as TabId }, { label: 'Goals compiled', done: idx >= 2, tab: 'goals' as TabId }, { label: 'Converged', done: idx >= 6, tab: 'results' as TabId }].map((c, k, arr) => (
                <React.Fragment key={c.label}>
                  <button onClick={() => openCanvas(c.tab)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, border: `1px solid ${c.done ? 'rgba(92,20,39,0.2)' : T.neutral200}`, background: c.done ? 'rgba(92,20,39,0.07)' : T.boneDeep, color: c.done ? T.maroon : T.neutral400, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em' }}>
                    {c.done ? <CheckCircle2 size={11} /> : <span style={{ opacity: 0.5 }}>○</span>}{c.label}
                  </button>
                  {k < arr.length - 1 && <ChevronRight size={11} style={{ color: T.neutral300 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {steps.slice(0, index + 1).map((s, i) => (
              <React.Fragment key={s.id}>
                {s.user && <Bubble role="user" text={s.user} step={s} onOpen={openCanvas} showActions={false} />}
                <Bubble role="assistant" text={s.assistant} step={s} onOpen={openCanvas} showActions={i === index} />
              </React.Fragment>
            ))}
          </div>

          <div style={{ padding: '8px 16px 10px', background: 'rgba(244,239,231,0.85)', flexShrink: 0 }}>
            <div style={{ background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: 24, padding: '4px 6px 4px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input disabled placeholder="Replay mode: use the controls above" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 14, fontFamily: 'inherit', color: T.ink, height: 38 }} />
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: T.neutral200, color: T.neutral400, flexShrink: 0 }}><Zap size={15} /></span>
            </div>
          </div>

          {!canvasOpen && idx >= 6 && (
            <button onClick={() => openCanvas('results')} style={{ position: 'absolute', right: 22, bottom: 80, display: 'flex', alignItems: 'center', gap: 8, background: T.maroon, color: T.bone, border: 0, borderRadius: 999, padding: '9px 16px', boxShadow: '0 6px 18px rgba(92,20,39,0.28)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              Optimization complete · 409 of 500 skill-matched <TrendingUp size={14} />
            </button>
          )}
        </div>

        {canvasVisible && <Canvas bundle={bundle} step={step} tab={tab} onTab={setTab} onClose={() => setCanvasOpen(false)} overlay={overlay} />}
      </div>
    </div>
    </div>
  );
}
