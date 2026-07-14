import type { ReactNode } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import MarketingNav from "@/components/Marketing/MarketingNav";
import MarketingFooter from "@/components/Marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Docs — Intellign",
  description:
    "Everything you need to build with Intellign: the web app, the public API, the Python SDK, and the MCP server for AI agents.",
  alternates: { canonical: "/docs" },
};

const DOCS_VERSION = "1.0.0";
const LAST_UPDATED = "July 14, 2026";

// ---------------------------------------------------------------------------
// Code samples
// ---------------------------------------------------------------------------

const CURL_EXAMPLE = `KEY=ik_test_...

# 1. Create a problem (inline data)
curl -s -X POST https://api.intellign.ai/api/public/v1/problems \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{
  "spec": {
    "problem_type": "assignment",
    "entities": {"rows": [
      {"id": "n1", "skills": "triage"}, {"id": "n2", "skills": "surgery"}]},
    "targets": {"rows": [
      {"id": "c1", "required_skills": "triage", "capacity": 1},
      {"id": "c2", "required_skills": "surgery", "capacity": 1}]},
    "objectives": [{"metric": "skill_match", "weight": 70,
                    "entity_column": "skills", "target_column": "required_skills"}],
    "constraints": [{"expression": "entity.skills superset_of target.required_skills"}]
  }}'
# → {"problem_id": "...", "status": "draft", "goals_compiled": 2}

# 2. Solve it
curl -s -X POST https://api.intellign.ai/api/public/v1/problems/<problem_id>/solve \\
  -H "Authorization: Bearer $KEY"
# → {"job_id": "..."}

# 3. Poll, then fetch the plan
curl -s https://api.intellign.ai/api/public/v1/jobs/<job_id> -H "Authorization: Bearer $KEY"
curl -s https://api.intellign.ai/api/public/v1/jobs/<job_id>/result -H "Authorization: Bearer $KEY"`;

const PROBLEMSPEC_JSON = `{
  "spec_version": "1",
  "problem_type": "assignment",       // assignment | scheduling | routing | allocation | matching
  "name": "optional label",
  "description": "optional — used when explaining results",
  "entities": {"rows": [...]},          // OR {"dataset_id": "ds_..."}; id column default "id"
  "targets":  {"dataset_id": "ds_..."},
  "objectives": [                        // at least one
    {"metric": "skill_match", "weight": 70, "direction": "maximize",
     "entity_column": "skills", "target_column": "required_skills"}
  ],
  "constraints": [                       // optional
    {"expression": "entity.skills superset_of target.required_skills", "hard": true}
  ],
  "solver_params": {"time_budget_seconds": 60, "generations": null,
                    "population_size": null, "solver_preference": null},
  "quality_mode": "balanced"            // fast | balanced | best
}`;

const ERROR_SHAPE_JSON = `{"error": {"code": "problem_not_found", "message": "…", "request_id": "abc123"}}`;

const WEBHOOK_CREATE = `POST /webhooks {"url": "...", "events": ["job.completed", "job.failed"]}
# → response includes a "secret" — shown once`;

const WEBHOOK_BODY_JSON = `{"event": "job.completed", "data": {"job_id", "problem_id", "status", "best_fitness"}}`;

const SDK_INSTALL = `pip install intellign                  # core
pip install "intellign[pandas]"        # + result.to_dataframe()
pip install "intellign[ical]"          # + result.export_ical()
pip install "intellign[mcp]"           # + the MCP server`;

const SDK_QUICKSTART = `from intellign import Client, Problem

client = Client(api_key="ik_test_...")   # base_url defaults to api.intellign.ai

problem = (
    Problem.assignment(name="Nurse assignment")
    .entities(rows=[{"id": "n1", "skills": "triage"},
                    {"id": "n2", "skills": "surgery"}])
    .targets(rows=[{"id": "c1", "required_skills": "triage", "capacity": 1},
                   {"id": "c2", "required_skills": "surgery", "capacity": 1}])
    .maximize("skill_match", weight=70,
              entity_column="skills", target_column="required_skills")
    .require("entity.skills superset_of target.required_skills")
    .quality("fast")
)

result = client.submit(problem).wait()
for a in result.assignments:
    print(a["resource_id"], "->", a["target_id"])`;

