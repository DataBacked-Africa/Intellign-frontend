# NYSC Deployment Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an overview page, a step-by-step workspace replay page, and a single-file offline HTML export of the recorded NYSC deployment run, for a grant and government-partner application.

**Architecture:** One data bundle (`nysc-run.json` plus a generated `sample-assignments.json`) feeds one inline-styled React replay component. Two Next routes render it. An esbuild script bundles the same component and data into one offline HTML file. Node scripts (no new test framework) verify the data against the disclosure and check the export.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Node 24 scripts (`.mjs`), esbuild (new dev dependency, installed with npm because `package-lock.json` is the newer lockfile).

**Spec:** `docs/superpowers/specs/2026-10-02-nysc-deployment-demo-design.md`

## Global Constraints

- All headline numbers come from the invention disclosure (`intellign/docs/patent/Intellign_Invention_Disclosure_First_Draft.docx`), never from `paper/experiments/run_log.txt` (a different run: 42.5% baseline, R² 0.536).
- Mechanism is plain language only: no equations, objective weights, feature lists, seeding recipe, repair rule or training parameters anywhere (page, replay, export, data JSON).
- Replay is labeled "Recorded run replay, not a live solve" at all times; the assignment table is labeled "Illustrative sample".
- v4 is never presented as improving skill match over v3 (both 409 of 500, 81.8%).
- `NyscReplay.tsx` uses inline styles only and imports nothing from `next/*`, `@/*`, or framer-motion, so it bundles with esbuild unchanged.
- Export is written to `exports/` (git-ignored), never under `public/`. No sitemap entry. Routes carry `robots: noindex, nofollow`.
- Do not commit unless the owner asks. Steps end in a verification, not a commit.
- Video work (`/brag --voice` trailer and the full walkthrough) is out of scope here; each gets its own spec and plan.

## Review Focus

- Batch 5 has no recorded best (`null`): it must render "not recorded", never 0, NaN or an empty bar. Pinned in Task 1 (verify script) and Task 3 (render).
- Narrow phone-width viewport: chat and canvas must wrap, not clip or overlap. Pinned in Task 3 browser check.
- `prefers-reduced-motion: reduce`: no autoplay; steps advance only on click. Pinned in Task 3.
- Export opened from `file://` with no network: no external script, link or import. Pinned in Task 5 (verify-export script).
- Search engines: `noindex` present on both routes and no sitemap entry. Pinned in Task 4.

## File Structure

```
src/app/demo/nysc-deployment/
  layout.tsx                 noindex metadata for both routes
  page.tsx                   overview (server component)
  workspace/page.tsx         client wrapper for the replay
  NyscReplay.tsx             replay component (client, inline styles)
  tokens.ts                  colour/font constants, no directive
  data/types.ts              NyscBundle and related types
  data/nysc-run.json         numbers, steps, evolution, mechanism, limits
  data/sample-assignments.json   generated, illustrative
  data/bundle.ts             combines the two JSON files into NyscBundle
scripts/
  verify-nysc-data.mjs       checks JSON against disclosure literals
  build-nysc-sample.mjs      deterministic sample generator
  nysc-export-entry.tsx      browser entry for the export bundle
  export-nysc-demo.mjs       esbuild -> exports/*.html
  verify-nysc-export.mjs     checks the exported HTML
exports/                     git-ignored output
```

---

### Task 1: Types, data bundle, and the data verifier

**Files:**
- Create: `src/app/demo/nysc-deployment/data/types.ts`
- Create: `src/app/demo/nysc-deployment/data/nysc-run.json`
- Create: `scripts/verify-nysc-data.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `NyscBundle`, `Step`, `Panel`, `SampleAssignment`, `VersionEntry` (types.ts); `nysc-run.json` shape = `Omit<NyscBundle, 'sample'>`; `npm run verify:nysc`.

- [ ] **Step 1: Write the failing verifier**

`scripts/verify-nysc-data.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'src/app/demo/nysc-deployment/data');
const runPath = resolve(dir, 'nysc-run.json');
assert.ok(existsSync(runPath), 'nysc-run.json missing');
const run = JSON.parse(readFileSync(runPath, 'utf8'));
const text = JSON.stringify(run);

// Literals that must appear, each copied from the disclosure (section 5, 12.1, 12.2).
const REQUIRED = [
  '500', '750', '44,915', '146', '91',
  '74,915', '59,932', '14,983', '0.7818', '61.57',
  '63,920', '423', '1,915',
  '67,195', '69,850', '65,640', '94', '66',
  '409 of 500 (81.8%)', '372', '1,826', '2,531',
];
for (const lit of REQUIRED) assert.ok(text.includes(lit), `missing disclosure literal: ${lit}`);

// Content that must never appear: mechanism internals and the other run's numbers.
const FORBIDDEN = [
  /\b(alpha|beta|gamma|delta|epsilon)\b/i,
  /1,000,000/, /random forest/i, /\b300 trees\b/i, /\b75,000\b/, /roulette/i, /crossover/i,
  /\b42\.5\b/, /\b0\.536\b/,
];
for (const re of FORBIDDEN) assert.ok(!re.test(text), `forbidden content matched: ${re}`);

