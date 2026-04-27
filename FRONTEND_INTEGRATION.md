# Intellign Engine — Frontend Integration Guide

> **For:** Frontend engineers integrating with the Intellign optimization backend.
> **Base URL:** `http://localhost:8000` (dev)
> **Interactive docs:** `GET /docs` (Swagger) · `GET /redoc` (ReDoc)
> **CORS:** Open (`*`) for all origins in all environments.

---

## Architecture overview

There are **two integration paths**. Choose one per session — do not mix them.

```
┌─────────────────────────────────────────────────────────────────┐
│  PATH A — UNIFIED CHAT  (recommended, production-ready)         │
│                                                                  │
│  POST /ingest/chat/{session_id}   ← single endpoint for:        │
│    • Goal discovery (AI asks about the problem)                  │
│    • File upload + AI analysis + column mapping                  │
│    • Synthetic data generation (no files needed)                 │
│    • Data augmentation + missing table generation                │
│    • User corrections at every step (AI waits for confirmation)  │
│    • Goal definition (auto-transitions inside same chat)         │
│                                                                  │
│  Then: POST /optimizations/run/{session_id}                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PATH B — LEGACY SMART INGESTION                                 │
│                                                                  │
│  POST /ingest/smart/upload          step 1 — upload + analyse   │
│  GET  /ingest/smart/{id}/status         poll for completion      │
│  GET  /ingest/smart/{id}/result         get analysis proposal    │
│  POST /ingest/smart/{id}/select     step 2 — choose tables       │
│  POST /ingest/smart/{id}/recipe     step 3 — apply mappings      │
│  POST /ingest/smart/{id}/generate   step 4 — virtualise/finalise │
│                                                                  │
│  POST /agent/chat/{session_id}      goal definition (separate)   │
│  POST /config/goals/{session_id}    persist goals                │
│  POST /optimizations/run/{session_id}                            │
└─────────────────────────────────────────────────────────────────┘
```

**Path A eliminates the need for any separate goal definition step.** The same chat thread that ingests the data also defines goals and transitions automatically. Use Path B only if you need full programmatic control over each pipeline stage.

---

## Path A — Unified Chat

### How it works

Everything flows through one endpoint: `POST /ingest/chat/{session_id}`.

The AI manages two phases internally:

**Phase 1 — Ingestion** (`phase: "ingestion"`)
- Asks the user to describe their optimization problem
- Builds a `GoalModel` incrementally (confidence 0–1; pivots to data questions at 0.7)
- Accepts file uploads — analyses all sheets, classifies resources vs targets
- Generates synthetic datasets when the user has no data
- Augments missing columns or generates missing tables on request
- Asks user permission before every non-read action; waits for explicit confirmation
- Shows reasoning for every decision (e.g. "I'm treating Staff as resources because...")

**Phase 2 — Goal Definition** (`phase: "goal_definition"`)  
Transitions automatically after the user confirms `finalize`. The same chat thread continues but each turn now returns structured `GoalDefinition` objects. No second endpoint needed.

---

### Request format

**Every call uses `multipart/form-data`** — required because files may accompany any message.

```http
POST /ingest/chat/{session_id}
Content-Type: multipart/form-data

message:         <string, required>
include_history: <bool, default true>
model:           <string, optional — server default: gemini-2.5-flash>
files:           <file[], optional — zero or more data files>
```

```js
async function chat(sessionId, text, files = []) {
  const form = new FormData();
  form.append('message', text);
  form.append('include_history', 'true');
  files.forEach(f => form.append('files', f));

  const res = await fetch(`/ingest/chat/${sessionId}`, {
    method: 'POST',
    body: form,
    // DO NOT set Content-Type manually — browser sets boundary automatically
  });
  return res.json();
}
```

> **Common mistake:** `Content-Type: application/json` → 422 Unprocessable Entity.
> This endpoint only accepts `multipart/form-data`.

---

### Session management

Generate a UUID v4 client-side. The backend auto-creates the session on the first call — no registration step needed. Session data lives in Redis with a **7-day TTL**.

```js
const sessionId = crypto.randomUUID();
```

---

### Response shape

