"use client";

import React, { useMemo } from 'react';
import { BudgetPriority } from '@/services/resultsService';

const REC_LABEL: Record<string, string> = {
    concentrate: 'Concentrate',
    sufficient: 'Sufficient',
    deprioritize: 'Deprioritize',
};

export const BudgetingPanel: React.FC<{ budgetPriority?: BudgetPriority }> = ({ budgetPriority }) => {
    const funded = useMemo(() => budgetPriority?.candidates.filter(c => c.status === 'SELECTED') ?? [], [budgetPriority]);
    const notFunded = useMemo(() => budgetPriority?.candidates.filter(c => c.status === 'REJECTED') ?? [], [budgetPriority]);
    // No total-budget field exists in the API — only committed spend is knowable client-side.
    const committed = useMemo(() => funded.reduce((s, c) => s + c.cost, 0), [funded]);

    if (!budgetPriority?.candidates?.length) return null;

    return (
        <>
            <div className="results-card">
                <h2>Budget Committed</h2>
                <p className="sub-h">Sum of funded candidates' cost (no total-budget figure exists to show utilization against).</p>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--brand-maroon-deep)' }}>
                    ₦{committed.toLocaleString(undefined, { maximumFractionDigits: 2 })}M committed · {funded.length}/{budgetPriority.candidates.length} programmes funded
                </div>
            </div>

            <div className="results-grid-2">
                <div className="results-card">
                    <h2>Funded</h2>
                    <p className="sub-h">Best impact-per-cost, subject to the budget cap.</p>
                    <ul className="results-proj-list">
                        {funded.map(c => (
                            <li key={c.id}>
                                <span className="results-proj-name">{c.id}<span className={`results-tier-pill ${c.tier.toLowerCase()}`}>{c.tier}</span></span>
                                <span className="results-proj-cost">₦{c.cost.toLocaleString()}</span>
                                <span className="results-proj-status funded">Funded</span>
                            </li>
                        ))}
                        {!funded.length && <li style={{ color: 'var(--fg-tertiary)', fontSize: 12 }}>None funded this round.</li>}
                    </ul>
                </div>
                <div className="results-card">
                    <h2>Not Funded This Round</h2>
                    <p className="sub-h">Tier pill shows priority rank against every candidate, funded or not.</p>
                    <ul className="results-proj-list">
                        {notFunded.map(c => (
                            <li key={c.id}>
                                <span className="results-proj-name">{c.id}<span className={`results-tier-pill ${c.tier.toLowerCase()}`}>{c.tier}</span></span>
                                <span className="results-proj-cost">₦{c.cost.toLocaleString()}</span>
                                <span className="results-proj-status not-funded">Not funded</span>
                            </li>
                        ))}
                        {!notFunded.length && <li style={{ color: 'var(--fg-tertiary)', fontSize: 12 }}>Every candidate was funded.</li>}
                    </ul>
                </div>
            </div>

            {budgetPriority.groups?.length ? (
                <div className="results-card">
                    <h2>Where To Concentrate Next Round</h2>
                    <p className="sub-h">Rolling every candidate up by group shows which areas have good ideas going unfunded for lack of budget, not lack of merit.</p>
                    <div className="results-group-grid">
                        {budgetPriority.groups.map(g => (
                            <div key={g.group} className={`results-group-card rec-${g.recommendation}`}>
                                <div className="results-group-name">{g.group}</div>
                                <div className={`results-rec-badge ${g.recommendation}`}>{REC_LABEL[g.recommendation] ?? g.recommendation}</div>
                                <div className="results-group-stat">{g.fundedCount}/{g.candidateCount} funded · {g.avgEfficiency.toFixed(2)} impact/cost</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default BudgetingPanel;