// Structure.
assert.equal(run.steps.length, 8, 'expected 8 replay steps');
const batches = run.steps.find((s) => s.id === 'batches');
assert.ok(batches, 'batches step missing');
const items = batches.panel.items;
assert.equal(items.length, 5, 'expected 5 batches');
assert.deepEqual(items.slice(0, 4).map((i) => i.value), [16405, 15985, 14350, 13155]);
assert.equal(items[4].value, null, 'batch 5 must be null (not recorded)');
for (const s of run.steps) {
  assert.ok(s.title && s.chat && s.durationMs > 0, `step ${s.id} incomplete`);
}
assert.equal(run.mechanism.length, 4, 'mechanism must be exactly four plain sentences');

// Sample file, if generated.
const samplePath = resolve(dir, 'sample-assignments.json');
if (existsSync(samplePath)) {
  const sample = JSON.parse(readFileSync(samplePath, 'utf8'));
  assert.equal(sample.length, 40, 'expected 40 sample rows');
  assert.ok(sample.every((r) => r.overCapacity === false), 'sample must have no over-capacity rows');
  assert.equal(new Set(sample.map((r) => r.graduateId)).size, 40, 'duplicate graduate in sample');
}
console.log('verify-nysc-data: ok');
```

Add to `package.json` `scripts`: `"verify:nysc": "node scripts/verify-nysc-data.mjs"`.

Note: the batch-best literals (16,405 and so on) are asserted numerically via `deepEqual`, and `63,340` is deliberately not required because the replay only uses the stated v3 final (63,920).

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run verify:nysc`
Expected: FAIL with `nysc-run.json missing`.

- [ ] **Step 3: Write `data/types.ts`**

```ts
export interface SourcedRow { label: string; value: string; source: string }

export type Panel =
  | { kind: 'goals'; goals: string[] }
  | { kind: 'facts'; rows: SourcedRow[] }
  | { kind: 'bars'; title: string; items: { label: string; value: number | null; note?: string }[]; source: string }
  | { kind: 'compare'; head: [string, string]; rows: { label: string; a: string; b: string; source: string }[] }
  | { kind: 'sample' };

export interface Step { id: string; title: string; durationMs: number; chat: string; panel: Panel }

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
  meta: { title: string; subtitle: string; replayLabel: string; sampleLabel: string; confidentialBanner: string };
  evolution: VersionEntry[];
  mechanism: string[];
  limits: string[];
  steps: Step[];
  sample: SampleAssignment[];
}
```

- [ ] **Step 4: Write `data/nysc-run.json`**

