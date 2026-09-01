"use client";

import React, { useState } from 'react';
import { Assignment, resultsService } from '@/services/resultsService';
import { showToast } from '@/components/ui/CustomToast';

interface AssignmentsTableProps {
    jobId: string;
    assignments: Assignment[];
    entityLabels?: { resource: string; target: string };
    onChanged: () => void;
}

/** The Overview tab's results table — one row per resource↔target pairing. */
export const AssignmentsTable: React.FC<AssignmentsTableProps> = ({ jobId, assignments, entityLabels, onChanged }) => {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    if (!assignments?.length) return null;

    const resourceLabel = entityLabels?.resource ?? 'Resource';
    const targetLabel = entityLabels?.target ?? 'Target';

    const withLoading = async (id: string, fn: () => Promise<any>, okMsg: string) => {
        setActionLoading(id);
        try {
            await fn();
            showToast.success(okMsg, '');
            onChanged();
        } catch {
            showToast.error('Failed', 'Could not update this assignment.');
        } finally {
            setActionLoading(null);
        }
    };

    const approve = (a: Assignment) => withLoading(a.assignment_id, () => resultsService.approveAssignment(jobId, a.assignment_id), 'Approved');
    const reject = (a: Assignment) => {
        const reason = prompt('Rejection reason:');
        if (!reason) return;
        withLoading(a.assignment_id, () => resultsService.rejectAssignment(jobId, a.assignment_id, reason), 'Rejected');
    };
    const reassign = (a: Assignment) => {
        const newTargetId = prompt(`Reassign to a different ${targetLabel.toLowerCase()} (enter its id):`);
        if (!newTargetId) return;
        const reason = prompt('Reason for reassignment:');
        if (!reason) return;
        withLoading(a.assignment_id, () => resultsService.modifyAssignment(jobId, a.assignment_id, { newTargetId, reason }), 'Reassigned');
    };

    const summary = (a: Assignment) => (a as any).summary as
        | { resource_name?: string; resource_specialization?: string; target_name?: string; target_specialization?: string }
        | undefined;

    return (
        <div className="results-card">
            <h2>The Data</h2>
            <p className="sub-h">Every assignment made ({assignments.length}).</p>
            <div className="results-tbl-wrap">
                <table className="results-data-tbl">
                    <thead>
                        <tr>
                            <th>{resourceLabel}</th>
                            <th>{targetLabel}</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(a => {
                            const s = summary(a);
                            const busy = actionLoading === a.assignment_id;
                            return (
                                <tr key={a.assignment_id}>
                                    <td>{s?.resource_name ?? a.resource.id}{s?.resource_specialization ? ` · ${s.resource_specialization}` : ''}</td>
                                    <td>{s?.target_name ?? a.target.id}{s?.target_specialization ? ` · ${s.target_specialization}` : ''}</td>
                                    <td>{typeof a.score === 'number' ? `${Math.round(a.score * 100)}%` : a.score}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{a.approval_status}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="results-btn" disabled={busy} onClick={() => approve(a)} style={{ padding: '4px 8px', fontSize: 11 }}>Approve</button>
                                            <button className="results-btn" disabled={busy} onClick={() => reject(a)} style={{ padding: '4px 8px', fontSize: 11 }}>Reject</button>
                                            <button className="results-btn" disabled={busy} onClick={() => reassign(a)} style={{ padding: '4px 8px', fontSize: 11 }}>Reassign</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssignmentsTable;
