"use client";

import React from 'react';

const CheckIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

export const RationaleCard: React.FC<{ rationale?: string[]; title?: string }> = ({ rationale, title = 'Why This Result' }) => {
    if (!rationale?.length) return null;
    return (
        <div className="results-card">
            <h2>{title}</h2>
            <div className="results-why-list">
                {rationale.map((line, i) => (
                    <div key={i} className="results-why-item">
                        <CheckIcon />
                        <span>{line}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RationaleCard;
