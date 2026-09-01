"use client";

import React from 'react';

interface ExecutiveSummaryCardProps {
    executiveSummary?: string;
    taskExplanation?: string;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ executiveSummary, taskExplanation }) => {
    if (!executiveSummary) return null;
    return (
        <div className="results-card">
            <h2>Executive Summary</h2>
            <p className="body-text">{executiveSummary}</p>
            {taskExplanation && (
                <p className="body-text" style={{ fontStyle: 'italic', color: 'var(--fg-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 14, marginBottom: 0 }}>
                    {taskExplanation}
                </p>
            )}
        </div>
    );
};

export default ExecutiveSummaryCard;