```json
{
  "session_id": "a3f2c1d0-...",
  "message": "The AI reply shown to the user",
  "action_taken": "ingest_files",
  "data_preview": { ... },
  "is_complete": false,
  "phase": "ingestion",
  "goal_model": {
    "problem_type": "staff_assignment",
    "confidence": 0.72,
    "entities": {
      "resources": { "name": "nurses" },
      "targets":   { "name": "clinics" }
    },
    "objectives":  ["skill_matching", "minimize_overtime"],
    "constraints": ["availability", "capacity"],
    "estimated_scale": "medium",
    "description": "Assign nurses to clinics based on specialization",
    "inferred_schema": {}
  },
  "data_context": {
    "status": "partial",
    "resources_metadata": { "count": 150, "columns": ["id", "name", "specialization"] },
    "targets_metadata": null,
    "missing_tables": ["clinics"],
    "missing_columns": {},
    "synthetic_flags": {}
  },
  "goals": null,
  "ga_params": null
}
```

---

### What to do with each field

| Field | Required action |
|---|---|
| `message` | Always render in the chat thread. |
| `phase` | `"ingestion"` → show file uploader. `"goal_definition"` → hide file uploader, show goals panel. |
| `is_complete` | When `true` → enable "Run Optimization" button. |
| `action_taken` | See table below — some values trigger specific UI behaviour. |
| `data_preview` | If not `null` → render as a card/table below the message. |
| `goal_model.confidence` | Optional progress indicator. Rises 0→1 as the AI learns about the problem. |
| `data_context.status` | `none → partial → complete`. Use for a stepper or status badge. |
| `goals` | Populated in `goal_definition` phase. These are **already auto-saved server-side** — do not re-POST them. |
| `ga_params` | If not `null` → pre-fill your GA settings form. |

---

### `action_taken` values and what they mean

| `action_taken` | What happened | What to show |
|---|---|---|
| `null` | Conversational reply — no backend action yet. | Just the message. |
| `"await_data_upload"` | AI is waiting for the user to attach a file. | Make the file picker prominent; don't wait for the user to notice it. |
| `"ingest_files"` | Files were scanned and analysed. | Render `data_preview` (analysis card) below the message. |
| `"confirm_ingest"` | Column mapping applied; data is structured. | Render `data_preview` (row counts, column list). **Show download buttons.** |
| `"generate_sample_dataset"` | Synthetic dataset generated from scratch. | Render `data_preview` (sample rows). **Show download buttons.** |
| `"generate_missing_tables"` | Generated a table that was absent. | Render `data_preview` (sample rows). **Show download buttons.** |
| `"augment_missing_data"` | Filled missing columns with synthetic values. | Render `data_preview` (augmented preview). **Show download buttons.** |
| `"finalize"` | Data is locked; session moving to goal_definition phase. | Show transition UI; watch for `phase: "goal_definition"` in next response. |
| `"goal_definition_turn"` | Goal definition agent ran; check `goals`. | Render structured goals; show them in a goals panel. |

---

### `data_preview` shapes

`data_preview` is not a fixed schema. Its structure depends on `action_taken`.

**After `ingest_files`:**
```json
{
  "tables_found": ["Staff", "Clinics", "Summary"],
  "candidate_details": [
    {
      "label": "Staff",
      "rows": 150,
      "columns": ["id", "name", "specialization", "hourly_cost"],
      "type": "resource",
      "reasoning": "Person-level rows with skills and availability"
    },
    {
      "label": "Clinics",
      "rows": 30,
      "columns": ["id", "name", "capacity", "required_specialization"],
      "type": "target",
      "reasoning": "Location and capacity columns typical of targets"
    },
    {
      "label": "Summary",
      "rows": 5,
      "type": "unclassified",
      "reasoning": "Aggregate summary — not useful for assignment"
    }
  ],
  "recommended_resource": "Staff",
  "recommended_target": "Clinics",
  "resources_rows": 150,
  "targets_rows": 30,
  "resources_cols": ["id", "name", "specialization", "hourly_cost"],
  "targets_cols": ["id", "name", "capacity", "required_specialization"],
  "missing_tables": [],
  "optimization_summary": "Skill match + capacity constraint detected",
  "suggested_goals_count": 2
}
```

**After `generate_sample_dataset` / `generate_missing_tables`:**
```json
{
  "num_rows": 100,
  "columns": ["id", "name", "specialization", "hourly_cost"],
  "is_synthetic": true,
  "preview": [
    { "id": 1, "name": "Alice M.", "specialization": "Cardiology", "hourly_cost": 45.0 },
    { "id": 2, "name": "Bob T.",   "specialization": "General Practice", "hourly_cost": 38.0 }
  ]
}
```

