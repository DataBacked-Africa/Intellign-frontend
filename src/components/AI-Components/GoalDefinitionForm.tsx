import React, { useState } from 'react';
import { useSessionStore, GoalDefinitionPayload, GoalParams } from '@/store/useSessionStore';
import { useSessionOrchestrator } from '@/hooks/useSessionOrchestrator';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Info, Trash2, ArrowRight, Play, Check, X, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showToast } from '../ui/CustomToast';

const LOGIC_TEMPLATES = [
    { value: 'numeric_overload', label: 'Numeric / Overload' },
    { value: 'numeric_underload', label: 'Numeric / Underload' },
    { value: 'boolean_constraint', label: 'Boolean Constraint' },
    { value: 'ratio_balance', label: 'Ratio Balance' }
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
    { value: '<=', label: '≤ (Less or Equal)' },
    { value: '>=', label: '≥ (Greater or Equal)' },
    { value: '==', label: '= (Equal to)' },
    { value: '<', label: '< (Less than)' },
    { value: '>', label: '> (Greater than)' }
];

// Mock columns fallback
const MOCK_COLUMNS = ['column_a', 'column_b'];

interface GoalDefinitionFormProps {
    onNext: () => void;
}

const GoalDefinitionForm: React.FC<GoalDefinitionFormProps> = ({ onNext }) => {
    const { setGoals, setStatus, goals, schemaPreview } = useSessionStore();
    const { startIngestion } = useSessionOrchestrator();

    // Use dynamic columns from backend analysis, fallback to mock if empty (dev safety)
    const availableColumns = schemaPreview?.columns && schemaPreview.columns.length > 0
        ? schemaPreview.columns
        : MOCK_COLUMNS;

    // Local form state
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(50);
    const [logicType, setLogicType] = useState('numeric_overload');
    const [impactType, setImpactType] = useState<'reward' | 'penalty'>('reward');

    // Params state
    const [resourceLoadCols, setResourceLoadCols] = useState<string[]>([]);
    const [targetLoadCols, setTargetLoadCols] = useState<string[]>([]);
    const [aggregation, setAggregation] = useState('sum');
    const [operator, setOperator] = useState<GoalParams['operator']>('<=');
    const [useStaticThreshold, setUseStaticThreshold] = useState(false);
    const [capacityColumn, setCapacityColumn] = useState('');
    const [staticThresholdValue, setStaticThresholdValue] = useState<number>(0);

    const handleAddDefinition = () => {
        if (!description) {
            showToast.error("Validation Error", "Please provide a goal description.");
            return;
        }
        if (logicType === 'numeric_overload' && targetLoadCols.length === 0) {
            showToast.error("Validation Error", "Please select at least one Target Load Column.");
            return;
        }

        const goalId = crypto.randomUUID();
        const payload: GoalDefinitionPayload = {
            [goalId]: {
                description,
                priority,
                logic_type: logicType,
                params: {
                    impact_type: impactType,
                    resource_load_columns: resourceLoadCols,
                    target_load_columns: targetLoadCols,
                    aggregation,
                    operator,
                    use_static_threshold: useStaticThreshold,
                    capacity_column: useStaticThreshold ? undefined : capacityColumn,
                    static_threshold_value: useStaticThreshold ? staticThresholdValue : undefined
                }
            }
        };

        setGoals(payload);
        showToast.success("Goal Added", "Goal definition saved.");
    };

    const toggleColumn = (col: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(col)) {
            setList(list.filter(c => c !== col));
        } else {
            setList([...list, col]);
        }
    };

    return (
        <div className="w-full flex justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl space-y-8"
            >
                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Define Optimization Goals</h2>
                    <p className="text-gray-500 max-w-lg mx-auto">
                        Tell the AI what outcomes are most important. Define constraints and rules using the columns from your data.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Bar */}
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-[#5c1427]/10 flex items-center justify-center text-[#5c1427] font-semibold text-sm">1</span>
                            <span className="font-medium text-gray-700">New Goal Definition</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            Logic: {LOGIC_TEMPLATES.find(t => t.value === logicType)?.label}
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* 1. Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Minimize Staff Overload"
                                    className="w-full h-10 px-4 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 h-5 flex items-center">Impact</label>
                                <div className="grid grid-cols-2 gap-2 h-10">
                                    {IMPACT_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => setImpactType(type.value as any)}
                                            className={cn(
                                                "h-full rounded-lg text-sm font-medium transition-all border flex items-center justify-center",
                                                impactType === type.value
                                                    ? type.value === 'reward'
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                        : "bg-rose-50 border-rose-200 text-rose-700"
                                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                            )}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Logic Builder */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-gray-400" />
                                Logic Construction
                            </h3>

                            {/* Aggregation & Columns */}
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-4">
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                    <span>Calculate the</span>
                                    <select
                                        value={aggregation}
                                        onChange={(e) => setAggregation(e.target.value)}
                                        className="h-8 bg-white border border-gray-200 rounded-md px-3 font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                    >
                                        {AGGREGATIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    <span>of</span>
                                </div>

                                {/* Column Selection (Pills) */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Target Columns</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableColumns.map(col => (
                                            <button
                                                key={col}
                                                onClick={() => toggleColumn(col, targetLoadCols, setTargetLoadCols)}
                                                className={cn(
                                                    "px-3 py-1 text-sm rounded-full border transition-all flex items-center gap-1.5",
                                                    targetLoadCols.includes(col)
                                                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                {targetLoadCols.includes(col) && <Check className="w-3 h-3" />}
                                                {col}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Operator & Threshold */}
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <span className="text-sm text-gray-600 whitespace-nowrap">Must be</span>
                                    <select
                                        value={operator}
                                        onChange={(e) => setOperator(e.target.value as any)}
                                        className="w-full md:w-auto h-10 bg-white border border-gray-200 rounded-md px-3 font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                    >
                                        {OPERATORS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>

                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                useStaticThreshold ? "bg-[#5c1427] border-[#5c1427] text-white" : "border-gray-300 bg-white"
                                            )}>
                                                {useStaticThreshold && <Check className="w-3 h-3" />}
                                                <input type="checkbox" className="hidden" checked={useStaticThreshold} onChange={e => setUseStaticThreshold(e.target.checked)} />
                                            </div>
                                            Use Static Value
                                        </label>
                                    </div>

                                    {useStaticThreshold ? (
                                        <input
                                            type="number"
                                            value={staticThresholdValue}
                                            onChange={(e) => setStaticThresholdValue(Number(e.target.value))}
                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                                            placeholder="Enter value..."
                                        />
                                    ) : (
                                        <select
                                            value={capacityColumn}
                                            onChange={(e) => setCapacityColumn(e.target.value)}
                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                                        >
                                            <option value="">Compare against column...</option>
                                            {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">Importance: {priority}</label>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#5c1427]"
                            />
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                            onClick={handleAddDefinition}
                            className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Another Goal
                        </button>
                        <button
                            onClick={startIngestion}
                            className="bg-[#5c1427] hover:bg-[#7a1b34] text-white px-6 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02]"
                        >
                            Run Optimization <Play className="w-3 h-3 fill-current" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GoalDefinitionForm;
