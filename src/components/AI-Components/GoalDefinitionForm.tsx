"use client"
import React, { useEffect, useState } from 'react';
import { useSessionStore, GoalDefinitionPayload } from '@/store/useSessionStore';
import { useSessionOrchestrator } from '@/hooks/useSessionOrchestrator';
import { motion } from 'framer-motion';
import { Plus, Play, X, HelpCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showToast } from '../ui/CustomToast';

const LOGIC_TEMPLATES = [
    { value: 'numeric_threshold', label: 'Numeric Capacity', scenario: "Ensure resource load ≤ capacity.", visual: "∑ Load ≤ Limit" },
    { value: 'categorical_match', label: 'Attribute Matching', scenario: "Match resources to targets by attributes.", visual: "Resource.Attr == Target.Attr" },
    { value: 'weighted_scoring', label: 'Weighted Features', scenario: "Prioritize specific attributes.", visual: "Score += Weight * Value" },
    { value: 'spatial_proximity', label: 'Distance / Proximity', scenario: "Optimize travel distance.", visual: "Distance ≤ Max" },
    { value: 'set_coverage', label: 'Skill Coverage', scenario: "Ensure skills cover requirements.", visual: "Skills ⊇ Requirements" },
    { value: 'temporal_match', label: 'Schedule Matching', scenario: "Match time availability.", visual: "Time Overlap > 0" }
];

const IMPACT_TYPES = [
    { value: 'reward', label: 'Reward' },
    { value: 'penalty', label: 'Penalty' }
];

const AGGREGATIONS = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'max', label: 'Maximum' },
    { value: 'min', label: 'Minimum' }
];

const OPERATORS = [
    { value: 'ge', label: '≤ (Max Limit)' },
    { value: 'le', label: '≥ (Min Req)' },
    { value: 'eq', label: '= (Exact)' },
    { value: 'le', label: '< (Less)' },
    { value: 'ge', label: '> (More)' }
];

const MOCK_COLUMNS = ['column_a', 'column_b'];

// Reusable Minimal Input Component
const MinimalInput = ({ label, ...props }: React.ComponentProps<'input'> & { label: string }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <input
            {...props}
            className={cn(
                "w-full h-11 px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-gray-100 outline-none transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400",
                props.className
            )}
        />
    </div>
);

const MinimalSelect = ({ label, children, ...props }: React.ComponentProps<'select'> & { label: string }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <div className="relative">
            <select
                {...props}
                className={cn(
                    "w-full h-11 px-4 pr-10 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-gray-100 outline-none transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer",
                    props.className
                )}
            >
                {children}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
    </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: React.ElementType }) => (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h4>
    </div>
);