const SDK_ASYNC = `from intellign import AsyncClient

async with AsyncClient(api_key="ik_...") as client:
    job = await client.submit(problem)
    async for event in job.stream_progress():
        print(event.get("current_generation"), event.get("best_fitness"))
    result = await job.result()`;

const MCP_CLAUDE_CODE = `claude mcp add --transport http intellign https://mcp.intellign.ai/mcp \\
  --header "Authorization: Bearer ik_..."`;

const MCP_CLAUDE_DESKTOP = `{"mcpServers": {"intellign": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "https://mcp.intellign.ai/mcp",
           "--header", "Authorization: Bearer \${INTELLIGN_API_KEY}"],
  "env": {"INTELLIGN_API_KEY": "ik_..."}}}}`;

const MCP_LOCAL = `pip install "intellign[mcp]"
INTELLIGN_API_KEY=ik_... intellign-mcp`;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function CodeBlock({ label, code }: { label?: string; code: string }) {
  return (
    <div className="docs-code">
      {label && <div className="docs-code__label">{label}</div>}
      <pre className="code-block" style={{ whiteSpace: "pre-wrap" }}>
        {code}
      </pre>
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function C({ children }: { children: ReactNode }) {
  return <code>{children}</code>;
}

const TOC: { id: string; label: string; children?: { id: string; label: string }[] }[] = [
  { id: "overview", label: "Overview" },
  { id: "getting-started", label: "Getting started" },
  {
    id: "public-api",
    label: "Public API",
    children: [
      { id: "api-quickstart", label: "Quickstart" },
      { id: "problemspec-format", label: "ProblemSpec format" },
      { id: "objectives", label: "Objectives" },
      { id: "constraint-grammar", label: "Constraint grammar" },
      { id: "endpoints", label: "Endpoints" },
      { id: "errors", label: "Errors" },
      { id: "idempotency-retries", label: "Idempotency & retries" },
      { id: "webhooks", label: "Webhooks" },
    ],
  },
  {
    id: "python-sdk",
    label: "Python SDK",
    children: [
      { id: "sdk-quickstart", label: "Quickstart" },
      { id: "client-surface", label: "Client surface" },
      { id: "async-progress", label: "Async + live progress" },
      { id: "sdk-error-handling", label: "Error handling" },
    ],
  },
  {
    id: "mcp-server",
    label: "MCP server",
    children: [
      { id: "mcp-connect", label: "Connect" },
      { id: "mcp-tools", label: "Tools" },
      { id: "mcp-prompts", label: "Prompts that work well" },
    ],
  },
  { id: "troubleshooting", label: "Troubleshooting & FAQ" },
  { id: "changelog", label: "Changelog" },
];

export default function DocsPage() {
  return (
    <div className="mk-page">
      <MarketingNav />
      <main>
        <section className="mk-container docs-hero">
          <div className="eyebrow">Documentation</div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              lineHeight: 1.1,
              margin: "16px 0 12px",
            }}
          >
            Build with <em style={{ fontStyle: "italic", color: "var(--brand-maroon)" }}>Intellign</em>.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--neutral-700)", maxWidth: 680, margin: 0 }}>
            Intellign solves resource-allocation problems — who goes where, what runs
            when. This page covers the web app, the public API, the Python SDK, and
            the MCP server, all backed by the same account and engine.
          </p>
          <div className="docs-surfaces">
            <a href="https://intellign.ai" target="_blank" rel="noopener noreferrer">
              Web app · intellign.ai
            </a>
            <a href="https://api.intellign.ai/docs" target="_blank" rel="noopener noreferrer">
              API · api.intellign.ai
            </a>
            <a href="https://pypi.org/project/intellign/" target="_blank" rel="noopener noreferrer">
              SDK · pypi.org/project/intellign
            </a>
            <a href="https://mcp.intellign.ai/" target="_blank" rel="noopener noreferrer">
              MCP · mcp.intellign.ai
            </a>
          </div>
          <p className="docs-meta">
            docs v{DOCS_VERSION} · last updated {LAST_UPDATED}
          </p>
        </section>

        <div className="mk-container docs-layout">
          <nav className="docs-sidebar" aria-label="Documentation sections">
            {TOC.map((item) => (
              <div className="docs-sidebar__group" key={item.id}>
                <a href={`#${item.id}`} className="docs-sidebar__group-title" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--fg-secondary)", padding: 0 }}>
                  {item.label}
                </a>
                {item.children?.map((child) => (
                  <a href={`#${child.id}`} className="is-sub" key={child.id}>
                    {child.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <div className="docs-content">
            {/* ---------------------------------------------------------- */}
            <section id="overview">
              <h2>Overview — what Intellign does</h2>
              <p>
                Intellign solves <strong>resource-allocation problems</strong>: who goes
                where, what runs when, how to use limited people, vehicles, budget, or
                time well.
              </p>
              <p>
                You describe a problem — &ldquo;assign 40 nurses to 6 clinics so skills
                match and nobody is overloaded&rdquo; — attach your data (a spreadsheet is
                enough, and if you have no data Intellign can generate a realistic
                sample), and get back an <strong>optimized, explainable plan</strong>.
                Real optimization engines do the math (genetic algorithms, CP-SAT,
                OR-Tools); AI handles the understanding, data-gap filling, and
                plain-language explanation.
              </p>

              <h3 id="four-ways-to-use-intellign">The four ways to use Intellign</h3>
              <DataTable
                head={["Surface", "Best for", "Where"]}
                rows={[
                  [
                    "Web app",
                    "Anyone — chat your way from problem to plan",
                    <a key="app" href="https://intellign.ai" target="_blank" rel="noopener noreferrer">intellign.ai</a>,
                  ],
                  [
                    "Public API",
                    "Developers integrating optimization into their systems",
                    <C key="api">api.intellign.ai/api/public/v1</C>,
                  ],
                  [
                    "Python SDK",
                    "Python developers — typed client, no HTTP plumbing",
                    <C key="sdk">pip install intellign</C>,
                  ],
                  [
                    "MCP server",
                    "AI agents (Claude etc.) calling Intellign as tools",
                    <C key="mcp">mcp.intellign.ai/mcp</C>,
                  ],
                ]}
              />
              <p>
                All four run on the same engine and the same account: an API key made
                in the dashboard works for the API, the SDK, and the MCP server.
              </p>

              <h3 id="five-concepts">Five concepts (the whole mental model)</h3>
              <ol>
                <li>
                  <strong>Entities</strong> — the resources being assigned (nurses, vans,
                  field officers). A table with an <C>id</C> column.
                </li>
                <li>
                  <strong>Targets</strong> — what receives them (clinics, routes,
                  districts). Also a table.
                </li>
                <li>
                  <strong>Objectives</strong> — what &ldquo;good&rdquo; means, with weights.
                  E.g. <C>skill_match</C> at weight 70, <C>workload_balance</C> at 30.
                </li>
                <li>
                  <strong>Constraints</strong> — hard rules the plan should respect,
                  written in a small formal grammar: <C>entity.skills superset_of target.required_skills</C>.
                </li>
                <li>
                  <strong>Jobs</strong> — solving runs asynchronously; you submit a
                  problem, get a <C>job_id</C>, and poll / stream / get a webhook when
                  the plan is ready.
                </li>
              </ol>
            </section>

            {/* ---------------------------------------------------------- */}
            <section id="getting-started">
              <h2>Getting started</h2>
              <ol>
                <li>
                  <strong>Create an account</strong> at{" "}
                  <a href="https://intellign.ai" target="_blank" rel="noopener noreferrer">intellign.ai</a>.
                </li>
                <li>
                  <strong>Create an API key</strong>: Dashboard → API Keys.
                  <ul>
                    <li><C>ik_live_...</C> — production. Solves count against your plan.</li>
                    <li>
                      <C>ik_test_...</C> — <strong>sandbox</strong>: free, doesn&apos;t touch
                      quota, capped at 200 entities / 200 targets and shorter solver
                      runs. Start here.
                    </li>
                    <li>The key is shown <strong>once</strong> — store it like a password.</li>
                  </ul>
                </li>
                <li><strong>Pick your surface</strong> and run the 2-minute example in its section below.</li>
              </ol>
              <p>
                <strong>Plans &amp; limits</strong> (per key, per minute): free 30
                requests, pro 120, enterprise 600. Monthly solve quotas follow your
                org&apos;s plan.
              </p>
            </section>

            {/* ---------------------------------------------------------- */}
            <section id="public-api">
              <h2>Public API</h2>
              <p>
                Base URL: <C>https://api.intellign.ai/api/public/v1</C><br />
                Auth on every request: <C>Authorization: Bearer ik_...</C><br />
                Interactive OpenAPI docs:{" "}
                <a href="https://api.intellign.ai/docs" target="_blank" rel="noopener noreferrer">
                  api.intellign.ai/docs
                </a>
              </p>

              <h3 id="api-quickstart">Two-minute example (curl)</h3>
              <CodeBlock code={CURL_EXAMPLE} />

              <h3 id="problemspec-format">The ProblemSpec format</h3>
              <p>
                Everything the headless API solves is a <strong>ProblemSpec</strong>{" "}
                (version <C>&quot;1&quot;</C>):
              </p>
              <CodeBlock code={PROBLEMSPEC_JSON} />
              <p>
                Rules: inline <C>rows</C> max 2,000 (use datasets beyond that); weights{" "}
                <C>(0, 100]</C>; exactly one of <C>rows</C>/<C>dataset_id</C> per side.
              </p>

              <h3 id="objectives">Objectives (metric catalog)</h3>
              <DataTable
                head={["Metric", "Meaning", "Needs"]}
                rows={[
                  ["skill_match", "entity's skill set covers the target's requirements", <><C key="1">entity_column</C>, <C key="2">target_column</C></>],
                  ["distance", "prefer geographically closer pairings (lat/lon columns)", "—"],
                  ["workload_balance", "penalize uneven load vs target capacity", <C key="1">target_column</C>],
                  ["attribute_match", "exact categorical match", <><C key="1">entity_column</C>, <C key="2">target_column</C></>],
                  ["cost", "minimize a numeric entity column", <C key="1">entity_column</C>],
                  ["preference_match", "scheduling preference alignment", "—"],
                ].map((r) => r.map((c, i) => (i === 0 ? <C key="m">{c as string}</C> : c)))}
              />
              <p>
                Always current version: <C>GET /capabilities</C> (also lists solvers,
                grammar, limits).
              </p>

              <h3 id="constraint-grammar">Constraint grammar</h3>
              <p>Six forms — anything else is rejected at create time with a precise reason:</p>
              <DataTable
                head={["Form", "Example"]}
                rows={[
                  [<C key="f">entity.{"{a}"} superset_of target.{"{b}"}</C>, <C key="e">entity.skills superset_of target.required_skills</C>],
                  [<C key="f">entity.{"{a}"} &lt;op&gt; target.{"{b}"}</C>, <><C key="e">entity.hours &lt;= target.max_hours</C> (<C key="ops">&lt;= &gt;= == &lt; &gt;</C>)</>],
                  [<C key="f">entity.{"{a}"} &lt;op&gt; &lt;number&gt;</C>, <C key="e">entity.age &gt;= 21</C>],
                  [<C key="f">sum(entity.{"{a}"}) &lt;op&gt; target.{"{b}"}</C>, <C key="e">sum(entity.load) &lt;= target.capacity</C>],
                  [<C key="f">haversine(entity.{"{a}"}, target.{"{b}"}) &lt;= km</C>, <C key="e">haversine(entity.location, target.location) &lt;= 25</C>],
                  [<C key="f">entity.{"{a}"} in [values]</C>, <C key="e">entity.region in [&apos;north&apos;, &apos;east&apos;]</C>],
                ]}
              />
              <p><C>&quot;hard&quot;: true</C> (default) = violation weight 100; soft = 60.</p>

              <h3 id="endpoints">Endpoints</h3>
              <DataTable
                head={["Method + path", "Purpose"]}
                rows={[
                  [<C key="1">GET /capabilities</C>, "Metric catalog, grammar, solvers, limits — machine-readable"],
                  [<><C key="1">GET /templates</C> · <C key="2">GET /templates/{"{name}"}</C></>, "Starter ProblemSpecs to copy and edit"],
                  [<>POST /datasets (multipart <C key="1">file</C>)</>, <>Upload CSV/XLSX (≤10 MB, ≤50k rows) → <C key="1">dataset_id</C>; 7-day retention</>],
                  [<C key="1">GET /datasets/{"{id}"}</C>, "Metadata + preview"],
                  [<C key="1">POST /problems</C>, <>Register a spec → <C key="1">problem_id</C> (validates + compiles immediately)</>],
                  [<C key="1">GET /problems/{"{id}"}</C>, "Spec + status + last job"],
                  [<C key="1">POST /problems/{"{id}"}/solve</C>, <>Start solving → <C key="1">job_id</C> (202)</>],
                  [<C key="1">GET /jobs/{"{id}"}</C>, <>Status + progress (<C key="1">best_fitness</C>, generation)</>],
                  [<C key="1">GET /jobs/{"{id}"}/stream</C>, "Server-Sent Events live progress"],
                  [<C key="1">GET /jobs/{"{id}"}/result</C>, "The plan: assignments, metrics; 409 while running"],
                  [<C key="1">POST /solve</C>, <>Natural-language one-shot: <C key="1">{"{problem, entities_dataset_id, targets_dataset_id}"}</C></>],
                  [<><C key="1">POST /webhooks</C> · <C key="2">GET /webhooks</C> · <C key="3">DELETE /webhooks/{"{id}"}</C></>, "Completion notifications (max 5 endpoints)"],
                  [<C key="1">GET /webhooks/{"{id}"}/deliveries</C>, "Delivery log (last 50 attempts)"],
                  [<><C key="1">POST /sessions</C> · <C key="2">/sessions/{"{id}"}/messages</C> · <C key="3">GET /sessions/{"{id}"}</C></>, "Conversational flow over the API"],
                  [<><C key="1">POST /sessions/{"{id}"}/optimize</C> · <C key="2">GET /sessions/{"{id}"}/export</C></>, "Run a ready session; export it as a ProblemSpec"],
                ]}
              />

              <h3 id="errors">Errors</h3>
              <p>Every error has one shape:</p>
              <CodeBlock code={ERROR_SHAPE_JSON} />
              <p>Quote <C>request_id</C> when contacting support.</p>
              <DataTable
                head={["Code", "HTTP", "Meaning"]}
                rows={[
                  [<C key="1">invalid_api_key</C>, "401", "missing / unknown / expired key"],
                  [<C key="1">insufficient_scope</C>, "403", <>key lacks <C key="1">solve</C> or <C key="2">read</C> scope</>],
                  [<C key="1">invalid_spec</C>, "400/422", "bad spec, constraint, or upload — message lists every issue"],
                  [<C key="1">*_not_found</C>, "404", "dataset / problem / job / template / webhook / session"],
                  [<C key="1">dataset_too_large</C>, "413", ">10 MB or >50k rows"],
                  [<C key="1">job_not_finished</C>, "409", "result requested before completion"],
                  [<C key="1">quota_exceeded</C>, "402", "monthly plan limit reached"],
                  [<C key="1">rate_limited</C>, "429", <>slow down — honor the <C key="1">Retry-After</C> header</>],
                  [<C key="1">sandbox_limit_exceeded</C>, "403", <><C key="1">ik_test_</C> size caps</>],
                  [<C key="1">idempotency_conflict</C>, "409", "same Idempotency-Key currently in flight"],
                ]}
              />

              <h3 id="idempotency-retries">Idempotency &amp; retries</h3>
              <p>
                Send <C>Idempotency-Key: &lt;any-unique-string&gt;</C> on POSTs; replays
                within 24 h return the original response instead of duplicating work.
                Safe to retry 429/5xx with backoff.
              </p>

              <h3 id="webhooks">Webhooks</h3>
              <CodeBlock code={WEBHOOK_CREATE} />
              <ul>
                <li>
                  Headers: <C>X-Intellign-Event</C>,{" "}
                  <C>X-Intellign-Signature: sha256=&lt;HMAC-SHA256(secret, raw_body)&gt;</C>
                </li>
                <li>Body: <C>{WEBHOOK_BODY_JSON}</C></li>
                <li>
                  Verify with a constant-time compare on the <strong>raw</strong> body.
                  Non-2xx → up to 3 attempts (1s/2s backoff), all logged in{" "}
                  <C>/webhooks/{"{id}"}/deliveries</C>.
                </li>
              </ul>
            </section>

            {/* ---------------------------------------------------------- */}
            <section id="python-sdk">
              <h2>Python SDK</h2>
              <CodeBlock code={SDK_INSTALL} />
              <p>
                Python ≥ 3.10. Source + runnable examples:{" "}
                <a href="https://github.com/DataBacked-Africa/intellign-python" target="_blank" rel="noopener noreferrer">
                  github.com/DataBacked-Africa/intellign-python
                </a>
              </p>

              <h3 id="sdk-quickstart">Two-minute example</h3>
              <CodeBlock code={SDK_QUICKSTART} />

              <h3 id="client-surface">Client surface (sync <C>Client</C> / async <C>AsyncClient</C> — same methods)</h3>
              <DataTable
                head={["Area", "Methods"]}
                rows={[
                  ["Discovery", <><C key="1">capabilities()</C>, <C key="2">templates()</C>, <C key="3">template(name)</C></>],
                  ["Data", <><C key="1">upload_dataset(path)</C>, <C key="2">get_dataset(id)</C></>],
                  ["Problems", <><C key="1">create_problem(spec_or_builder)</C>, <C key="2">get_problem(id)</C>, <C key="3">solve_problem(id)</C>, <C key="4">submit(spec_or_builder)</C></>],
                  ["Natural language", <C key="1">solve_nl(text, entities_dataset_id, targets_dataset_id)</C>],
                  ["Jobs", <><C key="1">Job.status()</C>, <C key="2">.wait(timeout=300)</C>, <C key="3">.result()</C>, <C key="4">.stream_progress()</C></>],
                  ["Results", <><C key="1">.assignments</C>, <C key="2">.metrics</C>, <C key="3">.best_fitness</C>, <C key="4">.to_dataframe()</C>, <C key="5">.export_ical(path)</C></>],
                  ["Webhooks", <><C key="1">create_webhook(url)</C>, <C key="2">list_webhooks()</C>, <C key="3">delete_webhook(id)</C>, <C key="4">webhook_deliveries(id)</C></>],
                  ["Sessions", <><C key="1">create_session()</C>, <C key="2">send_message(id, text)</C>, <C key="3">session_state(id)</C>, <C key="4">optimize_session(id)</C>, <C key="5">export_session(id)</C></>],
                ]}
              />
              <p>
                Builder verbs: <C>.entities()</C>/<C>.targets()</C> (rows or{" "}
                <C>dataset_id=</C>), <C>.maximize()</C>/<C>.minimize(metric, weight, ...)</C>,{" "}
                <C>.require(expr, hard=True)</C>, <C>.quality(&quot;fast|balanced|best&quot;)</C>,{" "}
                <C>.time_budget(s)</C>, <C>.generations(n)</C>, <C>.population(n)</C>,{" "}
                <C>.solver(name)</C>, <C>.describe(text)</C> → <C>.build()</C>.
              </p>

              <h3 id="async-progress">Async + live progress</h3>
              <CodeBlock code={SDK_ASYNC} />

              <h3 id="sdk-error-handling">Error handling</h3>
              <p>
                Every API failure raises a typed subclass of <C>IntelligError</C> with{" "}
                <C>.code</C>, <C>.status_code</C>, <C>.request_id</C>:{" "}
                <C>AuthenticationError, ScopeError, InvalidSpecError, NotFoundError, ConflictError, QuotaError, RateLimitError (.retry_after), SandboxLimitError, SolveFailedError, ServerError</C>.
              </p>
              <p>
                The client auto-retries 429/502/503/504 (honoring <C>Retry-After</C>),
                and <C>create_problem</C>/<C>solve_problem</C> accept <C>idempotency_key=</C>.
              </p>
            </section>

            {/* ---------------------------------------------------------- */}
            <section id="mcp-server">
              <h2>MCP server (Intellign for AI agents)</h2>
              <p>
                The MCP server exposes Intellign as tools any MCP-compatible AI can
                call. Hosted at <C>https://mcp.intellign.ai/mcp</C> (Streamable HTTP,
                multi-tenant: your request&apos;s <C>Authorization</C> header carries{" "}
                <strong>your</strong> key, so your quota, limits, and data scoping
                apply). A human-readable overview lives at{" "}
                <a href="https://mcp.intellign.ai/" target="_blank" rel="noopener noreferrer">
                  mcp.intellign.ai
                </a>.
              </p>

              <h3 id="mcp-connect">Connect</h3>
              <p>Claude Code:</p>
              <CodeBlock code={MCP_CLAUDE_CODE} />
              <p>Claude Desktop (no remote header support yet — bridge via mcp-remote):</p>
              <CodeBlock code={MCP_CLAUDE_DESKTOP} />
              <p>Local/offline alternative:</p>
              <CodeBlock code={MCP_LOCAL} />

              <h3 id="mcp-tools">Tools</h3>
              <DataTable
                head={["Tool", "What it does"]}
                rows={[
                  [<C key="1">list_templates</C>, "list starter problems"],
                  [<C key="1">get_template(name)</C>, "fetch a full editable ProblemSpec"],
                  [<C key="1">create_problem(spec)</C>, <>register a spec → <C key="1">problem_id</C> (returns readable errors the model can fix)</>],
                  [<C key="1">solve_problem(problem_id, wait=True, timeout_s=60)</C>, <>solve; returns assignments, or <C key="1">job_id</C> if async</>],
                  [<><C key="1">get_status(job_id)</C> / <C key="2">get_result(job_id)</C></>, "poll long solves"],
                ]}
              />
              <p>
                Resources: <C>intellign://schema/spec</C> (ProblemSpec JSON schema),{" "}
                <C>intellign://capabilities</C> (live catalog).
              </p>

              <h3 id="mcp-prompts">Prompts that work well</h3>
              <ul>
                <li>
                  &ldquo;Get the nurse clinic assignment template from Intellign,
                  replace the nurses with [my data], solve it, and show me who goes
                  where.&rdquo;
                </li>
                <li>
                  &ldquo;Create an Intellign problem assigning these 12 drivers to 5
                  zones, maximizing zone preference match — read{" "}
                  <C>intellign://schema/spec</C> first.&rdquo;
                </li>
              </ul>
            </section>

            {/* ---------------------------------------------------------- */}
            <section id="troubleshooting">
              <h2>Troubleshooting &amp; FAQ</h2>
              <dl className="docs-faq">
                <dt>401 invalid_api_key</dt>
                <dd>Key missing/typo&apos;d, or revoked. Keys are shown once at creation; make a new one if lost.</dd>

                <dt>403 sandbox_limit_exceeded</dt>
                <dd><C>ik_test_</C> keys cap at 200 entities/targets. Use a live key for bigger problems.</dd>

                <dt>422 invalid_spec</dt>
                <dd>
                  The message lists every problem (<C>objectives[0]: entity_column is required…</C>).
                  Fix all listed items; the <a href="#constraint-grammar">grammar section above</a> shows valid constraint forms.
                </dd>

                <dt>409 job_not_finished</dt>
                <dd>
                  The solve is still running; poll <C>GET /jobs/{"{id}"}</C> until
                  status is <C>completed</C>/<C>failed</C> (compare case-insensitively),
                  or use webhooks / <C>job.wait()</C>.
                </dd>

                <dt>429 rate_limited</dt>
                <dd>Respect <C>Retry-After</C>. SDK does this automatically.</dd>

                <dt>Webhook signature won&apos;t verify</dt>
                <dd>You must HMAC the <strong>raw request body</strong> bytes, not re-serialized JSON.</dd>

                <dt>Can Intellign generate data for me?</dt>
                <dd>
                  Yes, in the web app / sessions flow: describe the problem and ask for
                  a sample dataset. The headless API expects you to bring data (inline
                  rows or uploaded datasets).
                </dd>

                <dt>How fresh are key/plan changes?</dt>
                <dd>Auth context is cached up to 10 minutes; a revoked key or plan change can take that long to propagate.</dd>
              </dl>
            </section>

            {/* ---------------------------------------------------------- */}
            <section id="changelog">
              <h2>Changelog</h2>
              <DataTable
                head={["Date", "Version", "Area", "Change"]}
                rows={[
                  ["2026-07-14", DOCS_VERSION, "all", "Initial version: API v1, SDK 0.1.x, MCP (hosted, multi-tenant)"],
                ]}
              />
            </section>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/demo" className="btn btn-primary">Try the live demo</Link>
              <Link href="/workspace" className="btn btn-secondary">Launch app</Link>
              <a href="mailto:hello@databackedafrica.com" className="btn btn-ghost">Ask a question</a>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