**After `augment_missing_data`:**
```json
{
  "preview": [
    { "id": 1, "name": "Clinic A", "location_x": 6.4281, "location_y": 3.4219, "hourly_cost": 120.0 }
  ]
}
```

---

### Dataset download

After any action that produces data (`confirm_ingest`, `generate_sample_dataset`, `generate_missing_tables`, `augment_missing_data`), the full datasets are stored server-side and can be downloaded directly — regardless of how they were produced.

```http
GET /ingest/chat/{session_id}/datasets?table=resources&format=csv
GET /ingest/chat/{session_id}/datasets?table=targets&format=csv
GET /ingest/chat/{session_id}/datasets?table=resources&format=xlsx
GET /ingest/chat/{session_id}/datasets?table=targets&format=xlsx
```

**Query parameters:**

| Param | Values | Default |
|---|---|---|
| `table` | `resources` \| `targets` | `resources` |
| `format` | `csv` \| `xlsx` | `csv` |

Returns a `StreamingResponse` file download with `Content-Disposition: attachment`.

```js
async function downloadDataset(sessionId, table, format = 'csv') {
  const res = await fetch(
    `/ingest/chat/${sessionId}/datasets?table=${table}&format=${format}`
  );
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${table}_${sessionId.slice(0, 8)}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

// Example: show download buttons after confirm_ingest or generate_sample_dataset
if (['confirm_ingest', 'generate_sample_dataset', 'generate_missing_tables', 'augment_missing_data']
    .includes(response.action_taken)) {
  showDownloadButtons(sessionId);  // surface the GET calls above
}
```

**When to show download buttons:**

Show both download buttons (resources + targets) whenever `data_context.status` is `partial` or `complete`. Either table may be missing if ingestion is still in progress — the endpoint returns `404` for tables that aren't ready yet, so check per-table before rendering the button.

```js
function showDownloadButtons(sessionId, dataContext) {
  if (dataContext.resources_metadata) {
    renderButton('Resources', () => downloadDataset(sessionId, 'resources'));
  }
  if (dataContext.targets_metadata) {
    renderButton('Targets', () => downloadDataset(sessionId, 'targets'));
  }
}
```

---

### File uploads

Attach files to any `chat()` call. The AI handles analysis automatically behind the scenes — you do not need a separate upload endpoint.

```js
// User drops a file or the AI signals await_data_upload
const file = fileInput.files[0];
await chat(sessionId, "Here is my data file", [file]);
```

Supported formats: `.xlsx` `.xls` `.csv` `.tsv` `.json` `.geojson` `.parquet` `.ods` `.feather` `.html` `.gpkg` `.shp` `.kml`

**Files persist across turns.** If the user uploads in turn 3 and confirms in turn 4 (no file attached), the server uses the cached data. You do not need to re-upload.

---

### User corrections

The AI always explains its reasoning and asks for explicit confirmation before any action. The user can correct the AI at any point:

- **Wrong table classification?** "No, use the Clinics sheet as resources, not Staff."
- **Wrong column mapping?** "The 'pay_grade' column should be treated as cost, not ignored."
- **Don't want synthetic data?** "I'll upload the targets file myself." → AI will wait.
- **Change scale?** "Actually we have 500 workers, not 80."

The AI re-analyses and asks again. No special endpoint needed for corrections — they happen through the normal chat turns.

---

### Goal definition (automatic, same chat thread)

After the user confirms `finalize`:
1. `response.phase` becomes `"goal_definition"`
2. The server appends a bridge message in the history explaining data is ready
3. The next user message runs through the goal definition agent automatically
4. `response.goals` returns structured `GoalDefinition` objects
5. These are **auto-saved to `config:{session_id}`** on the server — do not re-POST them

```json
{
  "phase": "goal_definition",
  "message": "I've translated your requirements into 2 optimization goals...",
  "goals": [
    {
      "description": "Match nurse specialization to clinic requirement",
      "weight": 70,
      "award_type": "Reward",
      "resource_columns": ["specialization"],
      "target_columns": ["required_specialization"],
      "logic_config": {
        "logic_type": "categorical_match",
        "exact_match": true
      },
      "explanation": "Directly matches the primary hiring criteria"
    },
    {
      "description": "Do not exceed clinic capacity",
      "weight": 30,
      "award_type": "Penalty",
      "resource_columns": [],
      "target_columns": ["capacity"],
      "logic_config": {
        "logic_type": "numeric_threshold",
        "comparison_column": "capacity"
      }
    }
  ],
  "ga_params": {
    "population_size": 200,
    "generations": 100,
    "mutation_rate": 0.05,
    "selection_method": "tournament"
  },
  "is_complete": true
}
```