```json
{
  "meta": {
    "title": "Strategic deployment of NYSC healthcare graduates",
    "subtitle": "How the Intellign engine assigned 500 graduates across 750 primary health facilities, step by step",
    "replayLabel": "Recorded run replay, not a live solve",
    "sampleLabel": "Illustrative sample: produced by a script over real facility and graduate rows, not output of the recorded run",
    "confidentialBanner": "Confidential. Supporting document for an application. Do not redistribute."
  },
  "evolution": [
    { "id": "v1", "name": "Genetic algorithm heuristic", "did": "Random starting plans scored on skill-match reward minus overload and mismatch penalties; improved by selection, crossover and mutation.", "exposed": "Random starts wasted generations on overloaded, mismatched plans.", "source": "Disclosure section 5" },
    { "id": "v2", "name": "Version 2", "did": "Greedy starting plans, plus a classifier that labelled assignments Good or Poor for repair.", "exposed": "The classifier memorized hand-written rules (100% accuracy) and its repairs fought the search. Greedy starts left 146 overloads and 91 mismatches.", "source": "Disclosure section 5" },
    { "id": "v3", "name": "Version 3", "did": "A model trained on the search's own score predicts how good a single move is; mixed starting population; changes kept only if the real score improves.", "exposed": "No way to carry decisions already made.", "source": "Disclosure section 5" },
    { "id": "v4", "name": "Version 4", "did": "Decisions already made stay fixed; the 500 graduates are placed in five ordered batches; final passes fill empty facilities and clear over-capacity ones.", "exposed": "The need to measure and verify outcomes, which became the Intellign platform layer.", "source": "Disclosure section 5" },
    { "id": "platform", "name": "Intellign platform (2026)", "did": "Plain-language front end, gated pipeline, checks before and after solving, several solvers.", "exposed": "Current embodiment. 2,531 backend tests passed; contract pipeline replayed over 91 cached live sessions.", "source": "Disclosure sections 5 and 12.1" }
  ],
  "mechanism": [
    "The engine searches many possible deployments and keeps improving the best ones.",
    "A learned model predicts whether moving one graduate to a different facility would make the plan better, so the search spends less time on bad moves.",
    "Placements already decided stay fixed while the rest are solved in batches, so a reviewer can pin a person to a site and everything else adapts.",
    "A final check recomputes the real score and keeps a change only if it helps, then removes anyone assigned to an over-capacity facility."
  ],
  "limits": [
    "The graduate records are generated, and facility capacity, staffing, specialization and disease fields are augmented.",
    "The learned model's contribution has not been isolated by an ablation, and no timing comparison against exact move scoring has been recorded.",
    "During the version 4 run, model-guided repairs inside the search were rare (zero or one per batch).",
    "The version 4 model evaluation output was not retained; the model figures shown are from the version 3 run.",
    "Version 4 matches version 3 on skill match (409 of 500). Its recorded gain is structural: fixed decisions, staged batches, and no assigned graduate placed in an over-capacity facility."
  ],
  "steps": [
    {
      "id": "prompt", "title": "The request", "durationMs": 5000,
      "chat": "Deploy 500 NYSC healthcare graduates to primary health centres across Nigeria. Match each graduate's specialization to what the facility needs, prioritise facilities with a serious disease burden, and never overload a facility.",
      "panel": { "kind": "goals", "goals": ["Match specialization to facility need", "Prioritise facilities with critical disease burden", "Respect facility personnel capacity"] }
    },
    {
      "id": "data", "title": "Data validated", "durationMs": 5000,
      "chat": "Checked both tables. 500 graduates and 750 facilities are ready.",
      "panel": { "kind": "facts", "rows": [
        { "label": "Graduates", "value": "500 generated records", "source": "Disclosure section 12.2" },
        { "label": "Facilities", "value": "750 sampled from 44,915 (GRID3 Nigeria, fixed random seed)", "source": "Disclosure section 12.2" },
        { "label": "Augmented fields", "value": "Facility capacity, staffing, specialization and disease fields", "source": "Disclosure section 12.2" }
      ] }
    },
    {
      "id": "goals", "title": "Goals compiled", "durationMs": 5000,
      "chat": "Your goals are now a scoring function the engine can evaluate for any possible plan.",
      "panel": { "kind": "facts", "rows": [
        { "label": "Reward", "value": "Graduate's specialization is accepted by the facility", "source": "Disclosure section 7.1" },
        { "label": "Reward", "value": "Facility has a high staffing gap and disease burden", "source": "Disclosure section 7.1" },
        { "label": "Reward", "value": "Facility receives at least one graduate", "source": "Disclosure section 7.1" },
        { "label": "Penalty", "value": "Facility staffed beyond its capacity", "source": "Disclosure section 7.1" },
        { "label": "Penalty", "value": "Graduate placed where their specialization is not accepted", "source": "Disclosure section 7.1" }
      ] }
    },
    {
      "id": "solver", "title": "Engine routed, move model trained", "durationMs": 6000,
      "chat": "Routed to the evolutionary engine. First it learns how good a single move is.",
      "panel": { "kind": "facts", "rows": [
        { "label": "Training examples", "value": "74,915 valid moves (59,932 train, 14,983 test)", "source": "Disclosure section 12.2, version 3 run" },
        { "label": "Fit on held-out moves", "value": "R² 0.7818, RMSE 61.57", "source": "Disclosure section 12.2, version 3 run; version 4 evaluation not retained" }
      ] }
    },
    {
      "id": "batches", "title": "Five ordered batches, earlier decisions locked", "durationMs": 7000,
      "chat": "Placing 100 graduates at a time. Each batch treats all earlier placements as fixed.",
      "panel": { "kind": "bars", "title": "Best fitness reached in each batch", "source": "Disclosure section 12.2. Batches stopped early at generations 11 to 13.", "items": [
        { "label": "Batch 1", "value": 16405 },
        { "label": "Batch 2", "value": 15985 },
        { "label": "Batch 3", "value": 14350 },
        { "label": "Batch 4", "value": 13155 },
        { "label": "Batch 5", "value": null, "note": "not recorded" }
      ] }
    },
    {
      "id": "post", "title": "Verified clean-up passes", "durationMs": 7000,
      "chat": "Filled empty facilities, then moved graduates out of over-capacity ones. Every change is kept only if the real score allows it.",
      "panel": { "kind": "bars", "title": "Fitness through the clean-up passes", "source": "Disclosure section 12.2. 94 empty facilities filled; 66 graduates moved out of over-capacity facilities and 2 mismatches fixed. The source does not break out the drop in the final pass.", "items": [
        { "label": "Before filling empty facilities", "value": 67195 },
        { "label": "After filling (kept)", "value": 69850 },
        { "label": "Final, after capacity correction", "value": 65640 }
      ] }
    },
    {
      "id": "verify", "title": "Result, version 3 and version 4", "durationMs": 8000,
      "chat": "Checked the finished plan against the data.",
      "panel": { "kind": "compare", "head": ["Version 3", "Version 4"], "rows": [
        { "label": "Skill match", "a": "409 of 500 (81.8%)", "b": "409 of 500 (81.8%)", "source": "Disclosure section 12.2" },
        { "label": "Facilities over capacity", "a": "423", "b": "372", "source": "Disclosure section 12.2" },
        { "label": "Total excess staff", "a": "1,915", "b": "1,826", "source": "Disclosure section 12.2" },
        { "label": "Cause of over-capacity", "a": "not reported", "b": "all from staff already there; no assigned graduate placed in them", "source": "Disclosure section 12.2" },
        { "label": "Final fitness", "a": "63,920", "b": "65,640", "source": "Disclosure section 12.2" }
      ] }
    },
    {
      "id": "sample", "title": "Assignment trace", "durationMs": 9000,
      "chat": "Here is how individual graduates are matched, with the reason for each.",
      "panel": { "kind": "sample" }
    }
  ]
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npm run verify:nysc`
Expected: `verify-nysc-data: ok`

---

### Task 2: Deterministic sample-assignment generator

