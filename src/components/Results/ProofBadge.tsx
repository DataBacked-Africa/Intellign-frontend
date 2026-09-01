"use client";

import React from 'react';
import { EnrichedResultsMetrics } from '@/services/resultsService';

interface ProofBadgeProps {
    metrics: EnrichedResultsMetrics;
    solverUsed?: string;
}

/**
 * Honest statement of solver certainty, built from the real fields:
 * metrics.is_proven_optimal / metrics.gap_percent. Falls back to a plain
 * "best found" state when neither is present (heuristic solver, no bound).
 */
export const ProofBadge: React.FC<ProofBadgeProps> = ({ metrics, solverUsed }) => {
    const solver = solverUsed ?? metrics.solver_used;
    const gap = metrics.gap_percent;

    let state: 'proven' | 'within-gap' | 'best-found' = 'best-found';
    let title = 'Best found — not proven';
    let sub = 'No optimality bound available for this solver. Still the strongest answer found.';

    if (metrics.is_proven_optimal === true) {
        state = 'proven';
        title = 'Proven optimal';
        sub = 'Gap = 0.00% — nothing scores higher, checked exhaustively.';
    } else if (metrics.is_proven_optimal === false && typeof gap === 'number') {
        state = 'within-gap';
        title = `Within ${gap.toFixed(gap < 1 ? 2 : 1)}% of optimal`;
        sub = `Ran out of time before proving it — but nothing could beat this by more than ${gap}%.`;
    }

    return (
        <div className={`results-proof-badge ${state}`}>
            <div style={{ flex: 1 }}>
                <div className="results-proof-title">{title}</div>
                <div className="results-proof-sub">{sub}</div>
            </div>
            {solver && <span className="results-solver-pill">{solver}</span>}
        </div>
    );
};

export default ProofBadge;
