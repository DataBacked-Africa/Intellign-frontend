import bedRaw from './data/bed_assignment.json';
import apptRaw from './data/appointment_scheduling.json';
import wardFallbackRaw from './data/ward_personnel_fallback.json';

export interface MockGoal {
    id: string;
    description: string;
    award_type: 'Reward' | 'Penalty';
    weight: number;
    logic_type: string;
    resource_columns: string[];
    target_columns: string[];
}

export interface MockAssignment {
    assignment_id: string;
    resource: { id: string };
    target: { id: string };
    score: number;
    approval_status: 'approved' | 'pending' | 'rejected' | 'modified';
    notes: string | null;
}

export interface RunMetrics {
    best_fitness: number;
    generations_run: number;
    elapsed_time_seconds: number;
    assigned_count: number;
    total_resources: number;
    total_targets: number;
    quality_label: string;
    coverage_pct: number;
    solution_quality: number;
    solver_used: string;
}

export interface HeliumScenario {
    id: string;
    heliumModule: string;
    domain: string;
    task: string;
    solver: string;
    title: string;
    blurb: string;
    resourceLabel: string;
    targetLabel: string;
    resourceCount: number;
    targetCount: number;
    userPrompt: string;
    goals: MockGoal[];
    assignments: MockAssignment[];
    resources: Record<string, unknown>[];
    targets: Record<string, unknown>[];
    fitnessHistory: number[];
    avgHistory: number[];
    metrics: RunMetrics;
    live: boolean;
    note?: string;
}

interface RawGoal {
    description: string;
    award_type: 'Reward' | 'Penalty';
    weight: number;
    resource_columns?: string[];
    target_columns?: string[];
    logic_config?: { logic_type?: string } | null;
}

interface RawAssignment {
    assignment_id: string;
    resource_id: string;
    target_id: string;
    score: number;
    approval_status: string;
}

export interface RawBundle {
    domain: string;
    resources: Record<string, unknown>[];
    targets: Record<string, unknown>[];
    goals: RawGoal[];
    assignments: RawAssignment[];
    metrics: Record<string, unknown>;
    fitness_history: number[];
    average_history: number[];
    best_fitness: number;
    solver_used: string;
}

export const toGoals = (goals: RawGoal[]): MockGoal[] =>
    goals.map((g, i) => ({
        id: `g${i + 1}`,
        description: g.description,
        award_type: g.award_type,
        weight: g.weight,
        logic_type: g.logic_config?.logic_type ?? 'weighted_scoring',
        resource_columns: g.resource_columns ?? [],
        target_columns: g.target_columns ?? [],
    }));

// The schedule solver reports one overall schedule-quality score (see solver_notes
// in the metrics), not a meaningful per-assignment fit — so per-row "score" is
// flattened to that quality figure rather than showing a misleading 0.000 per row.
export const toAssignments = (assignments: RawAssignment[], flatScoreOverride?: number): MockAssignment[] =>
    assignments.map(a => ({
        assignment_id: a.assignment_id,
        resource: { id: a.resource_id },
        target: { id: a.target_id },
        score: flatScoreOverride ?? a.score,
        approval_status: (a.approval_status as MockAssignment['approval_status']) ?? 'approved',
        notes: null,
    }));

export function bundleToScenario(
    raw: RawBundle,
    extra: Pick<HeliumScenario, 'id' | 'heliumModule' | 'domain' | 'task' | 'title' | 'blurb' | 'resourceLabel' | 'targetLabel' | 'userPrompt' | 'live'> & { note?: string },
): HeliumScenario {
    const m = raw.metrics as unknown as RunMetrics;
    const isSchedule = raw.solver_used === 'schedule';
    return {
        ...extra,
        solver: raw.solver_used === 'ga_vec' ? 'Genetic algorithm' : raw.solver_used === 'schedule' ? 'Schedule solver' : raw.solver_used,
        resourceCount: raw.resources.length,
        targetCount: raw.targets.length,
        goals: toGoals(raw.goals),
        assignments: toAssignments(raw.assignments, isSchedule ? m.solution_quality : undefined),
        resources: raw.resources,
        targets: raw.targets,
        fitnessHistory: raw.fitness_history,
        avgHistory: raw.average_history,
        metrics: m,
        note: extra.note,
    };
}

export const bedAssignmentScenario: HeliumScenario = bundleToScenario(bedRaw as unknown as RawBundle, {
    id: 'bed', heliumModule: 'Bed Management', domain: 'Healthcare', task: 'Assignment',
    title: 'Bed Assignment', blurb: '60 patients → 20 beds by condition, ward type & severity',
    resourceLabel: 'patients', targetLabel: 'beds',
    userPrompt: 'I need to assign admitted patients to hospital beds. Match each patient\'s condition to the right ward type, and prioritise our most severe patients for placement first.',
    live: false,
});

export const appointmentSchedulingScenario: HeliumScenario = bundleToScenario(apptRaw as unknown as RawBundle, {
    id: 'appointment', heliumModule: 'Appointment Scheduling', domain: 'Healthcare', task: 'Scheduling',
    title: 'Appointment Scheduling', blurb: '30 doctors → 8 clinic departments covering a week of patient demand',
    resourceLabel: 'doctors', targetLabel: 'clinic departments',
    userPrompt: 'Schedule our doctors across clinic departments for the week so we cover patient appointment demand. Match each doctor\'s specialty to the department and cover as many appointment slots as possible.',
    live: false,
    note: 'This solver optimises for overall schedule quality and slot coverage (shown above) rather than a single per-assignment score — that\'s why every row shows the same fit figure.',
});

export const wardPersonnelFallbackScenario: HeliumScenario = bundleToScenario(wardFallbackRaw as unknown as RawBundle, {
    id: 'ward', heliumModule: 'Not yet in HeliumOS — new opportunity', domain: 'Healthcare', task: 'Assignment',
    title: 'Ward Personnel Assignment', blurb: '40 staff → 10 wards by specialization & ward acuity — runs live',
    resourceLabel: 'staff', targetLabel: 'wards',
    userPrompt: 'Assign our ward personnel — nurses, doctors, support staff — across hospital wards. Match specialization to what each ward needs, and prioritise our higher-acuity wards.',
    live: true,
});

export const HELIUM_SCENARIOS: HeliumScenario[] = [
    bedAssignmentScenario,
    appointmentSchedulingScenario,
    { ...wardPersonnelFallbackScenario, assignments: [], fitnessHistory: [], avgHistory: [] },
];
