export interface DemoAssignment {
    assignment_id: string;
    resource_id: string;
    target_id: string;
    score: number;
    approval_status: string;
    rationale?: string | null;
    notes?: string | null;
}

export interface DemoMetrics {
    total_resources: number;
    total_targets: number;
    assigned_count: number;
    quality_label: string;
    avg_fit_pct: number | null;
    assigned_targets: number;
    unassigned_targets: number;
    coverage_pct: number;
    solution_quality: number;
    best_fitness: number;
    generations_run: number;
    elapsed_time_seconds: number;
    solver_used: string;
    degraded: boolean;
}

export interface DemoGoal {
    id: string;
    description: string;
    award_type: 'Reward' | 'Penalty';
    weight: number;
    logic_config?: { logic_type: string } | null;
}

export interface DemoBundle {
    domain: string;
    resources: Record<string, unknown>[];
    targets: Record<string, unknown>[];
    goals: DemoGoal[];
    assignments: DemoAssignment[];
    metrics: DemoMetrics;
    fitness_history: number[];
    average_history: number[];
    best_fitness: number;
    solver_used: string;
}