Goals accumulate across turns. Each turn appends new goals, never replaces existing ones. Render them all in your goals panel — update it after every response that has `goals`.

The user can continue correcting goals: "Increase the weight of skill matching to 80%", "Add a spatial proximity constraint too" — each turn adds or refines goals.

---

### Complete Path A flow

```
[client generates sessionId = uuid()]
                │
                ▼
  POST /ingest/chat/{sessionId}     "I need to assign nurses to clinics"
    ← phase: "ingestion"
    ← goal_model.confidence: 0.2
    ← message: "Tell me more about the scale..."
                │ (more turns — confidence builds)
                ▼
  POST /ingest/chat/{sessionId}     "We have 150 nurses and 30 clinics"
    ← goal_model.confidence: 0.8
    ← message: "Great. Do you have data to upload or should I generate it?"
                │
                ├── user has data ────────────────────────────────────────┐
                │                                                          │
                ▼                                                          │
  POST /ingest/chat/{sessionId}     [attaches file.xlsx]                  │
    ← action_taken: "ingest_files"                                        │
    ← data_preview: { tables_found, candidate_details, recommended_* }    │
    ← message: "I found 2 tables: Staff (150 rows) as resources..."       │
                │                                                          │
                ▼                                                          │
  POST /ingest/chat/{sessionId}     "Yes, that looks right, proceed"      │
    ← action_taken: "confirm_ingest"                                       │
    ← data_preview: { resources_rows: 150, targets_rows: 30, ... }        │
    ← message: "Column mapping complete. Here's what I structured: ..."   │
                │                                                          │
                └── user has no data ──────────────────────────────────┐  │
                                                                        │  │
                ▼                                                        │  │
  POST /ingest/chat/{sessionId}     "Please generate sample data"       │  │
    ← message: "I'll generate 150 nurses and 30 clinics. Shall I?"      │  │
                │                                                        │  │
  POST /ingest/chat/{sessionId}     "Yes"                               │  │
    ← action_taken: "generate_sample_dataset"                           │  │
    ← data_preview: { num_rows: 180, preview: [...] }                  │  │
                │◄──────────────────────────────────────────────────────┘  │
                │◄─────────────────────────────────────────────────────────┘
                ▼
  POST /ingest/chat/{sessionId}     "Looks good, finalize it"
    ← action_taken: "finalize"
    ← phase: "goal_definition"       ← PHASE TRANSITION
    ← is_complete: true
    ← message: "Data is ready — 150 resources, 30 targets. What do you want to optimize?"
                │
                ▼
  POST /ingest/chat/{sessionId}     "Match nurses by specialization, avoid overtime"
    ← phase: "goal_definition"
    ← goals: [ GoalDefinition, GoalDefinition ]   ← auto-saved server-side
    ← ga_params: { population_size: 200, ... }
                │
                ▼
  POST /optimizations/run/{sessionId}   { "auto_approve": false }
    ← { job_id: "e4f1b2c3-...", status: "pending" }
                │
  EventSource /optimizations/progress/{jobId}
    ← { progress: 0.0–1.0, best_fitness, current_generation, status }
                │ (status: "completed")
                ▼
  GET /results/{jobId}
    ← { assignments: [...], metrics: {...}, fitness_history: [...] }
```

---

### Conversation history

```http
GET  /ingest/chat/{session_id}/history
```

Returns all turns for re-rendering the chat after a page reload.

```json
{ "session_id": "...", "messages": [{"role":"user","content":"..."},{"role":"assistant","content":"..."}], "turn_count": 6 }
```

```http
DELETE /ingest/chat/{session_id}/history
```

Clears conversation history without destroying session state (data and goals are kept).

---

## Path B — Legacy Smart Ingestion

Use this if you need direct programmatic control over each step (e.g. custom pipeline UI, batch processing with no LLM conversation).

### Step 1 — Upload and analyse (async)

```http
POST /ingest/smart/upload
Content-Type: multipart/form-data

files:      <file[], required — one or more data files>
hint:       "assign nurses to clinics"   (optional — guides LLM classification)
session_id: a3f2c1d0-...                (optional — auto-generated if omitted)
```

Returns immediately with `status: "processing"`. The LLM analysis runs in the background.

```json
{ "session_id": "a3f2c1d0-...", "status": "processing", "file_count": 1, "sheet_count": 3 }
```

