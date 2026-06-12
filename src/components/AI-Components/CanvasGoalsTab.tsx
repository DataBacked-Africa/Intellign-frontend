import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, X, Loader2, ArrowRight } from 'lucide-react';
import { GoalDefinition } from '@/types/models';
import axiosInstance from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';

const LOGIC_TYPES = ['weighted_scoring', 'categorical_match', 'spatial_proximity', 'numeric_threshold', 'set_coverage', 'temporal_match'];
const LOGIC_LABELS: Record<string, string> = { 
    weighted_scoring: 'Weighted Scoring', 
    categorical_match: 'Attribute Matching', 
    spatial_proximity: 'Distance / Proximity', 
    numeric_threshold: 'Numeric Threshold', 
    set_coverage: 'Skill Coverage', 
    temporal_match: 'Schedule Matching' 
};

export interface GoalsTabProps { goals: GoalDefinition[]; sessionId: string | null; }

export const CanvasGoalsTab: React.FC<GoalsTabProps> = ({ goals, sessionId }) => {
    const [localGoals, setLocalGoals] = useState<GoalDefinition[]>(goals);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [draft, setDraft] = useState<Partial<GoalDefinition & { logic_type?: string }>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (goals?.length) setLocalGoals(goals); }, [goals]);

    useEffect(() => {
        if (!sessionId) return;
        axiosInstance.get(`/config/goals/${sessionId}`)
            .then(res => {
                const fetched = res.data?.goals ?? res.data ?? [];
                if (Array.isArray(fetched) && fetched.length) setLocalGoals(fetched);
            })
            .catch(() => {});
    }, [sessionId]);

    const total = localGoals.reduce((s, g) => s + (g.weight ?? 0), 0);

    const persistGoals = async (updated: GoalDefinition[], previous: GoalDefinition[]) => {
        if (!sessionId) return;
        setSaving(true);
        try {
            await axiosInstance.post(`/config/goals/${sessionId}`, updated);
        } catch { 
            showToast.error('Save failed', 'Rolling back changes.');
            setLocalGoals(previous);
        }
        finally { setSaving(false); }
    };

    const startEdit = (idx: number) => {
        setEditingIdx(idx);
        const g = localGoals[idx];
        setDraft({ description: g.description, weight: g.weight, award_type: g.award_type, logic_type: g.logic_config?.logic_type ?? 'categorical_match' });
        setAddingNew(false);
    };

    const startAdd = () => {
        setAddingNew(true);
        setEditingIdx(null);
        setDraft({ description: '', award_type: 'Reward', weight: 25, logic_type: 'categorical_match' });
    };

    const cancel = () => { setEditingIdx(null); setAddingNew(false); setDraft({}); };

    const saveEdit = async () => {
        if (!draft.description?.trim()) return;
        let updated: GoalDefinition[];
        if (addingNew) {
            const newGoal: GoalDefinition = { description: draft.description!, weight: draft.weight ?? 25, award_type: draft.award_type ?? 'Reward', resource_columns: [], target_columns: [], logic_config: { logic_type: draft.logic_type ?? 'categorical_match', exact_match: true } };
            updated = [...localGoals, newGoal];
        } else if (editingIdx !== null) {
            updated = localGoals.map((g, i) => i === editingIdx ? { ...g, description: draft.description!, weight: draft.weight ?? g.weight, award_type: draft.award_type ?? g.award_type, logic_config: { ...g.logic_config, logic_type: draft.logic_type ?? g.logic_config?.logic_type } } : g);
        } else return;
        const previous = [...localGoals];
        setLocalGoals(updated);
        cancel();
        await persistGoals(updated, previous);
    };

    const deleteGoal = async (idx: number) => {
        if (!window.confirm('Delete this goal?')) return;
        const previous = [...localGoals];
        const updated = localGoals.filter((_, i) => i !== idx);
        setLocalGoals(updated);
        await persistGoals(updated, previous);
    };

    const inputCls = "w-full px-3 py-2 text-sm rounded-lg outline-none";
    const inputStyle = { border: '1px solid var(--border-subtle)', background: 'var(--neutral-0)', color: 'var(--fg-primary)', fontFamily: 'inherit' };
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--fg-tertiary)', marginBottom: 4 };

    // Plain JSX (not a nested component) so the form doesn't remount and drop
    // input focus on every parent re-render.
    const draftForm = (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--neutral-50)', border: '1px solid var(--border-subtle)' }}>
            <div><label style={labelStyle}>Description</label>
                <textarea value={draft.description ?? ''} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} placeholder="e.g. Match skills to requirements" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label style={labelStyle}>Type</label>
                    <select value={draft.award_type ?? 'Reward'} onChange={e => setDraft(p => ({ ...p, award_type: e.target.value as any }))} className={inputCls} style={inputStyle}>
                        <option>Reward</option><option>Penalty</option>
                    </select>
                </div>
                <div><label style={labelStyle}>Logic</label>
                    <select value={draft.logic_type ?? 'categorical_match'} onChange={e => setDraft(p => ({ ...p, logic_type: e.target.value }))} className={inputCls} style={inputStyle}>
                        {LOGIC_TYPES.map(t => <option key={t} value={t}>{LOGIC_LABELS[t]}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <div className="flex justify-between mb-1"><label style={labelStyle}>Weight</label><span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--brand-maroon)' }}>{draft.weight ?? 25}%</span></div>
                <input type="range" min={0} max={100} step={5} value={draft.weight ?? 25} onChange={e => setDraft(p => ({ ...p, weight: Number(e.target.value) }))} className="w-full" style={{ accentColor: 'var(--brand-maroon)' }} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
                <button onClick={cancel} className="px-3 py-1.5 text-xs" style={{ border: 0, background: 'transparent', color: 'var(--fg-tertiary)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
                    style={{ background: 'var(--brand-maroon)', border: 0, cursor: 'pointer' }}>
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--neutral-50)', border: '1px solid var(--border-subtle)' }}>
                <span className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
                    {localGoals.length} goal{localGoals.length !== 1 ? 's' : ''} · weights total{' '}
                    <b style={{ fontFamily: 'var(--font-mono)', color: total === 100 ? 'light-dark(#047857, #34D399)' : 'light-dark(#B45309, #FBBF24)' }}>{total}%</b>
                </span>
                <button onClick={startAdd} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                    style={{ background: 'var(--brand-maroon)', border: 0, cursor: 'pointer' }}>
                    <Plus size={12} /> Add goal
                </button>
            </div>

            {addingNew && draftForm}

            {localGoals.map((g, idx) => {
                const isEditing = editingIdx === idx;
                return (
                    <div key={idx} className="rounded-xl overflow-hidden" style={{ background: 'var(--neutral-0)', border: `1px solid ${isEditing ? 'var(--brand-maroon)' : 'var(--border-subtle)'}`, transition: 'border-color 140ms' }}>
                        <div className="flex items-center gap-3 p-4">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
                                style={{ background: g.award_type === 'Reward' ? 'light-dark(#D1FAE5, #16302E)' : 'light-dark(#FEE2E2, #3C1A21)', color: g.award_type === 'Reward' ? 'light-dark(#047857, #34D399)' : 'light-dark(#B91C1C, #F87171)' }}>
                                {g.award_type}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg-primary)' }}>{g.description || 'Untitled goal'}</div>
                                <div className="text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>{LOGIC_LABELS[g.logic_config?.logic_type ?? ''] ?? g.logic_config?.logic_type ?? '—'}</div>
                                {((g.resource_columns?.length ?? 0) > 0 || (g.target_columns?.length ?? 0) > 0) && (
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--neutral-100, #F3F4F6)', color: 'var(--fg-secondary)' }}>
                                            {(g.resource_columns ?? []).join(', ') || '—'}
                                        </span>
                                        <ArrowRight size={11} style={{ color: 'var(--fg-tertiary)' }} />
                                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--neutral-100, #F3F4F6)', color: 'var(--fg-secondary)' }}>
                                            {(g.target_columns ?? []).join(', ') || '—'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: 'var(--fg-primary)' }}>{g.weight}%</span>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => isEditing ? cancel() : startEdit(idx)} className="p-1.5 rounded" style={{ border: 0, background: 'transparent', color: 'var(--fg-tertiary)', cursor: 'pointer' }} title={isEditing ? 'Cancel' : 'Edit'}>
                                    {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                                </button>
                                <button onClick={() => deleteGoal(idx)} className="p-1.5 rounded" style={{ border: 0, background: 'transparent', color: 'var(--fg-tertiary)', cursor: 'pointer' }} title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        {!isEditing && (
                            <div className="h-0.5" style={{ background: 'var(--border-subtle)' }}>
                                <div className="h-full" style={{ width: `${g.weight ?? 0}%`, background: 'linear-gradient(90deg, var(--brand-maroon), var(--brand-maroon-rich))' }} />
                            </div>
                        )}
                        {isEditing && draftForm}
                    </div>
                );
            })}

            {localGoals.length === 0 && !addingNew && (
                <div className="py-10 text-center">
                    <p className="text-lg mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-maroon-deep)' }}>No goals yet.</p>
                    <p className="text-sm mb-4" style={{ color: 'var(--fg-tertiary)' }}>Describe what you want to optimise and goals compile automatically.</p>
                    <button onClick={startAdd}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
                        style={{ background: 'var(--brand-maroon)' }}>
                        + Add a goal manually
                    </button>
                </div>
            )}
        </div>
    );
};
