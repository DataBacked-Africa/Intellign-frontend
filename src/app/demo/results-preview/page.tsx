"use client";

/**
 * /demo/results-preview — visual gallery for the new proof/confidence results
 * components (ConfidenceHero, ParetoExplorer), built ahead of the backend
 * contract that will eventually feed them. Renders each with fixture data
 * inside a mock of the real 720px docked panel so it's a faithful preview.
 *
 * Not linked from product nav — dev-only verification aid.
 */

import React from 'react';
import { ConfidenceHero } from '@/components/AI-Components/ConfidenceHero';
import { ParetoExplorer } from '@/components/AI-Components/ParetoExplorer';
import { ParetoFront } from '@/services/resultsService';
import { GoalDefinition } from '@/types/models';

const FIXTURE_GOALS: GoalDefinition[] = [
    { description: 'Skill match', weight: 34, award_type: 'Reward', resource_columns: [], target_columns: [], logic_config: {} },
    { description: 'Prefer far target', weight: 33, award_type: 'Reward', resource_columns: [], target_columns: [], logic_config: {} },
    { description: 'Prefer cheap target', weight: 33, award_type: 'Reward', resource_columns: [], target_columns: [], logic_config: {} },
];

const FIXTURE_PARETO: ParetoFront = {
    population_size: 60,
    options: [
        { option_id: 'E', label: 'E', is_recommended: true, objectives: [
            { goal_description: 'Skill match', value: 5, display: '5 / 6' },
            { goal_description: 'Prefer far target', value: 8.281, display: '8.281' },
            { goal_description: 'Prefer cheap target', value: 5.89, display: '5.89' },
        ]},
        { option_id: 'A', label: 'A', objectives: [
            { goal_description: 'Skill match', value: 6, display: '6 / 6' },
            { goal_description: 'Prefer far target', value: 8.210, display: '8.210' },
            { goal_description: 'Prefer cheap target', value: 6.00, display: '6.00' },
        ]},
        { option_id: 'B', label: 'B', objectives: [
            { goal_description: 'Skill match', value: 6, display: '6 / 6' },
            { goal_description: 'Prefer far target', value: 8.223, display: '8.223' },
            { goal_description: 'Prefer cheap target', value: 5.89, display: '5.89' },
        ]},
        { option_id: 'H', label: 'H', objectives: [
            { goal_description: 'Skill match', value: 6, display: '6 / 6' },
            { goal_description: 'Prefer far target', value: 8.190, display: '8.190' },
            { goal_description: 'Prefer cheap target', value: 5.75, display: '5.75' },
        ]},
        { option_id: 'J', label: 'J', objectives: [
            { goal_description: 'Skill match', value: 1, display: '1 / 6' },
            { goal_description: 'Prefer far target', value: 8.470, display: '8.470' },
            { goal_description: 'Prefer cheap target', value: 6.00, display: '6.00' },
        ]},
    ],
};

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ width: 'min(720px, 92vw)', margin: '0 auto 40px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-tertiary)', margin: '0 0 8px' }}>{title}</p>
        <div style={{ background: 'var(--neutral-0)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
            {children}
        </div>
    </div>
);

export default function ResultsPreviewPage() {
    return (
        <div style={{ padding: '40px 16px', background: 'var(--neutral-50)', minHeight: '100dvh' }}>
            <Panel title="Confidence hero — proven">
                <ConfidenceHero qualityState="proven" gapPercentage={0} solverBadge="highs" elapsedSeconds={30.5} />
            </Panel>
            <Panel title="Confidence hero — within gap">
                <ConfidenceHero qualityState="within_gap" gapPercentage={8.5} solverBadge="highs_routing_proof" elapsedSeconds={30} />
            </Panel>
            <Panel title="Confidence hero — best found, not proven (fallback state — no quality_state field)">
                <ConfidenceHero solverBadge="ga" elapsedSeconds={30} />
            </Panel>
            <Panel title="Pareto trade-off explorer">
                <ParetoExplorer jobId="demo-job" data={FIXTURE_PARETO} goals={FIXTURE_GOALS} />
            </Panel>
        </div>
    );
}
