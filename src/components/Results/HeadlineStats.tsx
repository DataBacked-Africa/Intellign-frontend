"use client";

import React from 'react';
import { ResultsHeadlineItem } from '@/services/resultsService';

export const HeadlineStats: React.FC<{ headline?: ResultsHeadlineItem[] }> = ({ headline }) => {
    if (!headline?.length) return null;
    return (
        <div className="results-stat-row">
            {headline.map((h, i) => (
                <div key={`${h.label}-${i}`} className="results-stat-card">
                    <div className="lbl">{h.label}</div>
                    <div className="val">{h.value}</div>
                    {h.sub && <div className="sub">{h.sub}</div>}
                </div>
            ))}
        </div>
    );
};

export default HeadlineStats;
