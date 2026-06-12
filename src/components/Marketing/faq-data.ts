// Plain data module (NOT "use client") so both the server page (JSON-LD)
// and the client Faq component can import the same source of truth.
export const FAQ_ITEMS = [
  {
    q: "What kinds of problems can Intellign solve?",
    a: "Assignment, scheduling, matching, allocation and routing problems — who does what, who goes where, what gets which share. Staff rostering, field-worker deployment, teacher placement, delivery routing, budget allocation.",
  },
  {
    q: "Do I need my own data to try it?",
    a: "No. Describe the problem and Intellign generates a realistic sample dataset in about 40 seconds — two linked tables matched to your domain. You can also upload CSV, Excel, JSON, Parquet or GeoPackage files, and processing starts the moment the file is attached.",
  },
  {
    q: "How is this different from asking an LLM directly?",
    a: "LLMs estimate; solvers prove. Intellign uses the LLM only to understand your goal and translate it into a formal optimization problem — the actual assignment comes from mathematical solvers (genetic algorithms, constraint programming). Every solution is feasible, scored, and explained per decision.",
  },
  {
    q: "Can my AI agent call Intellign as a tool?",
    a: "Yes — that's the point of the Python SDK and MCP server. When your agent needs an optimization answer, it calls Intellign's solve endpoint and receives structured assignments with rationale. pip install intellign.",
  },
  {
    q: "How long does a solve take?",
    a: "Typical problems (tens to hundreds of resources) solve in seconds. You watch convergence live, and you get notified in-app if you've navigated away when it finishes.",
  },
  {
    q: "Can I trust the results?",
    a: "Every assignment ships with a human-readable rationale and a score breakdown per goal. You can approve, modify or reject each one. If the primary solver is ever unavailable, results are clearly labeled as approximate — never silently degraded.",
  },
];
