"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { resultsService, EnrichedResultsResponse } from '@/services/resultsService';
import { showToast } from '@/components/ui/CustomToast';
import { ResultsShell } from '@/components/Results/ResultsShell';
import { HeadlineStats } from '@/components/Results/HeadlineStats';
import { ProofBadge } from '@/components/Results/ProofBadge';
import { ExecutiveSummaryCard } from '@/components/Results/ExecutiveSummaryCard';
import { GapsCard } from '@/components/Results/GapsCard';
import { RationaleCard } from '@/components/Results/RationaleCard';
import { GoalAttributionCard } from '@/components/Results/GoalAttributionCard';
import { DataPayloadTable } from '@/components/Results/DataPayloadTable';
import { AssignmentsTable } from '@/components/Results/AssignmentsTable';
import { RoutingMap } from '@/components/Results/RoutingMap';
import { SchedulingRoster } from '@/components/Results/SchedulingRoster';
import { BudgetingPanel } from '@/components/Results/BudgetingPanel';
import { ParetoNotice } from '@/components/Results/ParetoNotice';
import './results.css';

const RATIONALE_TITLE: Record<string, string> = {
    assignment: 'Why This Match Was Made',
    routing: 'Why This Route',
    scheduling: 'Why This Roster',
    budgeting: 'Why This Allocation',
};

export default function ResultsPage() {
    const params = useParams();
    const jobId = params.jobId as string;

    const [data, setData] = useState<EnrichedResultsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'overview' | 'data' | 'sensitivity'>('overview');
    const [exporting, setExporting] = useState<string | null>(null);
    const [approvingAll, setApprovingAll] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await resultsService.getEnrichedResults(jobId);
            setData(res);
            setError(null);
        } catch {
            setError('Could not load results for this job.');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => { if (jobId) load(); }, [jobId, load]);

    const handleExport = async (format: 'csv' | 'xlsx' | 'ics' | 'pdf') => {
        setExporting(format);
        try {
            await resultsService.downloadExport(jobId, format);
            showToast.success('Exported', `Downloaded as .${format}`);
        } catch {
            showToast.error('Export failed', `Could not export as .${format}`);
        } finally {
            setExporting(null);
        }
    };

    const handleApproveAll = async () => {
        setApprovingAll(true);
        try {
            const r = await resultsService.approveAll(jobId);
            showToast.success('Approved', `${r.approved_count} assignments approved.`);
            load();
        } catch {
            showToast.error('Failed', 'Could not approve all assignments.');
        } finally {
            setApprovingAll(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-tertiary)' }}>
                <Loader2 className="animate-spin" size={18} style={{ marginRight: 8 }} /> Loading results…
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-tertiary)' }}>
                {error ?? 'No results found.'}
            </div>
        );
    }

    const taskType = data.taskType ?? 'assignment';
    const tabs = [
        { id: 'overview', label: 'Overview' },
        ...(data.payload ? [{ id: 'data', label: 'Data table' }] : []),
        ...(data.sensitivity?.length ? [{ id: 'sensitivity', label: 'Sensitivity' }] : []),
    ];

    return (
        <ResultsShell
            data={data}
            tabs={tabs}
            activeTab={tab}
            onTabChange={(t) => setTab(t as typeof tab)}
            onExport={handleExport}
            exporting={exporting}
            onApproveAll={handleApproveAll}
            approvingAll={approvingAll}
        >
            {tab === 'overview' && (
                <>
                    <ProofBadge metrics={data.metrics} solverUsed={data.solver_used} />
                    <HeadlineStats headline={data.headline} />
                    <div className="results-grid-2">
                        <ExecutiveSummaryCard executiveSummary={data.executiveSummary} taskExplanation={data.taskExplanation} />
                        <GapsCard gaps={data.gaps} />
                    </div>
                    <div className="results-grid-2">
                        <RationaleCard rationale={data.rationale} title={RATIONALE_TITLE[taskType]} />
                        <GoalAttributionCard goalAttribution={data.goalAttribution} />
                    </div>

                    <ParetoNotice paretoFront={data.pareto_front} />

                    {taskType === 'routing' && <RoutingMap geo={data.geo} />}
                    {taskType === 'scheduling' && <SchedulingRoster scheduleTable={data.schedule_table} />}
                    {taskType === 'budgeting' && <BudgetingPanel budgetPriority={data.budgetPriority} />}
                    {taskType === 'assignment' && (
                        <AssignmentsTable jobId={jobId} assignments={data.assignments} entityLabels={data.entityLabels} onChanged={load} />
                    )}
                </>
            )}

            {tab === 'data' && <DataPayloadTable payload={data.payload} />}

            {tab === 'sensitivity' && data.sensitivity?.length ? (
                <div className="results-card">
                    <h2>Sensitivity</h2>
                    <p className="sub-h">Top goals by weight, one-at-a-time perturbation test.</p>
                    <div className="results-why-list">
                        {data.sensitivity.map((s, i) => (
                            <div key={i} className="results-why-item">
                                <span>{s.goal} · ±{s.perturbation_pct}% — {s.holdsUnless}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </ResultsShell>
    );
}
