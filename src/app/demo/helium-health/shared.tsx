import React from 'react';
import { cn } from '@/lib/utils';

export const T = {
    bone: '#F4EFE7', boneDeep: '#E8E0D2', maroon: '#5C1427', maroonDeep: '#3E0E1A',
    maroonRich: '#731931', ink: '#14110F',
    neutral50: '#FAFAF8', neutral100: '#F2F1ED', neutral200: '#E5E3DC',
    neutral400: '#9E9C92', neutral500: '#6F6E66', neutral600: '#4A4945', neutral700: '#2E2D2A',
};

export const StatusBadge = ({ status }: { status: string }) => {
    const s: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700',
        pending_review: 'bg-amber-100 text-amber-700',
        pending: 'bg-amber-100 text-amber-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', s[status] ?? 'bg-gray-100 text-gray-600')}>{status.replace(/_/g, ' ')}</span>;
};

export interface SimpleAssignment {
    assignment_id: string;
    resource_id: string;
    target_id: string;
    score: number;
    approval_status: string;
}

export const AssignmentsTable = ({ assignments, showScore = true }: { assignments: SimpleAssignment[]; showScore?: boolean }) => (
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

export const CodeBlock = ({ code }: { code: string }) => (
    <pre style={{
        background: T.ink, color: '#E8E0D2', borderRadius: 10, padding: '16px 18px',
        fontSize: 12, lineHeight: 1.6, overflowX: 'auto', fontFamily: 'var(--font-mono)', margin: 0,
    }}>
        <code>{code}</code>
    </pre>
);