### Poll for analysis completion

```http
GET /ingest/smart/{session_id}/status
```

Poll every 2 seconds until `stage` is one of: `analysed`, `failed`.

```json
{ "session_id": "...", "stage": "analysed", "hint": "assign nurses to clinics" }
```

### Retrieve the analysis proposal

```http
GET /ingest/smart/{session_id}/result
```

Returns a full `SmartIngestionProposalResponse`:

```json
{
  "session_id": "...",
  "stage": "analysed",
  "resource_candidates": [
    {
      "label": "Staff",
      "suggested_role": "resource",
      "rows": 150,
      "columns": ["id", "name", "specialization"],
      "heuristic_score": 0.87,
      "reasoning": "Person-level rows with skills and availability"
    }
  ],
  "target_candidates": [ ... ],
  "joint_candidates": [ ... ],
  "unclassified": [ ... ],
  "recommended_resource": "Staff",
  "recommended_target": "Clinics"
}
```

### Step 2 — Confirm table selection

```http
POST /ingest/smart/{session_id}/select
Content-Type: multipart/form-data

resource_label: "Staff"      (null = accept recommendation)
target_label:   "Clinics"    (null = accept recommendation)
joint_label:    null
hint:           "assign nurses to clinics"
```

Returns a `SmartIngestionRecipeResponse` with column-by-column mapping proposals.

### Step 3 — Apply column recipe

```http
POST /ingest/smart/{session_id}/recipe
Content-Type: application/json

{
  "override_mappings": []
}
```

To override a specific column mapping:
```json
{
  "override_mappings": [
    {
      "original_name": "pay_grade",
      "standardized_name": "cost",
      "role": "cost",
      "fill_strategy": "fill_zero",
      "cast": "float"
    }
  ]
}
```

Returns a `SmartIngestionTransformResponse` with row counts and a virtual resource proposal if resources were missing.

### Step 4 — Finalise (generate or skip)

**If resources were missing and a virtual proposal was returned:**
```http
POST /ingest/smart/{session_id}/generate
Content-Type: application/json

{
  "action": "generate",
  "cost_map": { "GeneralPractice": 1.0, "Cardiology": 1.5 },
  "padding_factor": 1.2
}
```

**If both datasets were present:**
```http
POST /ingest/smart/{session_id}/generate
Content-Type: application/json

{ "action": "finalize" }
```

This stores the datasets in `session_manager:{session_id}` — required before running optimization.

### Step 5 — Optional: conversational chat over a legacy session

The legacy pipeline also has a conversational wrapper:

```http
POST /ingest/smart/{session_id}/chat
Content-Type: application/json

{
  "message": "Change the salary column to be treated as cost",
  "include_history": true
}
```

This wraps the 4-step pipeline in a chat interface, allowing natural language corrections at any pipeline stage. Unlike the unified chat, it does **not** handle goal definition.

### Step 6 — Define goals (legacy path requires a separate step)

After `generate` or `finalize`, define goals through the agent:

```http
POST /agent/chat/{session_id}
Content-Type: application/json
X-Google-Key: your-google-api-key   (or set GOOGLE_API_KEY on server)

{
  "message": "Match nurses by specialization and avoid overtime",
  "include_history": true
}
```

The agent returns structured `goals` and optionally `ga_params`. These are auto-saved to `config:{session_id}`. Response:

```json
{
  "session_id": "...",
  "message": "I've structured 2 goals for you...",
  "goals": [ { ... } ],
  "ga_params": { "population_size": 200, "generations": 100 },
  "explanation": "Skill match is the primary driver, capacity is a hard constraint."
}
```

---

## Running optimization (both paths)

### Start a job

```http
POST /optimizations/run/{session_id}
Content-Type: application/json

{
  "auto_approve": false,
  "progress_interval": 20,
  "config_override": null
}
```

- `auto_approve: true` → skip the human review step and finalize immediately
- `config_override` → override stored goals/GA params without modifying the session (useful for "try different parameters" flows)

```json
{
  "job_id": "e4f1b2c3-...",
  "session_id": "a3f2c1d0-...",
  "status": "pending",
  "message": "Optimization job e4f1b2c3 has been queued."
}
```

> **Important:** `job_id` is different from `session_id`. Keep both. Use `session_id` for chat/config; use `job_id` for progress/results.

### Real-time progress (SSE)

