export interface LogicConfig {
    logic_type: string;
    aggregation_method?: string | null;
    comparison_column?: string | null;
    threshold_value?: number | null;
    numeric_operator?: string;
    mapping_rules?: Record<string, string[]> | null;
    exact_match?: boolean;
    max_distance_value?: number | null;
    distance_unit?: string;
    minimize_distance?: boolean;
    set_operation?: string | null;
    min_intersection_size?: number;
    time_unit?: string;
    buffer_time?: number;
    scoring_rules?: Record<string, number> | null;
    value_splitter?: string | null;
}

export interface GoalDefinitionPayload {
    [goalId: string]: {
        id: string;
        description: string;
        resource_columns: string[];
        target_columns: string[];
        logic_config: LogicConfig;
        weight: number;
        award_type: 'Reward' | 'Penalty';
        logic_primitive: string | null;
    };
}

export interface ColumnMetadata {
    column_name: string;
    data_type: string;
    is_nullable: boolean;
    unique_values_count?: number | null;
    sample_values: any[];
    min_value?: number | null;
    max_value?: number | null;
}

export interface DatasetMetadata {
    count: number;
    columns: string[];
    preview?: any[];
    type?: string;
}

export interface FileMetadata {
    url?: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    size?: number;
}

export interface OptimizationResult {
    job_id?: string;
    session_id?: string;
    status?: string;
    optimization_status?: string;
    metrics?: {
        total_resources?: number;
        total_targets?: number;
        assigned_targets?: number;
        unassigned_targets?: number;
        average_distance?: number;
        max_distance?: number;
        min_distance?: number;
        average_targets_per_resource?: number;
        workload_std_dev?: number;
        total_fitness_score?: number;
        best_fitness?: number;
        assigned_count?: number;
        generations_run?: number;
        population_size?: number;
        elapsed_time_seconds?: number;
        average_final_fitness?: number;
    };
    status_counts?: {
        pending: number;
        approved: number;
        rejected: number;
        modified: number;
    };
    assignments?: any[];
    pagination?: {
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
    };
    fitness_history?: number[];
    average_history?: number[];
    created_at?: string;
    ingestion?: {
        status: string;
        session_id: string;
        resources_metadata?: DatasetMetadata;
        targets_metadata?: DatasetMetadata;
    };
    resources_metadata?: DatasetMetadata;
    targets_metadata?: DatasetMetadata;
}

export interface ChatShared {
    messages: any[];
    dataContext: any | null;
    isGenerating: boolean;
    solverConfig: Record<string, any> | null;
    latestJobId: string | null;
    artifactCount: number;
    phaseUiHint: 'chat' | 'optimization_card' | 'running' | 'results' | null;
    goals: any[];
    readyToRun: boolean;
}

export interface GoalDefinition {
    description: string;
    weight: number;
    award_type: 'Reward' | 'Penalty';
    resource_columns: string[];
    target_columns: string[];
    logic_config: Record<string, any>;
    explanation?: string;
}

export interface GAParams {
    population_size: number;
    generations: number;
    mutation_rate: number;
    selection_method: string;
}

export interface GoalModel {
    problem_type: string | null;
    confidence: number;
    entities: {
        resources?: { name: string };
        targets?: { name: string };
    };
    objectives: string[];
    constraints: string[];
    estimated_scale: string | null;
    description: string | null;
}

export interface DataContext {
    status: 'none' | 'partial' | 'complete';
    resources_metadata: { count: number; columns: string[] } | null;
    targets_metadata: { count: number; columns: string[] } | null;
    missing_tables: string[];
    missing_columns: Record<string, any>;
    synthetic_flags: Record<string, any>;
}

export interface Artifact {
    type: 'table' | string;
    content: string;
    headers?: string[];
    rows?: string[][];
    title?: string;
}
