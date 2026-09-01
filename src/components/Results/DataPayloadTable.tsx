"use client";

import React from 'react';
import { ResultsPayload } from '@/services/resultsService';

export const DataPayloadTable: React.FC<{ payload?: ResultsPayload }> = ({ payload }) => {
    if (!payload?.columns?.length || !payload.rows) return null;
    return (
        <div className="results-card">
            <h2>The Data</h2>
            <p className="sub-h">Every goal-referenced column, straight from your dataset.</p>
            <div className="results-tbl-wrap">
                <table className="results-data-tbl">
                    <thead>
                        <tr>
                            {payload.columns.map(c => <th key={c.key}>{c.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {payload.rows.map((row, i) => (
                            <tr key={i}>
                                {payload.columns.map(c => <td key={c.key}>{String(row[c.key] ?? '—')}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataPayloadTable;
