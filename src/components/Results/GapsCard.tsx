"use client";

import React from 'react';
import { ResultsGaps } from '@/services/resultsService';

export const GapsCard: React.FC<{ gaps?: ResultsGaps }> = ({ gaps }) => {
    if (!gaps) return null;
    const rows: { tag: string; text: string; fail?: boolean }[] = [];
    if (gaps.coverage) rows.push({ tag: 'Coverage', text: gaps.coverage });
    if (gaps.dataTrust) rows.push({ tag: 'Data trust', text: gaps.dataTrust });
    for (const issue of gaps.fairnessIssues ?? []) {
        rows.push({ tag: issue.status === 'fail' ? 'Fairness' : 'Not evaluated', text: `${issue.goal}: ${issue.detail}`, fail: issue.status === 'fail' });
    }
    if (!rows.length) return null;
    return (
        <div className="results-card">
            <h2>Gaps</h2>
            {rows.map((r, i) => (
                <div key={i} className="results-gap-row">
                    <span className={`results-gap-tag${r.fail ? ' fail' : ''}`}>{r.tag}</span>
                    <span className="results-gap-txt">{r.text}</span>
                </div>
            ))}
        </div>
    );
};

export default GapsCard;