const GoalItemForm: React.FC<{ id: string; goal: GoalDefinitionPayload[string]; index: number }> = ({ id, goal, index }) => {
    const { updateGoal, removeGoal, resourcesMetadata, targetsMetadata } = useSessionStore();
    const [isExpanded, setIsExpanded] = useState(true);

    // State management...
    const [description, setDescription] = useState(goal.description);
    const [weight, setWeight] = useState(goal.weight || 50);
    const [logicType, setLogicType] = useState(goal.logic_config.logic_type);
    const [awardType, setAwardType] = useState(goal.award_type || 'Reward');

    const [resourceLoadCols, setResourceLoadCols] = useState<string[]>(goal.resource_columns || []);
    const [targetLoadCols, setTargetLoadCols] = useState<string[]>(goal.target_columns || []);

    const [aggregation, setAggregation] = useState(goal.logic_config.aggregation_method || 'sum');
    const [operator, setOperator] = useState(goal.logic_config.numeric_operator || '<=');
    const [useStaticThreshold, setUseStaticThreshold] = useState(!!goal.logic_config.threshold_value);
    const [capacityColumn, setCapacityColumn] = useState(goal.logic_config.comparison_column || '');
    const [staticThresholdValue, setStaticThresholdValue] = useState<number>(goal.logic_config.threshold_value || 0);
    const [mappingRules, setMappingRules] = useState<Record<string, string[]>>(goal.logic_config.mapping_rules || {});
    const [scoringRules, setScoringRules] = useState<Record<string, number>>(goal.logic_config.scoring_rules || {});
    const [exactMatch, setExactMatch] = useState(goal.logic_config.exact_match ?? true);

    const [currentKey, setCurrentKey] = useState('');
    const [currentValues, setCurrentValues] = useState<string[]>([]);
    const [currentScore, setCurrentScore] = useState<number>(10);

    const resourceColumns = resourcesMetadata?.columns.map(c => c.column_name) || MOCK_COLUMNS;
    const targetColumns = targetsMetadata?.columns.map(c => c.column_name) || MOCK_COLUMNS;

    const getTargetSamples = () => {
        if (!targetsMetadata) return [];
        const relevantCols = targetsMetadata.columns.filter(c => targetLoadCols.includes(c.column_name));
        const allSamples = relevantCols.flatMap(c => c.sample_values);
        const mappedKeys = Object.keys(mappingRules);
        return Array.from(new Set(allSamples)).map(String).filter(s => !mappedKeys.includes(s));
    };

    const getResourceSamples = () => {
        if (!resourcesMetadata) return [];
        const relevantCols = resourcesMetadata.columns.filter(c => resourceLoadCols.includes(c.column_name));
        const allSamples = relevantCols.flatMap(c => c.sample_values);
        return Array.from(new Set(allSamples)).map(String);
    };

    const targetSamples = getTargetSamples();
    const resourceSamples = getResourceSamples();

    useEffect(() => {
        const operatorMap: Record<string, string> = { '<=': 'le', '>=': 'ge', '==': 'eq', '<': 'lt', '>': 'gt' };
        updateGoal(id, {
            description,
            weight,
            resource_columns: resourceLoadCols,
            target_columns: targetLoadCols,
            award_type: awardType,
            logic_primitive: null,
            logic_config: {
                logic_type: logicType,
                aggregation_method: aggregation,
                comparison_column: (useStaticThreshold || !capacityColumn) ? null : capacityColumn,
                threshold_value: useStaticThreshold ? staticThresholdValue : null,
                numeric_operator: operatorMap[operator] || operator,
                mapping_rules: logicType === 'categorical_match' ? mappingRules : null,
                scoring_rules: logicType === 'weighted_scoring' ? scoringRules : null,
                exact_match: exactMatch,
                max_distance_value: null, distance_unit: "km", minimize_distance: false,
                set_operation: null, min_intersection_size: 1, time_unit: "hours", buffer_time: 0, value_splitter: null
            }
        });
    }, [id, description, weight, logicType, awardType, resourceLoadCols, targetLoadCols, aggregation, operator, useStaticThreshold, capacityColumn, staticThresholdValue, mappingRules, scoringRules, exactMatch, updateGoal]);

    // Rule Handlers...
    const handleAddRule = () => {
        if (!currentKey || currentValues.length === 0) return;
        setMappingRules(prev => ({ ...prev, [currentKey]: Array.from(new Set([...(prev[currentKey] || []), ...currentValues])) }));
        setCurrentKey(''); setCurrentValues([]);
    };
    const removeRule = (key: string) => { const next = { ...mappingRules }; delete next[key]; setMappingRules(next); };
    const handleAddScore = () => {
        if (!currentKey) return;
        setScoringRules(prev => ({ ...prev, [currentKey]: currentScore }));
        setCurrentKey(''); setCurrentScore(10);
    };
    const removeScore = (key: string) => { const next = { ...scoringRules }; delete next[key]; setScoringRules(next); };


    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all hover:border-gray-300 group">
            <div className="flex items-center justify-between p-5 cursor-pointer bg-white" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">{description || "Untitled Goal"}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wide">
                            {LOGIC_TEMPLATES.find(t => t.value === logicType)?.label} • {weight}% {awardType}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); removeGoal(id); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 pt-0 border-t border-gray-100">
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: BASIC INFO */}
                        <div className="md:col-span-4 space-y-6">
                            <SectionHeader title="Goal Basics" />
                            <div className="space-y-4">
                                <MinimalInput
                                    label="Description"
                                    placeholder="e.g. Maximize Sales Coverage"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <MinimalSelect label="Template" value={logicType} onChange={(e) => setLogicType(e.target.value)}>
                                    {LOGIC_TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </MinimalSelect>
                                <div className="grid grid-cols-2 gap-4">
                                    <MinimalSelect label="Type" value={awardType} onChange={(e) => setAwardType(e.target.value as any)}>
                                        {IMPACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </MinimalSelect>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Weight</label>
                                            <span className="text-[11px] font-bold text-gray-900">{weight}%</span>
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" value={weight} onChange={e => setWeight(Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: CONFIGURATION */}
                        <div className="md:col-span-8 space-y-8">

                            {/* DATA MAPPING */}
                            <div>
                                <SectionHeader title="Data Mapping" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-gray-900">Resource Columns</label>
                                            <button onClick={() => setExactMatch(!exactMatch)} className={cn("text-[10px] font-bold uppercase transition-colors", exactMatch ? "text-green-600" : "text-gray-400")}>
                                                {exactMatch ? "Unordered Match" : "Exact Match"}
                                            </button>
                                        </div>
                                        <select
                                            onChange={(e) => { if (e.target.value) { setResourceLoadCols(prev => [...prev, e.target.value]); e.target.value = ""; } }}
                                            className="w-full h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm focus:border-black outline-none"
                                        >
                                            <option value="">+ Add Column</option>
                                            {resourceColumns.filter(c => !resourceLoadCols.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="flex flex-wrap gap-2">
                                            {resourceLoadCols.map(c => (
                                                <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">
                                                    {c} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setResourceLoadCols(prev => prev.filter(x => x !== c))} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-gray-900">Target Columns</label>
                                        <select
                                            onChange={(e) => { if (e.target.value) { setTargetLoadCols(prev => [...prev, e.target.value]); e.target.value = ""; } }}
                                            className="w-full h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm focus:border-black outline-none"
                                        >
                                            <option value="">+ Add Column</option>
                                            {targetColumns.filter(c => !targetLoadCols.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="flex flex-wrap gap-2">
                                            {targetLoadCols.map(c => (
                                                <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">
                                                    {c} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setTargetLoadCols(prev => prev.filter(x => x !== c))} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOGIC RULES */}
                            <div>
                                <SectionHeader title="Logic Rules" />
                                <div className="p-5 border border-gray-100 rounded-xl bg-white space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <MinimalSelect label="Aggregation" value={aggregation} onChange={e => setAggregation(e.target.value)}>
                                            {AGGREGATIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </MinimalSelect>
                                        <MinimalSelect label="Operator" value={operator} onChange={e => setOperator(e.target.value)}>
                                            {OPERATORS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </MinimalSelect>

                                        <div className="space-y-1.5 w-full">
                                            <div className="flex justify-between">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Threshold</label>
                                                <div className="flex items-center gap-1">
                                                    <input type="checkbox" checked={useStaticThreshold} onChange={e => setUseStaticThreshold(e.target.checked)} className="w-3 h-3 accent-black" />
                                                    <span className="text-[10px] text-gray-500 uppercase">Static</span>
                                                </div>
                                            </div>
                                            {useStaticThreshold ? (
                                                <input type="number" value={staticThresholdValue} onChange={e => setStaticThresholdValue(Number(e.target.value))} className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 text-sm font-medium outline-none" placeholder="e.g. 100" />
                                            ) : (
                                                <div className="relative">
                                                    <select value={capacityColumn} onChange={e => setCapacityColumn(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 text-sm font-medium outline-none appearance-none">
                                                        <option value="">-- Col --</option>
                                                        {targetColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Categorical Mapping UI */}
                                    {logicType === 'categorical_match' && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Value Mapping</p>
                                            {/* Simplified UI for mapping */}
                                            <div className="flex gap-2 mb-3">
                                                <select className="flex-1 h-9 rounded bg-white border border-gray-200 text-xs px-2" value={currentKey} onChange={e => setCurrentKey(e.target.value)}>
                                                    <option value="">Target Key...</option>
                                                    {targetSamples.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <select multiple className="flex-1 h-20 rounded bg-white border border-gray-200 text-xs px-2" value={currentValues} onChange={e => setCurrentValues(Array.from(e.target.selectedOptions, o => o.value))}>
                                                    {resourceSamples.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <button onClick={handleAddRule} className="h-9 px-3 bg-black text-white rounded text-xs font-bold self-start mt-0">Add</button>
                                            </div>
                                            {/* List */}
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(mappingRules).map(([k, v]) => (
                                                    <div key={k} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{k}</span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="text-gray-500">{v.length} values</span>
                                                        <X className="w-3 h-3 text-gray-400 hover:text-red-500 cursor-pointer" onClick={() => removeRule(k)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const GoalDefinitionForm: React.FC<any> = ({ onNext }) => {
    const { goals, addGoal, clearSession } = useSessionStore();
    const { startOptimization } = useSessionOrchestrator();

    useEffect(() => { if (Object.keys(goals).length === 0) handleAddNewGoal(); }, [goals]);

    const handleAddNewGoal = () => {
        const id = crypto.randomUUID();
        addGoal(id, {
            id, description: '', resource_columns: [], target_columns: [], weight: 50, award_type: 'Reward', logic_primitive: null,
            logic_config: { logic_type: 'numeric_threshold', aggregation_method: 'sum', comparison_column: null, threshold_value: null, numeric_operator: 'le', mapping_rules: null, exact_match: true, max_distance_value: null, distance_unit: "km", minimize_distance: false, set_operation: null, min_intersection_size: 1, time_unit: "hours", buffer_time: 0, scoring_rules: null, value_splitter: null }
        });
    };

    return (
        <div className="w-full justify-center p-6 md:p-12 pb-24 bg-white min-h-[600px]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl mx-auto space-y-12">
                <div className="flex justify-between items-end pb-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Optimization Goals</h2>
                        <p className="text-gray-500 mt-2">Define logic to guide the AI allocation engine.</p>
                    </div>
                    <button onClick={clearSession} className="px-4 py-2 text-sm text-gray-500 hover:text-black font-medium transition-colors">Reset All</button>
                </div>

                <div className="space-y-4">
                    {Object.entries(goals).map(([id, goal], index) => (
                        <GoalItemForm key={id} id={id} goal={goal} index={index} />
                    ))}
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button onClick={handleAddNewGoal} className="px-6 py-4 rounded-xl border border-dashed border-gray-300 text-gray-500 font-medium hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add Goal Condition
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={startOptimization}
                        disabled={Object.keys(goals).length === 0}
                        className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-black/5 hover:bg-gray-900 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Run Optimization <Play className="w-4 h-4 fill-white" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default GoalDefinitionForm;
