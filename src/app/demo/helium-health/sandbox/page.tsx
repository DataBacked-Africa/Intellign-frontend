"use client";

/**
 * /demo/helium-health/sandbox — the concrete integration proof point.
 * Shows: the exact code a HeliumOS engineer would write, the sample data
 * it sends, and (on click) the real solved result from our live backend —
 * proxied through our own server so the sandbox key never reaches the browser.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { T, AssignmentsTable, CodeBlock, type SimpleAssignment } from '../shared';

const SAMPLE_PAYLOAD = {
    problem_type: 'assignment',
    resources: [
        { id: 'PT-1042', name: 'Adaeze N.', required_ward_type: 'ICU', severity: 9 },
        { id: 'PT-1043', name: 'Bello M.', required_ward_type: 'General Ward', severity: 4 },
        { id: 'PT-1044', name: 'Chinwe O.', required_ward_type: 'Maternity', severity: 6 },
        { id: 'PT-1045', name: 'Dauda K.', required_ward_type: 'ICU', severity: 8 },
        { id: 'PT-1046', name: 'Efe I.', required_ward_type: 'General Ward', severity: 3 },
        { id: 'PT-1047', name: 'Fola A.', required_ward_type: 'Paediatrics', severity: 5 },
    ],
    targets: [
        { id: 'BED-A1', ward_name: 'ICU Bay 1', ward_type: 'ICU', capacity: 2 },
        { id: 'BED-B4', ward_name: 'General Ward B', ward_type: 'General Ward', capacity: 2 },
        { id: 'BED-M2', ward_name: 'Maternity Wing', ward_type: 'Maternity', capacity: 1 },
        { id: 'BED-P1', ward_name: 'Paediatric Ward', ward_type: 'Paediatrics', capacity: 1 },
    ],
    goals: [
        {
            description: 'Match patient condition to ward type.',
            resource_columns: ['required_ward_type'], target_columns: ['ward_type'],
            logic_config: { logic_type: 'categorical_match', exact_match: true },
            weight: 60, award_type: 'Reward',
        },
        {
            description: 'Prioritise higher-severity patients for placement.',
            resource_columns: ['severity'], target_columns: [],
            logic_config: { logic_type: 'weighted_scoring' },
            weight: 40, award_type: 'Reward',
        },
    ],
    quality_mode: 'fast',
};

const CURL_SAMPLE = `curl -X POST https://api.intellign.ai/api/v1/optimize \\
  -H "Authorization: ApiKey <your-sandbox-key>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(SAMPLE_PAYLOAD, null, 2).split('\n').join('\n  ')}'`;

interface OptimizeResult {
    job_id: string;
    status: string;
    assignments: SimpleAssignment[];
    metrics: { quality_label: string; coverage_pct: number; assigned_count: number; best_fitness: number; solver_used: string };
    best_fitness: number;
    solver_used: string;
}

export default function HeliumSandboxPage() {
    const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [result, setResult] = useState<OptimizeResult | null>(null);
    const [error, setError] = useState<string>('');

    const run = async () => {
        setState('loading');
        setError('');
        try {
            const res = await fetch('/api/helium-sandbox/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(SAMPLE_PAYLOAD),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.detail ? JSON.stringify(data.detail) : `HTTP ${res.status}`);
            setResult(data);
            setState('done');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Request failed');
            setState('error');
        }
    };

    return (
        <div data-theme="light" style={{ minHeight: '100dvh', width: '100%', background: T.bone, fontFamily: 'var(--font-sans)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', background: T.maroonDeep, color: T.bone, fontSize: 12.5, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>Integration sandbox</span>
                <span>What integrating Intellign into HeliumOS actually looks like.</span>
                <Link href="/demo/helium-health" style={{ marginLeft: 'auto', color: T.bone, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    <ArrowLeft size={13} /> Back to demos
                </Link>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: T.ink, margin: '0 0 6px' }}>One endpoint: <code style={{ fontFamily: 'var(--font-mono)' }}>POST /api/v1/optimize</code></h1>
                    <p style={{ fontSize: 13.5, color: T.neutral600, lineHeight: 1.5, margin: 0 }}>
                        HeliumOS&rsquo;s backend sends its own patient and bed records plus the goals it cares about &mdash; no chat,
                        no manual review workflow, no data leaving their format. We solve it and hand back assignments.
                    </p>
                </div>

                <div>
                    <h3 style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>The call</h3>
                    <CodeBlock code={CURL_SAMPLE} />
                </div>

                <div>
                    <h3 style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Sample data &mdash; 6 patients, 4 beds
                    </h3>
                    <p style={{ fontSize: 12.5, color: T.neutral600, margin: '0 0 10px' }}>
                        This is the exact payload the button below sends &mdash; real patient IDs, ward types, and severity scores,
                        shaped like a real HeliumOS export.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.neutral500, marginBottom: 6 }}>Resources (patients)</div>
                            {SAMPLE_PAYLOAD.resources.map(r => (
                                <div key={r.id} style={{ fontSize: 12, color: T.neutral700, padding: '3px 0' }}>
                                    <b>{r.id}</b> &middot; {r.name} &middot; {r.required_ward_type} &middot; sev {r.severity}
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.neutral500, marginBottom: 6 }}>Targets (beds)</div>
                            {SAMPLE_PAYLOAD.targets.map(t => (
                                <div key={t.id} style={{ fontSize: 12, color: T.neutral700, padding: '3px 0' }}>
                                    <b>{t.id}</b> &middot; {t.ward_name} &middot; {t.ward_type} &middot; cap {t.capacity}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '14px 16px', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={run} disabled={state === 'loading'}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: T.maroon, color: T.bone, border: 0, borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: state === 'loading' ? 'default' : 'pointer', opacity: state === 'loading' ? 0.7 : 1 }}>
                        {state === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill={T.bone} />}
                        {state === 'loading' ? 'Calling /api/v1/optimize…' : result ? 'Run again' : 'Send this request'}
                    </button>
                    <span style={{ fontSize: 12, color: T.neutral500 }}>
                        {state === 'error' ? `Request failed: ${error}` : 'Hits our real backend with a real sandbox key — solved in under a second.'}
                    </span>
                </div>

                {result && (
                    <div>
                        <h3 style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Result &mdash; {result.metrics.quality_label}, {result.metrics.coverage_pct}% coverage, solved by {result.solver_used}
                        </h3>
                        <AssignmentsTable assignments={result.assignments} />
                    </div>
                )}

                <div style={{ padding: '14px 16px', background: 'rgba(92,20,39,0.05)', border: `1px solid rgba(92,20,39,0.15)`, borderRadius: 10, fontSize: 12.5, color: T.neutral700, display: 'flex', gap: 8 }}>
                    <CheckCircle2 size={16} style={{ color: T.maroon, flexShrink: 0, marginTop: 1 }} />
                    <span>
                        Their production data never leaves their infrastructure until this call &mdash; no upload step, no storage on our
                        side beyond the run itself. Goals are configured once and reused, not re-typed per request.
                    </span>
                </div>
            </div>
        </div>
    );
}