```js
const evtSource = new EventSource(`/optimizations/progress/${jobId}`);

evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.progress           → 0.0–1.0
  // data.current_generation → current evolution cycle
  // data.best_fitness       → best solution score so far
  // data.average_fitness    → population average (shows convergence)
  // data.status             → "processing" | "completed" | "failed"
  // data.message            → human-readable status string
  
  updateProgressBar(data.progress);
  updateFitnessChart(data.best_fitness, data.average_fitness);
  
  if (data.status === 'completed' || data.status === 'failed') {
    evtSource.close();
    data.status === 'completed' ? fetchResults(jobId) : showError(data.message);
  }
};

evtSource.onerror = () => evtSource.close();
```

**Use `EventSource`, not `fetch`.** SSE is a streaming connection. Calling it with `fetch` returns a streaming response body but does not give you the per-message events.

### Poll-based alternative

```http
GET /optimizations/status/{job_id}
```

```json
{
  "job_id": "...",
  "session_id": "...",
  "status": "processing",
  "message": "Processing... Generation 45/100",
  "progress": 0.45,
  "current_generation": 45,
  "best_fitness": 0.843
}
```

### Cancel a running job

```http
POST /optimizations/cancel/{job_id}
```

---

## Results and human review

### Get results

```http
GET /results/{job_id}?page=1&page_size=50&include_enriched=true
```

`include_enriched=true` (default) joins in the full resource and target row data so each assignment shows all goal-relevant columns, not just IDs.

```json
{
  "status": "success",
  "job_id": "...",
  "session_id": "...",
  "optimization_status": "pending_review",
  "metrics": {
    "total_resources": 150,
    "total_targets": 30,
    "assigned_targets": 30,
    "unassigned_targets": 0,
    "average_distance": 12.4,
    "max_distance": 47.1,
    "min_distance": 0.9,
    "average_targets_per_resource": 0.2,
    "workload_std_dev": 0.41,
    "total_fitness_score": 127.3
  },
  "status_counts": {
    "pending": 150,
    "approved": 0,
    "rejected": 0,
    "modified": 0
  },
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_items": 150,
    "total_pages": 3
  },
  "assignments": [
    {
      "assignment_id": "asgn_001",
      "resource_id": "nurse_42",
      "target_id": "clinic_07",
      "score": 0.91,
      "approval_status": "pending",
      "resource": {
        "name": "Alice M.",
        "specialization": "Cardiology"
      },
      "target": {
        "name": "Cardiology Centre West",
        "capacity": 5,
        "required_specialization": "Cardiology"
      }
    }
  ],
  "fitness_history": [0.41, 0.62, 0.78, 0.86, 0.91],
  "average_history": [0.31, 0.50, 0.65, 0.74, 0.82],
  "created_at": "2025-04-25T12:00:00"
}
```

### Summary (for dashboard widgets)

```http
GET /results/{job_id}/summary
```

Lightweight endpoint — no assignments data, just metrics and review progress:

```json
{
  "status": "success",
  "job_id": "...",
  "session_id": "...",
  "optimization_status": "pending_review",
  "created_at": "2025-04-25T12:00:00",
  "finalized_at": null,
  "finalized_by": null,
  "metrics": {
    "total_fitness_score": 127.3,
    "average_distance": 12.4,
    "workload_std_dev": 0.41
  },
  "assignment_counts": {
    "total": 150,
    "pending": 143,
    "approved": 7,
    "rejected": 0,
    "modified": 0
  },
  "ga_params_used": { "population_size": 200, "generations": 100 },
  "goals_count": 2
}
```

Use this for a review dashboard header/progress bar before loading the full assignments list.

### Review queue (filtered)

```http
GET /results/{job_id}/review?status_filter=pending&page=1&page_size=20
```

Returns assignments enriched with all goal-relevant columns and a `review_status` field (`needs_review` / `reviewed`). Also includes the full `goals_used` list so reviewers see the optimization context alongside each assignment.

### Individual assignment detail

```http
GET /results/{job_id}/assignment/{assignment_id}
```

Returns single enriched assignment with `goals_context` — the full goal list that produced this assignment. Use for a detail/side-panel view.

### Approve / reject / modify

```http
PUT /results/{job_id}/assignment/{assignment_id}/approve?reviewer=jane&notes=Looks+good
PUT /results/{job_id}/assignment/{assignment_id}/reject?reviewer=jane&reason=Capacity+exceeded
PUT /results/{job_id}/assignment/{assignment_id}/modify?reviewer=jane&new_target_id=T100&reason=Better+fit
```

All three return the updated assignment status and audit fields (`modified_by`, `modified_at`).