**Files:**
- Create: `scripts/build-nysc-sample.mjs`
- Create (generated): `src/app/demo/nysc-deployment/data/sample-assignments.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: CSVs `generated_nysc_healthcare_graduates.csv` (columns `id_number,specialization,...`) and `primary_facilities.csv` (columns `facility_name,state,personnel_capacity,no_of_doctors,no_of_nurses,no_of_pharmacists,no_of_other_staff,centre_specialization,prevalent_diseases`) from `$NYSC_DATA_DIR` (default `../intellign/data`).
- Produces: `sample-assignments.json` = `SampleAssignment[]` (40 rows, Task 1 type); `npm run build:nysc-sample`.

The skill-match map and disease weights are ported from `intellign/archive/assignment_engine_v4.py` lines 74 to 150. In the Python dict, later duplicate keys (`Immunization`, `Maternal and Child Health`) override earlier ones; the port uses the final values.

- [ ] **Step 1: Run the generator before it exists**

Run: `node scripts/build-nysc-sample.mjs`
Expected: FAIL `Cannot find module`.

- [ ] **Step 2: Write the generator**

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.NYSC_DATA_DIR ?? resolve(here, '../../intellign/data');
const OUT = resolve(here, '../src/app/demo/nysc-deployment/data/sample-assignments.json');
const SEED = 42;
const N_GRADUATES = 40;
const N_FACILITIES = 60;

// Port of specialization_mapping, final values (v4 engine lines 74-110).
const ACCEPTS = {
  'General Practice': ['General Medicine', 'Dentistry', 'Pharmacology', 'Medical Laboratory Science', 'Community Health', 'Nursing', 'Medical Biochemistry', 'Medical Microbiology', 'Clinical Biochemistry', 'Haematology', 'Parasitology', 'Psychiatric Nursing', 'Medical Surgical Nursing', 'Public Health', 'Environmental Health', 'Health Promotion', 'Primary Health Care', 'Geriatric Nursing'],
  'Immunization': ['Community Health', 'Community Health Nursing', 'Nursing', 'Public Health'],
  'Maternal and Child Health': ['Maternal and Child Health', 'Midwifery', 'Paediatric Nursing'],
};

// Port of critical_disease_weights (v4 engine lines 114-125).
const DISEASE_WEIGHT = {
  'Lassa fever': 20, 'Drug-Resistant TB': 20, 'Meningitis': 18, 'Stroke': 18, 'Cancer': 17, 'Heart Disease': 16, 'Kidney Disease': 16, 'Leukemia': 16, 'Complicated HIV/AIDS': 15, 'Sickle Cell Disease': 15, 'Neurosurgery': 15, 'Cholera': 14, 'Severe Malaria': 13, 'Tuberculosis (TB)': 12, 'HIV/AIDS': 12, 'Hepatitis': 11, 'Preeclampsia': 11, 'Diabetes': 10, 'Hypertension': 10, 'Pneumonia': 10, 'Severe Malnutrition': 10, 'Complicated Labor': 9, 'Epilepsy': 8, 'Malaria': 7, 'Typhoid': 6, 'Respiratory Infections': 5, 'Diarrhea Diseases': 5, 'Anemia in Pregnancy': 5, 'Yellow Fever': 4, 'Measles': 4, 'Malnutrition': 4, 'Anemia': 3, 'Accidents': 3, 'Trauma': 3, 'Appendicitis': 2, 'Fibroids': 2, 'Hernia Repair': 1, 'Polio': 1, 'Tetanus': 1, 'Heart Surgery': 20, 'Cancer Surgery': 18,
};

export function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : d);

function facilityView(f) {
  const capacity = num(f.personnel_capacity, 10);
  const existing = num(f.no_of_doctors) + num(f.no_of_nurses) + num(f.no_of_pharmacists) + num(f.no_of_other_staff);
  const diseases = (f.prevalent_diseases ?? '').split(',').map((d) => d.trim()).filter(Boolean);
  const diseaseScore = diseases.reduce((s, d) => s + (DISEASE_WEIGHT[d] ?? 0), 0);
  return {
    name: f.facility_name, state: f.state, centre: f.centre_specialization, diseases: diseases.join(', '),
    openSlots: Math.max(0, capacity - existing), criticality: Math.max(0, capacity - existing) * 0.5 + diseaseScore,
  };
}

export function buildSample(graduateCsv, facilityCsv) {
  const rand = mulberry32(SEED);
  const grads = parseCsv(graduateCsv).filter((g) => g.id_number && g.specialization);
  const facilities = parseCsv(facilityCsv)
    .map(facilityView)
    .filter((f) => f.name && f.state && ACCEPTS[f.centre] && f.openSlots >= 1);
  const sortedGrads = grads.sort((a, b) => a.id_number.localeCompare(b.id_number));
  const pickedGrads = shuffled(sortedGrads, rand).slice(0, N_GRADUATES);
  const pool = shuffled(facilities, rand).slice(0, N_FACILITIES).map((f) => ({ ...f, remaining: f.openSlots }));

  return pickedGrads
    .sort((a, b) => a.id_number.localeCompare(b.id_number))
    .map((g, i) => {
      let best = null; let bestScore = -Infinity;
      for (const f of pool) {
        if (f.remaining < 1) continue;
        const score = (ACCEPTS[f.centre].includes(g.specialization) ? 50 : -100) + f.criticality;
        if (score > bestScore) { bestScore = score; best = f; }
      }
      if (!best) throw new Error(`no open facility slot for graduate ${g.id_number}; raise N_FACILITIES or change SEED`);
      const skillMatch = ACCEPTS[best.centre].includes(g.specialization);
      const openSlotsBefore = best.remaining;
      best.remaining -= 1;
      const need = skillMatch
        ? `${g.specialization} is accepted by a ${best.centre} facility`
        : `no better-matching facility had a free slot; ${g.specialization} is not on the ${best.centre} list`;
      return {
        assignmentId: String(i + 1), graduateId: g.id_number, specialization: g.specialization,
        facilityName: best.name, state: best.state, centreSpecialization: best.centre, diseases: best.diseases || 'not listed',
        skillMatch, openSlotsBefore, overCapacity: false,
        rationale: `${need}. ${openSlotsBefore} free slot${openSlotsBefore === 1 ? '' : 's'} before this placement. Disease burden: ${best.diseases || 'not listed'}.`,
      };
    });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const g = readFileSync(resolve(DATA_DIR, 'generated_nysc_healthcare_graduates.csv'), 'utf8');
  const f = readFileSync(resolve(DATA_DIR, 'primary_facilities.csv'), 'utf8');
  const rows = buildSample(g, f);
  writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n');
  console.log(`wrote ${rows.length} rows to ${OUT}; skill matches: ${rows.filter((r) => r.skillMatch).length}`);
}
```

