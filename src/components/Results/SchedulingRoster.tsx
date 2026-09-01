"use client";

import React from 'react';
import { ScheduleTable } from '@/services/resultsService';

/**
 * Flexible resource → shift-label list, NOT a fixed Day×Period grid — the
 * real `shifts` values are free text (e.g. "Monday AM"), not guaranteed to
 * decompose into clean day/period columns.
 */
export const SchedulingRoster: React.FC<{ scheduleTable?: ScheduleTable | null }> = ({ scheduleTable }) => {
    if (!scheduleTable?.rows?.length) return null;
    return (
        <div className="results-card">
            <h2>Shift Roster</h2>
            <p className="sub-h">Who works which shift.</p>
            <div className="results-roster">
                {scheduleTable.rows.map(row => (
                    <div key={row.resource} className="results-roster-row">
                        <div className="results-roster-name">{row.resource}</div>
                        <div className="results-roster-shifts">
                            {row.shifts.length
                                ? row.shifts.map((s, i) => <span key={i} className="results-name-chip">{s}</span>)
                                : <span className="results-empty-note">No shifts assigned</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SchedulingRoster;
