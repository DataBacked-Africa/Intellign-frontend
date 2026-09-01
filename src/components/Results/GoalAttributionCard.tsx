"use client";

import React from 'react';
import { GoalAttribution } from '@/services/resultsService';

export const GoalAttributionCard: React.FC<{ goalAttribution?: GoalAttribution }> = ({ goalAttribution }) => {
    if (!goalAttribution?.goals?.length) return null;
    return (
        <div className="results-card">
            <h2>Why Each Goal Mattered</h2>
            <p className="sub-h">Which of your stated goals actually drove this result.</p>
            {goalAttribution.goals.map((g, i) => {
                // isGlobalModifier goals (capacity caps, shift penalties) show
                // rawValueStdev: 0 by design — that is NOT dead weight. Only
                // isDeadWeight (which already excludes global modifiers) is.
                const showDead = g.isDeadWeight && !g.isGlobalModifier;
                return (
                    <div key={`${g.description}-${i}`} className="results-attrib-row">
                        <div className="results-attrib-desc">
                            {g.description}
                            {showDead && <span className="dead">Dead weight</span>}
                        </div>
                        <div className="results-attrib-bar-track">
                            <div className="results-attrib-bar-fill" style={{ width: `${Math.min(100, Math.max(0, g.contributionSharePct))}%` }} />
                        </div>
                        <div className="results-attrib-pct">{g.contributionSharePct.toFixed(0)}%</div>
                    </div>
                );
            })}
        </div>
    );
};

export default GoalAttributionCard;