Add to `package.json` `scripts`: `"build:nysc-sample": "node scripts/build-nysc-sample.mjs"`.

- [ ] **Step 3: Run it**

Run: `npm run build:nysc-sample`
Expected: `wrote 40 rows to .../sample-assignments.json; skill matches: <n>`. If it throws `no open facility slot`, raise `N_FACILITIES` to 100 and re-run.

- [ ] **Step 4: Prove determinism**

Run: `cp src/app/demo/nysc-deployment/data/sample-assignments.json /tmp/s1.json && npm run build:nysc-sample && diff /tmp/s1.json src/app/demo/nysc-deployment/data/sample-assignments.json && echo identical`
Expected: `identical`.

- [ ] **Step 5: Verify**

Run: `npm run verify:nysc`
Expected: `verify-nysc-data: ok` (now also checks 40 rows, no duplicates, no over-capacity).

---

### Task 3: Replay component

**Files:**
- Create: `src/app/demo/nysc-deployment/tokens.ts`
- Create: `src/app/demo/nysc-deployment/data/bundle.ts`
- Create: `src/app/demo/nysc-deployment/NyscReplay.tsx`
- Create: `src/app/demo/nysc-deployment/workspace/page.tsx`

**Interfaces:**
- Consumes: `NyscBundle`, `Panel`, `Step`, `SampleAssignment` from `data/types.ts`.
- Produces: `NyscReplay({ bundle }: { bundle: NyscBundle })` (named export); `bundle: NyscBundle` from `data/bundle.ts`; `T`, `FONT_MONO` from `tokens.ts`.

- [ ] **Step 1: Write `tokens.ts`**

```ts
export const T = {
  bone: '#F4EFE7', boneDeep: '#E8E0D2', maroon: '#5C1427', maroonDeep: '#3E0E1A', maroonRich: '#731931',
  ink: '#14110F', neutral50: '#FAFAF8', neutral100: '#F2F1ED', neutral200: '#E5E3DC',
  neutral400: '#9E9C92', neutral500: '#6F6E66', neutral600: '#4A4945', neutral700: '#2E2D2A',
  green: '#047857', amber: '#B45309',
};

export const FONT_MONO = "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)";
```

- [ ] **Step 2: Write `data/bundle.ts`**

```ts
import run from './nysc-run.json';
import sample from './sample-assignments.json';
import type { NyscBundle } from './types';

export const bundle = { ...run, sample } as unknown as NyscBundle;
```

- [ ] **Step 3: Write `NyscReplay.tsx`**

```tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { T, FONT_MONO } from './tokens';
import type { NyscBundle, Panel, SampleAssignment } from './data/types';

const fmt = (n: number) => n.toLocaleString('en-US');

const Source = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500, margin: '10px 0 0', lineHeight: 1.5 }}>{children}</p>
);

const Bars = ({ panel }: { panel: Extract<Panel, { kind: 'bars' }> }) => {
  const max = Math.max(...panel.items.map((i) => i.value ?? 0), 1);
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: T.ink }}>{panel.title}</p>
      {panel.items.map((it) => (
        <div key={it.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.neutral600, marginBottom: 3 }}>
            <span>{it.label}</span>
            <span style={{ fontFamily: FONT_MONO, color: it.value === null ? T.amber : T.ink }}>
              {it.value === null ? it.note ?? 'not recorded' : fmt(it.value)}
            </span>
          </div>
          <div style={{ height: 10, background: T.neutral100, borderRadius: 5, border: it.value === null ? `1px dashed ${T.neutral400}` : 'none' }}>
            {it.value !== null && (
              <div style={{ width: `${(it.value / max) * 100}%`, height: '100%', background: T.maroon, borderRadius: 5, transition: 'width 600ms ease' }} />
            )}
          </div>
        </div>
      ))}
      <Source>{panel.source}</Source>
    </div>
  );
};

const Table = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
  <div style={{ overflowX: 'auto', border: `1px solid ${T.neutral200}`, borderRadius: 10, background: '#fff' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: T.neutral50 }}>
          {head.map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${T.neutral200}` }}>
            {r.map((c, j) => <td key={j} style={{ padding: '7px 12px', color: T.neutral700, verticalAlign: 'top' }}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SampleTable = ({ rows, label }: { rows: SampleAssignment[]; label: string }) => (
  <div>
    <p style={{ margin: '0 0 10px', fontSize: 12, color: T.amber, fontWeight: 600 }}>{label}</p>
    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
      <Table
        head={['#', 'Graduate', 'Facility', 'Match', 'Why']}
        rows={rows.map((r) => [
          r.assignmentId,
          <span key="g"><b style={{ fontFamily: FONT_MONO }}>{r.graduateId}</b><br />{r.specialization}</span>,
          <span key="f">{r.facilityName}<br /><span style={{ color: T.neutral500 }}>{r.state}, {r.centreSpecialization}</span></span>,
          <span key="m" style={{ color: r.skillMatch ? T.green : T.amber, fontWeight: 600 }}>{r.skillMatch ? 'Yes' : 'No'}</span>,
          r.rationale,
        ])}
      />
    </div>
  </div>
);

const srcStyle: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500 };

const PanelView = ({ panel, bundle }: { panel: Panel; bundle: NyscBundle }) => {
  switch (panel.kind) {
    case 'goals':
      return (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>Goals</p>
          {panel.goals.map((g, i) => (
            <div key={g} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${T.neutral200}` : 'none', fontSize: 13, color: T.neutral700 }}>
              <span style={{ fontFamily: FONT_MONO, color: T.maroon }}>{i + 1}</span>{g}
            </div>
          ))}
        </div>
      );
    case 'facts':
      return (
        <Table head={['Item', 'Detail', 'Source']} rows={panel.rows.map((r) => [<b key="l">{r.label}</b>, r.value, <span key="s" style={srcStyle}>{r.source}</span>])} />
      );
    case 'bars':
      return <Bars panel={panel} />;
    case 'compare':
      return (
        <Table head={['Measure', panel.head[0], panel.head[1], 'Source']} rows={panel.rows.map((r) => [<b key="l">{r.label}</b>, r.a, r.b, <span key="s" style={srcStyle}>{r.source}</span>])} />
      );
    case 'sample':
      return <SampleTable rows={bundle.sample} label={bundle.meta.sampleLabel} />;
  }
};

const btn: React.CSSProperties = {
  padding: '6px 12px', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8,
  fontSize: 13, color: T.neutral700, cursor: 'pointer', fontFamily: 'inherit',
};

export function NyscReplay({ bundle }: { bundle: NyscBundle }) {
  const { steps, meta } = bundle;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const chatRef = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  useEffect(() => {
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setIndex((i) => i + 1), steps[index].durationMs / speed);
    return () => clearTimeout(t);
  }, [playing, index, speed, steps, last]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [index]);

  const step = steps[index];
  return (
    <div style={{ background: T.bone, minHeight: '100vh', color: T.ink, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
      <div style={{ background: T.maroonDeep, color: T.bone, fontSize: 12, padding: '6px 16px', textAlign: 'center' }}>{meta.confidentialBanner}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${T.neutral200}`, background: '#fff' }}>
        <b style={{ fontSize: 14 }}>Intellign workspace</b>
        <span style={{ fontSize: 12, color: T.neutral600 }}>{meta.title}</span>
        <span style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 11, color: T.amber, border: `1px solid ${T.amber}`, borderRadius: 999, padding: '2px 10px' }}>{meta.replayLabel}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div ref={chatRef} style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.slice(0, index + 1).map((s, i) => (
              <div key={s.id} style={{ alignSelf: i === 0 ? 'flex-end' : 'flex-start', maxWidth: '92%', background: i === 0 ? T.maroon : '#fff', color: i === 0 ? T.bone : T.neutral700, border: i === 0 ? 'none' : `1px solid ${T.neutral200}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, lineHeight: 1.55 }}>
                {i !== 0 && <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.maroonRich, marginBottom: 4 }}>{s.title}</div>}
                {s.chat}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '2 1 380px', minWidth: 0, background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.neutral500 }}>STEP {index + 1} / {steps.length}</span>
            <b style={{ fontSize: 15 }}>{step.title}</b>
          </div>
          <PanelView panel={step.panel} bundle={bundle} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '0 16px 24px' }}>
        <button style={btn} onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>Back</button>
        <button style={btn} onClick={() => { if (index >= last) setIndex(0); setPlaying((p) => !p); }}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => setIndex((i) => Math.min(last, i + 1))} disabled={index === last}>Next</button>
        <button style={btn} onClick={() => { setIndex(0); setPlaying(false); }}>Restart</button>
        <label style={{ fontSize: 12, color: T.neutral600, marginLeft: 8 }}>
          Speed{' '}
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ ...btn, padding: '4px 8px' }}>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `workspace/page.tsx`**

```tsx
'use client';

import { NyscReplay } from '../NyscReplay';
import { bundle } from '../data/bundle';

export default function NyscWorkspacePage() {
  return <NyscReplay bundle={bundle} />;
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`resolveJsonModule` is already true in `tsconfig.json`.)

- [ ] **Step 6: Browser check (pins three Review Focus items)**

Run `npm run dev`, open `http://localhost:3000/demo/nysc-deployment/workspace`.
Expected, checked by eye:
- It autoplays through 8 steps, then stops; Pause, Back, Next, Restart and 2x speed all work.
- Step 5 shows five bars; batch 5 shows a dashed empty bar labeled "not recorded", not 0 or NaN.
- Step 8 shows 40 rows under the "Illustrative sample" label.
- Resize the window to 375 px wide: chat stacks above the canvas, nothing clips horizontally, the page itself does not scroll sideways.
- In browser devtools, emulate `prefers-reduced-motion: reduce` and reload: it does not autoplay; Next advances one step per click.

---

### Task 4: Layout, overview page, and index protection

**Files:**
- Create: `src/app/demo/nysc-deployment/layout.tsx`
- Create: `src/app/demo/nysc-deployment/page.tsx`
- Modify: `scripts/verify-nysc-data.mjs` (append index checks)

**Interfaces:**
- Consumes: `bundle` from `data/bundle.ts`; `T`, `FONT_MONO` from `tokens.ts`.

- [ ] **Step 1: Add the failing index checks**

Append before the final `console.log` in `scripts/verify-nysc-data.mjs`:

```js
const layoutPath = resolve(root, 'src/app/demo/nysc-deployment/layout.tsx');
assert.ok(existsSync(layoutPath), 'layout.tsx missing');
const layout = readFileSync(layoutPath, 'utf8');
assert.ok(/index:\s*false/.test(layout) && /follow:\s*false/.test(layout), 'layout must set robots index:false, follow:false');
const sitemap = readFileSync(resolve(root, 'src/app/sitemap.ts'), 'utf8');
assert.ok(!/nysc/i.test(sitemap), 'sitemap must not list nysc routes');
```

Run: `npm run verify:nysc`
Expected: FAIL `layout.tsx missing`.

- [ ] **Step 2: Write `layout.tsx`**

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NYSC Strategic Deployment: supporting document',
  description: 'Recorded run replay of the NYSC healthcare graduate deployment.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function NyscLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Write `page.tsx` (overview, server component)**

```tsx
import Link from 'next/link';
import { bundle } from './data/bundle';
import { T, FONT_MONO } from './tokens';

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, margin: '40px 0 12px', color: T.maroonDeep }}>{children}</h2>
);

export default function NyscOverviewPage() {
  const { meta, evolution, mechanism, limits } = bundle;
  const compare = bundle.steps.find((s) => s.id === 'verify');
  return (
    <main style={{ background: T.bone, minHeight: '100vh', color: T.ink, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
      <div style={{ background: T.maroonDeep, color: T.bone, fontSize: 12, padding: '6px 16px', textAlign: 'center' }}>{meta.confidentialBanner}</div>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 80px' }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.neutral500 }}>Intellign, supporting document</p>
        <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: '8px 0 12px', color: T.maroonDeep }}>{meta.title}</h1>
        <p style={{ fontSize: 17, color: T.neutral600, lineHeight: 1.55 }}>{meta.subtitle}.</p>
        <Link href="/demo/nysc-deployment/workspace" style={{ display: 'inline-block', marginTop: 12, padding: '12px 22px', background: T.maroon, color: T.bone, borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
          Watch the deployment
        </Link>

        <H2>The problem</H2>
        <p style={{ lineHeight: 1.65, color: T.neutral700 }}>
          Newly qualified health graduates serving through the National Youth Service Corps must be placed at primary health facilities. Each placement has to fit the graduate&apos;s specialization, reach the facilities with the greatest need, and avoid overloading any facility. With 500 graduates and 750 facilities the number of possible plans is far too large to check by hand.
        </p>

        <H2>How the approach evolved</H2>
        {evolution.map((v) => (
          <div key={v.id} style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
            <b>{v.name}</b>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: T.neutral700, lineHeight: 1.55 }}><b>What it did.</b> {v.did}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: T.neutral700, lineHeight: 1.55 }}><b>What it exposed.</b> {v.exposed}</p>
            <p style={{ margin: '6px 0 0', fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500 }}>{v.source}</p>
          </div>
        ))}

        <H2>Results</H2>
        {compare && compare.panel.kind === 'compare' && (
          <div style={{ overflowX: 'auto', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: T.neutral50, textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Measure</th><th style={{ padding: '10px 14px' }}>{compare.panel.head[0]}</th><th style={{ padding: '10px 14px' }}>{compare.panel.head[1]}</th>
                </tr>
              </thead>
              <tbody>
                {compare.panel.rows.map((r) => (
                  <tr key={r.label} style={{ borderTop: `1px solid ${T.neutral200}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.label}</td><td style={{ padding: '10px 14px' }}>{r.a}</td><td style={{ padding: '10px 14px' }}>{r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500 }}>Source: invention disclosure, section 12.2. Setup: 500 generated graduate records, 750 facilities sampled from 44,915.</p>

        <H2>How the engine works</H2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.7, color: T.neutral700 }}>
          {mechanism.map((m) => <li key={m}>{m}</li>)}
        </ol>

        <H2>Limits we state openly</H2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.7, color: T.neutral700 }}>
          {limits.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run the verifier**

Run: `npm run verify:nysc`
Expected: `verify-nysc-data: ok`

- [ ] **Step 5: Type-check and eyeball**

Run: `npx tsc --noEmit`
Expected: no errors.
With `npm run dev` running, open `http://localhost:3000/demo/nysc-deployment`. Expected: banner, title, "Watch the deployment" button that opens the replay, five evolution cards, a results table showing 409 of 500 twice, four mechanism items, five limits. View source: `<meta name="robots" content="noindex, nofollow">` present and no `rel="canonical"` pointing at `/demo`.

---

### Task 5: Offline HTML export

**Files:**
- Create: `scripts/nysc-export-entry.tsx`
- Create: `scripts/export-nysc-demo.mjs`
- Create: `scripts/verify-nysc-export.mjs`
- Modify: `package.json` (devDependency, scripts)
- Modify: `.gitignore` (add `/exports`)

**Interfaces:**
- Consumes: `NyscReplay`, `bundle`.
- Produces: `exports/intellign-nysc-deployment.html`; `npm run export:nysc`.

- [ ] **Step 1: Install esbuild**

Run: `npm install --save-dev esbuild`
Expected: `esbuild` added to `devDependencies`; `package-lock.json` updated.

- [ ] **Step 2: Write the failing export verifier**

`scripts/verify-nysc-export.mjs`:

```js
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../exports/intellign-nysc-deployment.html');
assert.ok(existsSync(file), 'export missing; run npm run export:nysc');
assert.ok(statSync(file).size > 100_000, 'export suspiciously small');
const html = readFileSync(file, 'utf8');

assert.ok(!/<script[^>]+\bsrc=/i.test(html), 'external <script src> found');
assert.ok(!/<link\b/i.test(html), '<link> tag found');
assert.ok(!/@import/i.test(html), '@import found');
assert.ok(!/(src|href)=["']https?:/i.test(html), 'remote src/href found');
assert.ok(html.includes('Recorded run replay'), 'replay label missing');
assert.ok(html.includes('Confidential'), 'confidential banner missing');
assert.ok(html.includes('not recorded'), 'batch 5 label missing');
assert.ok(html.includes('409 of 500 (81.8%)'), 'headline result missing');
assert.ok(!html.includes('1,000,000') && !/random forest/i.test(html), 'mechanism internals leaked into export');
console.log('verify-nysc-export: ok');
```

Add to `package.json` `scripts`: `"export:nysc": "node scripts/export-nysc-demo.mjs && node scripts/verify-nysc-export.mjs"`.

Run: `node scripts/verify-nysc-export.mjs`
Expected: FAIL `export missing; run npm run export:nysc`.

- [ ] **Step 3: Write the entry**

`scripts/nysc-export-entry.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { NyscReplay } from '../src/app/demo/nysc-deployment/NyscReplay';
import { bundle } from '../src/app/demo/nysc-deployment/data/bundle';

createRoot(document.getElementById('root')!).render(<NyscReplay bundle={bundle} />);
```

- [ ] **Step 4: Write the export script**

`scripts/export-nysc-demo.mjs`:

```js
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'exports');
const outFile = resolve(outDir, 'intellign-nysc-deployment.html');

const result = await build({
  entryPoints: [resolve(root, 'scripts/nysc-export-entry.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'es2019',
  minify: true,
  jsx: 'automatic',
  tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } },
  loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Intellign: NYSC Strategic Deployment (supporting document)</title>
<style>html,body{margin:0}*{box-sizing:border-box}:root{--font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}button:disabled{opacity:.45;cursor:default}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, html);
console.log(`wrote ${outFile} (${(html.length / 1024).toFixed(0)} KB)`);
```

Add `/exports` on its own line to `.gitignore`.

- [ ] **Step 5: Run the export**

Run: `npm run export:nysc`
Expected: `wrote .../exports/intellign-nysc-deployment.html (<n> KB)` then `verify-nysc-export: ok`.

- [ ] **Step 6: Offline browser check**

Open `file:///home/testys/Documents/GitHub/Intellign-frontend/exports/intellign-nysc-deployment.html` with the network disabled (airplane mode or devtools "Offline").
Expected: identical behavior to the Next replay: banner, autoplay through 8 steps, controls work, batch 5 shows "not recorded", 40 sample rows, no console errors.

---

### Task 6: Final verification

**Files:** none changed.

- [ ] **Step 1: Data and export verifiers**

Run: `npm run verify:nysc && npm run export:nysc`
Expected: both print `ok`.

- [ ] **Step 2: Type-check and production build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed; the build output lists `/demo/nysc-deployment` and `/demo/nysc-deployment/workspace`.

- [ ] **Step 3: Disclosure cross-check by eye**

Open the overview and the replay side by side with disclosure sections 5, 12.1 and 12.2. Confirm each number on screen matches its cited section, the limits section is present, and nothing implies v4 improved skill match.

- [ ] **Step 4: Hand back to the owner**

Report: routes, export path, the unexplained 69,850 to 65,640 drop and the missing batch 5 value (both for the inventors to confirm), and that release of the export is the owner's decision (confidential, unfiled disclosure).
