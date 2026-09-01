"use client";

import React, { useState } from 'react';

/**
 * `pareto_front` is the one field RESULTS_PAGE_DESIGN_SPEC.md never gives a
 * shape for. Rather than guess (that's exactly the mistake being corrected
 * here), show a minimal, honest notice with a raw dump — revisit once the
 * backend documents the item shape.
 */
export const ParetoNotice: React.FC<{ paretoFront?: unknown[] | null }> = ({ paretoFront }) => {
    const [open, setOpen] = useState(false);
    if (!paretoFront?.length) return null;
    return (
        <div className="results-card">
            <h2>Multiple Trade-offs Available</h2>
            <p className="body-text">
                This run's goals genuinely conflicted — {paretoFront.length} non-dominated option{paretoFront.length === 1 ? '' : 's'} exist{paretoFront.length === 1 ? 's' : ''} instead of one clear winner.
                A dedicated trade-off explorer isn't built yet (the raw shape of this data isn't documented) — raw data below in the meantime.
            </p>
            <button className="results-btn" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Show'} raw data</button>
            {open && (
                <pre style={{ marginTop: 12, padding: 12, background: 'var(--neutral-50)', borderRadius: 'var(--r-md)', fontSize: 11, overflow: 'auto', maxHeight: 320 }}>
                    {JSON.stringify(paretoFront, null, 2)}
                </pre>
            )}
        </div>
    );
};

export default ParetoNotice;
