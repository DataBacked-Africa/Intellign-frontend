"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, ChevronDown, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalDefinition } from '@/types/models';

// ─── Logic type display helpers ───────────────────────────────────────────────

const LOGIC_LABELS: Record<string, string> = {
    numeric_threshold: 'Numeric Threshold',
    categorical_match: 'Attribute Matching',
    weighted_scoring: 'Weighted Scoring',
    spatial_proximity: 'Distance / Proximity',
    set_coverage: 'Skill Coverage',
    temporal_match: 'Schedule Matching',
};

const LogicConfigRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 shrink-0">{label}</span>
        <span className="text-xs font-medium text-gray-900 text-right break-all">{value}</span>
    </div>
);

// ─── Main panel ───────────────────────────────────────────────────────────────

interface GoalDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    goal: GoalDefinition | null;
    goalIndex: number;
    onUpdate?: (index: number, patch: Partial<Pick<GoalDefinition, 'description' | 'weight' | 'award_type'>>) => void;
}

const GoalDetailPanel: React.FC<GoalDetailPanelProps> = ({
    isOpen, onClose, goal, goalIndex, onUpdate,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [description, setDescription] = useState('');
    const [weight, setWeight] = useState(50);
    const [awardType, setAwardType] = useState<'Reward' | 'Penalty'>('Reward');
    const [configOpen, setConfigOpen] = useState(false);

    // Reset local edit state when goal changes
    React.useEffect(() => {
        if (goal) {
            setDescription(goal.description ?? '');
            setWeight(goal.weight ?? 50);
            setAwardType(goal.award_type ?? 'Reward');
            setEditMode(false);
            setConfigOpen(false);
        }
    }, [goal?.description, goal?.weight, goal?.award_type]);

    const handleSave = () => {
        if (!goal || !onUpdate) return;
        onUpdate(goalIndex, { description, weight, award_type: awardType });
        setEditMode(false);
    };

    if (!goal) return null;

    const lc = goal.logic_config ?? {};
    const logicLabel = LOGIC_LABELS[lc.logic_type ?? ''] ?? lc.logic_type ?? '—';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, x: 64 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 64 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[var(--brand-maroon)]/10 flex items-center justify-center">
                                    <Target className="w-4 h-4 text-[var(--brand-maroon)]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900">Goal {goalIndex + 1}</h2>
                                    <p className="text-[10px] text-gray-400 font-mono">{logicLabel}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {onUpdate && !editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="px-3 py-1.5 text-xs font-medium text-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)]/10 rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* Description */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Description</label>
                                {editMode ? (
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--brand-maroon)]/40 focus:ring-2 focus:ring-[var(--brand-maroon)]/10 resize-none transition-all"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 leading-relaxed">{goal.description || '—'}</p>
                                )}
                            </div>

                            {/* Award type + weight */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Type</label>
                                    {editMode ? (
                                        <select
                                            value={awardType}
                                            onChange={e => setAwardType(e.target.value as 'Reward' | 'Penalty')}
                                            className="w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none"
                                        >
                                            <option value="Reward">Reward</option>
                                            <option value="Penalty">Penalty</option>
                                        </select>
                                    ) : (
                                        <span className={cn(
                                            'inline-flex px-2.5 py-1 rounded-full text-xs font-bold',
                                            goal.award_type === 'Reward' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        )}>
                                            {goal.award_type}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weight</label>
                                        <span className="text-xs font-bold text-[var(--brand-maroon)]">{editMode ? weight : goal.weight}%</span>
                                    </div>
                                    {editMode ? (
                                        <input
                                            type="range" min={0} max={100} step={5}
                                            value={weight}
                                            onChange={e => setWeight(Number(e.target.value))}
                                            className="w-full h-1.5 accent-[var(--brand-maroon)]"
                                        />
                                    ) : (
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--brand-maroon)] rounded-full"
                                                style={{ width: `${goal.weight ?? 0}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Columns */}
                            {((goal.resource_columns?.length ?? 0) > 0 || (goal.target_columns?.length ?? 0) > 0) && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Data Columns</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(goal.resource_columns?.length ?? 0) > 0 && (
                                            <div>
                                                <p className="text-[10px] text-gray-400 mb-1">Resources</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {goal.resource_columns?.map(c => (
                                                        <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-mono">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(goal.target_columns?.length ?? 0) > 0 && (
                                            <div>
                                                <p className="text-[10px] text-gray-400 mb-1">Targets</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {goal.target_columns?.map(c => (
                                                        <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-mono">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Logic config (collapsible) */}
                            {Object.keys(lc).length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setConfigOpen(o => !o)}
                                        className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-full text-left mb-2"
                                    >
                                        Logic Config
                                        <ChevronDown className={cn('w-3 h-3 transition-transform', configOpen && 'rotate-180')} />
                                    </button>
                                    <AnimatePresence>
                                        {configOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-gray-50 rounded-xl p-3 space-y-0">
                                                    <LogicConfigRow label="Logic type" value={logicLabel} />
                                                    {lc.aggregation_method && <LogicConfigRow label="Aggregation" value={lc.aggregation_method} />}
                                                    {lc.numeric_operator && <LogicConfigRow label="Operator" value={lc.numeric_operator} />}
                                                    {lc.threshold_value != null && <LogicConfigRow label="Threshold" value={String(lc.threshold_value)} />}
                                                    {lc.comparison_column && <LogicConfigRow label="Compare column" value={<span className="font-mono">{lc.comparison_column}</span>} />}
                                                    {lc.exact_match != null && <LogicConfigRow label="Exact match" value={lc.exact_match ? 'Yes' : 'No'} />}
                                                    {lc.max_distance_value != null && (
                                                        <LogicConfigRow label="Max distance" value={`${lc.max_distance_value} ${lc.distance_unit ?? 'km'}`} />
                                                    )}
                                                    {lc.min_intersection_size != null && (
                                                        <LogicConfigRow label="Min intersection" value={String(lc.min_intersection_size)} />
                                                    )}
                                                    {lc.mapping_rules && Object.keys(lc.mapping_rules).length > 0 && (
                                                        <LogicConfigRow label="Mapping rules" value={`${Object.keys(lc.mapping_rules).length} rules`} />
                                                    )}
                                                    {lc.scoring_rules && Object.keys(lc.scoring_rules).length > 0 && (
                                                        <LogicConfigRow label="Scoring rules" value={`${Object.keys(lc.scoring_rules).length} rules`} />
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Explanation (if present) */}
                            {(goal as any).explanation && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">AI Explanation</label>
                                    <p className="text-xs text-gray-500 leading-relaxed italic">{(goal as any).explanation}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer (edit mode) */}
                        {editMode && (
                            <div className="flex-shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand-maroon)] hover:bg-[#7a1b35] text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                    <Save className="w-3.5 h-3.5" /> Save
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default GoalDetailPanel;