### Bulk operations

**Approve all pending:**
```http
POST /results/{job_id}/approve-all?reviewer=jane
```

**Bulk mixed review (recommended for batch UI):**
```http
POST /results/{job_id}/bulk-review?reviewer=jane
Content-Type: application/json

[
  { "assignment_id": "asgn_001", "action": "approve", "notes": "Correct match" },
  { "assignment_id": "asgn_002", "action": "reject",  "reason": "Capacity exceeded" },
  { "assignment_id": "asgn_003", "action": "modify",  "new_target_id": "clinic_12", "reason": "Better fit" }
]
```

Returns per-assignment results:
```json
{
  "status": "success",
  "results": [
    { "assignment_id": "asgn_001", "status": "approved" },
    { "assignment_id": "asgn_002", "status": "rejected" },
    { "assignment_id": "asgn_003", "status": "modified", "old_target": "clinic_07", "new_target": "clinic_12" }
  ]
}
```

### Finalize

Lock the review. Requires all assignments to be reviewed (no `pending` status remaining).

```http
POST /results/{job_id}/finalize?reviewer=jane&include_rejected=false
```

Returns:
```json
{
  "status": "success",
  "job_id": "...",
  "finalized_by": "jane",
  "finalized_at": "2025-04-25T14:30:00",
  "approved_count": 148,
  "modified_count": 2,
  "rejected_count": 0,
  "total_final_assignments": 150
}
```

If there are still `pending` assignments, returns `status: "warning"` with a count. Use this to show a warning dialog instead of blocking the user.

### Final assignments (post-finalization)

```http
GET /results/{job_id}/final?page=1&page_size=100
```

Returns only approved + modified assignments, fully enriched. Use this for integration with downstream systems (e.g. HR software, scheduling tools).

### Export

```http
POST /results/{job_id}/export?format=csv
POST /results/{job_id}/export?format=json
```

Returns a **file download** (`StreamingResponse`). Resource and target columns are flattened with `resource_` and `target_` prefixes. Use `Content-Disposition` header to trigger browser download:

```js
const res = await fetch(`/results/${jobId}/export?format=csv`, { method: 'POST' });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `assignments_${jobId}.csv`;
a.click();
```

### AI-generated narrative summary

```http
POST /results/{job_id}/generate-summary
X-Google-Key: your-google-api-key
```

Uses Gemini to generate a natural language summary of the entire optimization. Response:

```json
{
  "job_id": "...",
  "session_id": "...",
  "summary": {
    "process_walkthrough": "The system ingested 150 nurse records and 30 clinic records. Using a genetic algorithm with population 200 over 100 generations, it optimised two objectives: specialization matching (70% weight) and capacity enforcement (30% weight). The best solution achieved a fitness score of 127.3...",
    "goal_alignment_analysis": "Specialization matching: 143 of 150 nurses (95.3%) were assigned to clinics matching their primary specialization. Example: Alice M. (Cardiology) → Cardiology Centre West (required: Cardiology). Capacity enforcement: No clinic exceeded its stated capacity. The maximum workload was 5 assignments at Central Hospital, exactly at its limit..."
  }
}
```

The summary uses the agent conversation history, goals configuration, GA metrics, and enriched sample assignments as context. Cache it on the client — it's expensive to generate.

---

## Configuration (manual overrides, Path B, or corrections)

These endpoints are not needed for Path A (unified chat handles config automatically). Use them for:
- Path B goal management
- Viewing what the AI saved
- Manually tweaking individual goals after the chat

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/config/dataset-info/{session_id}` | Column names + types from the ingested data |
| `GET` | `/config/goals/{session_id}` | Read current goals |
| `POST` | `/config/goals/{session_id}` | Replace all goals |
| `POST` | `/config/goals/{session_id}/add` | Add one goal |
| `PUT` | `/config/goals/{session_id}/{goal_id}` | Edit one goal |
| `DELETE` | `/config/goals/{session_id}/{goal_id}` | Remove one goal |
| `POST` | `/config/ga-params/{session_id}` | Override GA parameters |
| `GET` | `/config/ga-params/{session_id}` | Read current GA parameters |
| `POST` | `/config/validate/{session_id}` | Pre-flight check (column existence, weight sum) |
| `GET` | `/config/full/{session_id}` | Complete config dump |

---

## UI state machine (Path A)

```
IDLE
  ↓ user opens the app, generate sessionId
