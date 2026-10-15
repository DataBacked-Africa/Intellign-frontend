export type Stage = 'idle' | 'ingest' | 'translate' | 'init' | 'solve' | 'converge' | 'explain' | 'done';
export type TabId = 'monitor' | 'results' | 'assignments' | 'goals' | 'config' | 'datasets';

export interface Stat { lbl: string; val: string }

export interface Step {
  id: string;
  title: string;
  stage: Stage;
  tab: TabId;
  durationMs: number;
  user?: string;
  assistant: string;
  action?: string;
  chips?: string[];
  stats: Stat[];
}

export interface Goal { id: string; description: string; award_type: 'Reward' | 'Penalty'; logic: string }
export interface TimelineEntry { stage: Stage; label: string; sub: string }
export interface Bar { label: string; value: number | null; note?: string }
export interface ResultCard { lbl: string; val: string; sub?: string; hi?: boolean }
export interface CompareRow { label: string; a: string; b: string; source: string }
export interface VersionEntry { id: string; name: string; did: string; exposed: string; source: string }

export interface SampleAssignment {
  assignmentId: string;
  graduateId: string;
  specialization: string;
  facilityName: string;
  state: string;
  centreSpecialization: string;
  diseases: string;
  skillMatch: boolean;
  openSlotsBefore: number;
  overCapacity: boolean;
  rationale: string;
}

export interface NyscBundle {
  meta: {
    title: string;
    blurb: string;
    banner: string;
    replayLabel: string;
    sampleLabel: string;
    confidentialBanner: string;
    resourceLabel: string;
    targetLabel: string;
    resourceCount: number;
    targetCount: number;
    solver: string;
  };
  evolution: VersionEntry[];
  mechanism: string[];
  limits: string[];
  goals: Goal[];
  timeline: TimelineEntry[];
  batches: Bar[];
  cleanup: Bar[];
  batchSource: string;
  cleanupSource: string;
  compare: { head: [string, string]; rows: CompareRow[] };
  results: ResultCard[];
  runStructure: { lbl: string; val: string }[];
  steps: Step[];
  sample: SampleAssignment[];
}
