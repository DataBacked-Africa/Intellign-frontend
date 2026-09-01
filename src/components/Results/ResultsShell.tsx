"use client";

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { EnrichedResultsResponse, TaskType } from '@/services/resultsService';

const TASK_TYPE_LABEL: Record<TaskType, string> = {
    assignment: 'Assignment',
    routing: 'Routing',
    scheduling: 'Scheduling',
    budgeting: 'Budgeting',
};

const EXPORT_FORMATS: { id: 'csv' | 'xlsx' | 'ics' | 'pdf'; label: string }[] = [
    { id: 'pdf', label: 'Export PDF' },
    { id: 'xlsx', label: 'Export XLSX' },
];

interface ResultsShellProps {
    data: EnrichedResultsResponse;
    tabs: { id: string; label: string }[];
    activeTab: string;
    onTabChange: (id: string) => void;
    onExport: (format: 'csv' | 'xlsx' | 'ics' | 'pdf') => void;
    exporting: string | null;
    onApproveAll: () => void;
    approvingAll: boolean;
    children: React.ReactNode;
}

export const ResultsShell: React.FC<ResultsShellProps> = ({
    data, tabs, activeTab, onTabChange, onExport, exporting, onApproveAll, approvingAll, children,
}) => {
    const taskType = data.taskType;
    const eyebrow = [taskType ? TASK_TYPE_LABEL[taskType] : null, data.entityLabels ? `${data.entityLabels.resource} → ${data.entityLabels.target}` : null]
        .filter(Boolean).join(' · ');

    return (
        <div className="results-shell">
            <aside className="results-sidebar">
                <div className="results-sb-brand">Intellign</div>
                <span className="results-sb-item active">Results</span>
                <Link className="results-sb-item" href={`/sessions/${data.session_id}`}>Chat</Link>
                <Link className="results-sb-item" href={`/sessions/${data.session_id}`}>Data</Link>
            </aside>
            <div className="results-main">
                <div className="results-topbar">
                    <div className="results-top-tabs">
                        {tabs.map(t => (
                            <button key={t.id} className={`results-top-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => onTabChange(t.id)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="results-top-actions">
                        {EXPORT_FORMATS.map(f => (
                            <button key={f.id} className="results-btn" disabled={!!exporting} onClick={() => onExport(f.id)}>
                                {exporting === f.id ? <Loader2 size={12} className="animate-spin" /> : null}{f.label}
                            </button>
                        ))}
                        <button className="results-btn results-btn-primary" disabled={approvingAll} onClick={onApproveAll}>
                            {approvingAll ? <Loader2 size={12} className="animate-spin" /> : null}Approve plan
                        </button>
                    </div>
                </div>
                <div className="results-content">
                    <div className="results-page-head">
                        <div>
                            {eyebrow && <p className="results-eyebrow">{eyebrow}</p>}
                            <h1 className="results-page-title">{data.title ?? 'Optimization Results'}</h1>
                            {data.context && <p className="results-page-context">{data.context}</p>}
                        </div>
                        <div className="results-meta-block">
                            {(data.solver_used ?? data.metrics.solver_used) && <>Solver: <b>{data.solver_used ?? data.metrics.solver_used}</b><br /></>}
                            {data.created_at && <>Solved {new Date(data.created_at).toLocaleString()}</>}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ResultsShell;