CHAT_INGESTION  (response.phase === "ingestion")
  │ show: chat thread
  │ show: file uploader (always available, not just when AI asks)
  │ show: goal_model.confidence progress bar (optional)
  │ show: data_context.status badge
  │ if action_taken === "await_data_upload" → make file picker very visible
  │ if data_preview → render analysis card below message
  │ if data_context.status in ["partial","complete"] → show dataset download buttons
  │   GET /ingest/chat/{sessionId}/datasets?table=resources
  │   GET /ingest/chat/{sessionId}/datasets?table=targets
  ↓ response.phase === "goal_definition"
CHAT_GOAL_DEFINITION
  │ show: chat thread
  │ show: goals panel (update after every turn with response.goals)
  │ hide: file uploader
  │ pre-fill GA form from response.ga_params
  │ when response.is_complete === true → enable "Run Optimization" button
  ↓ user clicks Run
OPTIMIZING
  │ connect EventSource /optimizations/progress/{jobId}
  │ show: progress bar (data.progress)
  │ show: live fitness chart (data.best_fitness + data.average_fitness)
  │ show: Cancel button → POST /optimizations/cancel/{jobId}
  ↓ SSE status === "completed"
REVIEW
  │ GET /results/{jobId}/summary  → header metrics
  │ GET /results/{jobId}/review   → assignment list
  │ show: approve / reject / modify per row
  │ show: Bulk approve-all button
  │ show: "Generate AI Summary" button → POST /results/{jobId}/generate-summary
  │ POST /results/{jobId}/finalize
  ↓ finalized
DONE
  │ GET /results/{jobId}/final  → final dataset
  │ POST /results/{jobId}/export?format=csv
```

---

## Gotchas

**1. `/ingest/chat` is multipart; `/agent/chat` is JSON — do not confuse them.**

The unified chat (`/ingest/chat`) accepts `multipart/form-data` because files can be attached.
The standalone agent chat (`/agent/chat`) accepts `application/json`. They are different endpoints with different purposes.

**2. Goals from unified chat are already saved — don't POST them again.**

In Phase A, every turn that returns `goals` has already saved them server-side to `config:{session_id}`. Calling `POST /config/goals` after that will create duplicates.

**3. `job_id` ≠ `session_id`.**

`POST /optimizations/run` returns a new `job_id`. The `session_id` stays constant through the whole session. Use `session_id` for everything before the run; use `job_id` for everything after.

**4. The finalize transition turn returns `is_complete: true` but `goals: null`.**

The turn that triggers `finalize` transitions the phase but runs no goal agent yet (goals come in the next turn). Use the `phase: "goal_definition"` + `is_complete: true` signal to update your UI, but wait for the first `goals` value in the next response before showing the goals panel.

**5. SSE closes when the job ends — reconnect for new runs.**

`EventSource` is a one-per-job connection. For a new run, open a new `EventSource` with the new `job_id`. Reusing the same object for a different `job_id` is not supported.

**6. `POST /results/{job_id}/finalize` returns a warning, not an error, if reviews are pending.**

`status: "warning"` means the call succeeded but there are still `pending` assignments. Show a dialog like "143 assignments are still pending review. Finalize anyway?" and call again only if the user confirms (use `/approve-all` first or just call finalize a second time).

**7. Export is a streaming file download, not a JSON response.**

`POST /results/{job_id}/export` sends a `StreamingResponse` with `Content-Disposition: attachment`. Handle it with blob + object URL (see Export section above), not `res.json()`.

**8. Session TTL is 7 days — no explicit delete endpoint.**

Generate a new `sessionId` to effectively start a new session. Old sessions expire automatically.

**9. Dataset download returns `404` until data exists — check per-table.**

`GET /ingest/chat/{session_id}/datasets?table=resources` returns `404` if resources haven't been produced yet. Do not show a download button for a table until `data_context.resources_metadata` (or `targets_metadata`) is non-null. Check each table independently — one can be ready before the other.

**10. Dataset download works regardless of how the data was produced.**

The same `GET /ingest/chat/{session_id}/datasets` endpoint serves data from file uploads, synthetic generation, augmentation, and missing-table generation equally. You do not need to track which path produced the data — just check that the session exists and the table is non-null.

---

## Health endpoints

```http
GET /health          → full health check (status, redis, uptime, version)
GET /health/ready    → readiness probe (checks Redis) — for Kubernetes
GET /health/live     → liveness probe (always 200) — for Kubernetes
GET /stats           → active jobs count, memory usage
```
