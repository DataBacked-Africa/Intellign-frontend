// Plain data for the landing (no "use client"), ported from docs/intellign-landing.html.
// Numbers in CASES come from recorded runs; see the case-study notes in each entry.

export const SITE_EMAIL = "adeolad@intellign.ai";

/* ---------- hero: sentence to plan ---------- */
export type TokKind = "res" | "tgt" | "hor" | "hard" | "soft" | "obj";
export type TokStatus = "ok" | "ask" | "block";
export interface Tok { text: string; k: TokKind; formal: string; st: TokStatus; note: string }
export type Part = string | Tok;
export interface Domain { label: string; plan: string; parts: Part[] }

const t = (text: string, k: TokKind, formal: string, st: TokStatus, note: string): Tok => ({ text, k, formal, st, note });

export const KIND_LABEL: Record<TokKind, string> = { res: "Who or what", tgt: "Where", hor: "When", hard: "Must-follow rule", soft: "Nice to have", obj: "Goal" };
export const STATUS_LABEL: Record<TokStatus, string> = { ok: "Ready", ask: "Asks you", block: "Needs more data" };

export const DOMAINS: Record<string, Domain> = {
  health: {
    label: "Nurse roster",
    plan: "84 shifts filled across 3 wards, 0 rules broken, solved in 4.2 s. Each shift has a reason.",
    parts: [
      "Roster ", t("our 24 nurses", "res", "24 nurses from staff.csv", "ok", "These are the people Intellign will place."),
      " across ", t("3 wards", "tgt", "Ward 1, Ward 2, Ward 3", "ok", "These are the places that need covering."),
      " for ", t("next week", "hor", "Mon to Sun, day and night shifts", "ok", "Intellign assumes 12-hour shifts and asks you to confirm."),
      ". ", t("Nobody works more than 3 nights in a row", "hard", "nights in a row ≤ 3, for every nurse", "ok", "This rule is checked again after solving, and any violation is flagged."),
      ", ", t("every ward has a senior nurse on each shift", "hard", "senior nurses per shift ≥ 1, for every ward", "ask", "Skill level is missing for 3 nurses. Intellign asks who is senior instead of guessing."),
      ", and ", t("spread weekends fairly", "soft", "keep weekend counts as even as possible", "ok", "Followed as closely as possible, without breaking a must-follow rule."),
      ".",
    ],
  },
  logistics: {
    label: "Delivery routes",
    plan: "12 van routes covering 140 stops, every delivery window met, with arrival times per stop.",
    parts: [
      "Plan tomorrow's routes for ", t("our 12 vans", "res", "12 vans from fleet.csv", "ok", "These are the vehicles Intellign will route."),
      " to ", t("140 orders", "tgt", "140 stops from orders.xlsx", "ok", "Every order is visited exactly once."),
      ", ", t("inside each customer's delivery window", "hard", "arrive between open and close, for every stop", "ok", "A route that misses a window is flagged."),
      ", ", t("no van over 1.2 tonnes", "hard", "load ≤ 1,200 kg, for every van", "ok", "Checked for each van on each route."),
      ", and ", t("use as little fuel as possible", "obj", "smallest total fuel use", "ask", "Fuel rates are missing. Intellign suggests using distance instead and asks you first."),
      ".",
    ],
  },
  claims: {
    label: "Insurance claims",
    plan: "3,000 claims shared across 9 reviewers, no one over 400. One goal is saved and waiting for billing data.",
    parts: [
      "Share ", t("this month's 3,000 claims", "res", "3,000 claims from claims.csv", "ok", "These are the claims to assign."),
      " between ", t("our 9 reviewers", "tgt", "9 reviewers from reviewers.csv", "ok", "These are the people who review them."),
      ". ", t("Match each claim to the right specialty", "hard", "claim specialty must match reviewer skill", "ok", "Wrong pairings are ruled out before solving."),
      ", ", t("nobody gets more than 400", "hard", "claims per reviewer ≤ 400", "ok", "A hard cap for every reviewer."),
      ", and ", t("flag providers with unusual billing", "soft", "saved as a goal, waiting for data", "block", "Kept, not dropped. This file has no billing history, so Intellign tells you what it needs."),
      ".",
    ],
  },
};

/* ---------- story: sheets + rail ---------- */
export const STORY_STEPS = [
  { id: "step-connect", kicker: "01 · Connect", title: "Bring your data as it is.", body: "Upload a spreadsheet or connect the system you already use. No setup project.", pills: ["staff.csv", "leave.xlsx", "your HR system"] },
  { id: "step-check", kicker: "02 · Check", title: "We find what's missing in your data before it costs you.", body: "A blank skill level today is a bad shift next week. Intellign flags the gap and asks you. It never fills it with made-up rows.", pills: ["skill level missing for 3 nurses", "asked you"] },
  { id: "step-understand", kicker: "03 · Understand", title: "Say what you need in plain English.", body: "Each sentence becomes a rule the computer can follow. You see the rules before anything runs.", pills: ["“nobody works 4 nights in a row”", "nights in a row ≤ 3"] },
  { id: "step-solve", kicker: "04 · Solve", title: "The math finds the best plan.", body: "Real solvers, not guesses. Every rule is checked again before you see the result.", pills: ["quality score shown", "rules re-checked", "solver named"] },
  { id: "step-plan", kicker: "05 · Your plan", title: "Get a plan you can explain.", body: "Every assignment comes with a reason. Change one thing and the rest re-plans around it.", why: ["Why is Amaka off on Saturday?", "She works nights Wednesday to Friday. A fourth night would break your rule."] },
  { id: "step-all", kicker: "That is the whole stack", title: "One sentence in. One proven plan out.", body: "Usually in seconds, and in three messages or fewer.", cta: true },
] as const;

export const ROSTER_PATTERN = "101101001011010110100101101011010110100101";

/* ---------- connect ---------- */
export type SourceKey = "sheet" | "emr" | "hr" | "tms" | "data" | "agent";
export type DestKey = "sheets" | "calendar" | "file" | "system";
export type IconName = "sheet" | "clinic" | "hr" | "fleet" | "code" | "assistant" | "calendar" | "file" | "system";
export type MethodKey = "upload" | "rest" | "python" | "mcp";

export interface Source {
  label: string; icon: IconName; method: string; mode: "no" | "yes"; code: MethodKey;
  packets: string[]; rows: number; unit: string; stages: [string, string, string];
  outs: DestKey[]; sys: string; plan: string; way: string; reads: string; back: string;
}

export const SOURCE_ORDER: SourceKey[] = ["sheet", "emr", "hr", "tms", "data", "agent"];
export const DEST_ORDER: DestKey[] = ["sheets", "calendar", "file", "system"];

export const SOURCES: Record<SourceKey, Source> = {
  sheet: { label: "Spreadsheets", icon: "sheet", method: "Upload", mode: "no", code: "upload", packets: ["staff.csv", "leave.xlsx"], rows: 24, unit: "rows · 6 columns", stages: ["3 gaps → asked", "4 rules confirmed", "0.00% gap · 4.2 s"], outs: ["sheets", "file"], sys: "Your system", plan: "84 shifts · 84 reasons", way: "Upload", reads: "Your CSV or Excel file, as it is.", back: "Your plan in Google Sheets or as a file, plus a shared view for your team." },
  emr: { label: "Hospital or clinic system", icon: "clinic", method: "REST API", mode: "no", code: "rest", packets: ["staff", "wards", "leave"], rows: 24, unit: "staff · 3 wards", stages: ["3 gaps → asked", "4 rules confirmed", "0.00% gap · 4.2 s"], outs: ["system", "file"], sys: "Your hospital system", plan: "84 shifts · written back", way: "REST API", reads: "Staff, skills, wards and leave.", back: "A roster with reasons, written back to your system." },
  hr: { label: "HR or rostering tool", icon: "hr", method: "REST API", mode: "no", code: "rest", packets: ["employees", "availability"], rows: 62, unit: "employees", stages: ["5 gaps → asked", "7 rules confirmed", "0.00% gap · 6.8 s"], outs: ["system", "calendar"], sys: "Your HR system", plan: "rota approved · synced", way: "REST API", reads: "Employees, contracts and availability.", back: "An approved rota, written back and pushed to calendars." },
  tms: { label: "Dispatch or fleet system", icon: "fleet", method: "REST API", mode: "no", code: "rest", packets: ["vehicles", "orders"], rows: 140, unit: "stops · 12 vans", stages: ["0 gaps", "3 rules confirmed", "0.00% gap · 9.1 s"], outs: ["system", "file"], sys: "Your dispatch system", plan: "12 routes · arrival times", way: "REST API", reads: "Vehicles, orders and delivery windows.", back: "Routes per vehicle with arrival times." },
  data: { label: "Our own data team", icon: "code", method: "Python SDK", mode: "yes", code: "python", packets: ["DataFrame"], rows: 3000, unit: "rows in", stages: ["0 gaps", "5 rules confirmed", "0.00% gap · 3.4 s"], outs: ["system"], sys: "Your next pipeline step", plan: "assignments as a DataFrame", way: "Python SDK", reads: "Any table you pass in.", back: "Assignments ready for your next pipeline step." },
  agent: { label: "An AI assistant", icon: "assistant", method: "MCP", mode: "yes", code: "mcp", packets: ["tool call"], rows: 24, unit: "nurses", stages: ["3 gaps → asked", "4 rules confirmed", "0.00% gap · 4.2 s"], outs: ["system"], sys: "Back to your assistant", plan: "a plan it can explain", way: "MCP", reads: "Whatever your assistant passes in.", back: "A proven plan your assistant can explain." },
};

export const DESTS: Record<DestKey, { label: string; icon: IconName; chip: string; done: string }> = {
  sheets: { label: "Google Sheets", icon: "sheet", chip: "Native", done: "Sent" },
  calendar: { label: "Calendar", icon: "calendar", chip: "Native · .ics", done: "Pushed" },
  file: { label: "Excel, CSV or PDF", icon: "file", chip: "Native", done: "Ready" },
  system: { label: "Your system", icon: "system", chip: "Via API", done: "Synced" },
};

export const ICON_PATHS: Record<IconName, string> = {
  sheet: "M4 3h16a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 20 21H4a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 4 3zM4 9h16M4 15h16M10 3v18",
  clinic: "M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4zM12 8v8M8 12h8",
  hr: "M12 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M19.2 8a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0zM16 14c2.8 0 5 2.2 5 5",
  fleet: "M3 7h11v9H3zM14 10h4l3 3v3h-7M9 18a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0zM19 18a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z",
  code: "m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14",
  assistant: "M4 5h16v11H9l-5 4z",
  calendar: "M4.5 5h15A1.5 1.5 0 0 1 21 6.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5zM3 10h18M8 3v4M16 3v4",
  file: "M12 4v11m-4-4 4 4 4-4M5 20h14",
  system: "M4 4h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 14h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zM7 7h.01M7 17h.01",
};

export const CODE: Record<MethodKey, { label: string; host: string; note: string; code: string }> = {
  upload: { label: "Upload", host: "intellign.ai/workspace", note: "No code. Works in the browser at intellign.ai/workspace.", code: "1  Open intellign.ai/workspace\n2  Drop in your spreadsheet\n3  Say what you need in plain English\n4  Check the rules Intellign shows you\n5  Approve the plan, then send it to Google Sheets\n   or download it as CSV, Excel, PDF or .ics" },
  rest: { label: "REST", host: "api.intellign.ai", note: "Send your two tables as datasets first, then solve. Full reference in the docs.", code: "curl -X POST https://api.intellign.ai/api/public/v1/solve \\\n  -H \"Authorization: Bearer $INTELLIGN_API_KEY\" \\\n  -H \"Idempotency-Key: roster-week-42\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"problem\": \"Roster our 24 nurses across 3 wards. Nobody works more than 3 nights in a row.\",\n    \"entities_dataset_id\": \"<staff dataset id>\",\n    \"targets_dataset_id\": \"<shifts dataset id>\",\n    \"quality_mode\": \"balanced\"\n  }'\n\n# 202 Accepted. Poll the job, then read the plan back." },
  python: { label: "Python", host: "pip install intellign", note: "ik_test_ keys are a free sandbox; ik_live_ keys are for production.", code: "from intellign import Client, Problem\n\nclient = Client(api_key=\"ik_live_...\", base_url=\"https://api.intellign.ai\")\n\nproblem = (\n    Problem.assignment(name=\"Nurse roster\")\n    .entities(rows=nurses)\n    .targets(rows=wards)\n    .maximize(\"skill_match\", weight=70,\n              entity_column=\"skills\", target_column=\"required_skills\")\n    .require(\"entity.skills superset_of target.required_skills\")\n    .quality(\"balanced\")\n)\n\nresult = client.submit(problem).wait()\nprint(result.assignments[0])" },
  mcp: { label: "MCP", host: "mcp.intellign.ai/mcp", note: "Hosted at mcp.intellign.ai, or run it yourself with pip install \"intellign[mcp]\". Works with any MCP-capable assistant.", code: "# Hosted: add it to Claude Code\nclaude mcp add --transport http intellign https://mcp.intellign.ai/mcp \\\n  --header \"Authorization: Bearer ik_live_...\"\n\n# Or run it locally (stdio)\npip install \"intellign[mcp]\"\nINTELLIGN_API_KEY=ik_live_... intellign-mcp\n\n# Then ask your assistant:\n# \"Use Intellign to roster my nurses for next week.\"" },
};
export const METHOD_ORDER: MethodKey[] = ["upload", "rest", "python", "mcp"];

export const SETUP_STEPS = {
  sheet: ["Open Intellign and drop in your spreadsheet.", "Say what you need in plain English and check the rules.", "Approve the plan, then send it to Google Sheets or download it."],
  system: ["Tell us which system you use.", "We connect it with you, so your data flows in on its own.", "Approved plans appear back in your system. No re-typing."],
  dev: ["Create an API key in your dashboard.", "Send your tables and your sentence.", "Read the plan back, with a reason for every assignment."],
} as const;

/* ---------- case studies ---------- */
export interface CaseStudy {
  id: string; module: string; title: string; blurb: string; prompt: string;
  goals: [string, string, number | null][];
  metrics: [string, string][];
  rows?: [string, string, string][];
  note?: string; foot: string; link: [string, string];
}

export const CASES: CaseStudy[] = [
  { id: "nysc", module: "Research deployment", title: "NYSC health graduate deployment", blurb: "500 graduates placed across 750 primary health facilities.",
    prompt: "Deploy 500 NYSC healthcare graduates to primary health centres across Nigeria. Match each graduate's specialization to what the facility needs, prioritise facilities with a serious disease burden, and never overload a facility.",
    goals: [["Reward", "Match each graduate's specialization to what the facility needs", null], ["Reward", "Prioritise facilities with a serious staffing gap and disease burden", null], ["Penalty", "Never staff a facility beyond its personnel capacity", null]],
    metrics: [["500 → 750", "graduates to primary health facilities"], ["82%", "matched to their specialization"], ["0", "graduates placed into an over-capacity facility"]],
    note: "Graduate records are generated and facility fields are augmented. This is a recorded research run, not a live solve.",
    foot: "Details of the method and the full study are available on request.", link: [`mailto:${SITE_EMAIL}?subject=NYSC%20deployment%20study`, "Request the full study"] },
  { id: "bed", module: "Bed management", title: "Bed assignment", blurb: "60 patients to 20 beds, by condition, ward type and severity.",
    prompt: "I need to assign admitted patients to hospital beds. Match each patient's condition to the right ward type, and prioritise our most severe patients for placement first.",
    goals: [["Reward", "Match patient condition to ward type", 55], ["Reward", "Prioritise higher-severity patients for placement", 25], ["Penalty", "Respect bed availability per ward", 20]],
    metrics: [["60 / 60", "patients placed"], ["95 / 100", "solution quality"], ["8.1 s", "to solve"], ["Genetic algorithm", "solver"]],
    rows: [["Victor Eze", "Ward C - General", "General Medical"], ["Aisha Abubakar", "Orthopaedic Unit", "Orthopaedic"], ["Fatima Bello", "ICU Unit 2", "Intensive Care Unit"], ["Chukwudi Okoro", "Surgical Recovery", "Surgical"]],
    foot: "Synthetic data, generated for a design-partner pitch and solved by Intellign's production pipeline. Times are from the recorded run.", link: ["/demo/helium-health", "Open the interactive demo"] },
  { id: "ward", module: "Ward staffing · runs live", title: "Ward personnel", blurb: "40 staff to 10 wards, by specialization and ward acuity.",
    prompt: "Assign our ward personnel, nurses, doctors and support staff, across hospital wards. Match specialization to what each ward needs, and prioritise our higher-acuity wards.",
    goals: [["Reward", "Match personnel specialization to ward requirement", 45], ["Reward", "Prioritise higher-acuity wards", 30], ["Penalty", "Respect ward staffing capacity", 25]],
    metrics: [["40 / 40", "staff placed"], ["90 / 100", "solution quality"], ["3.9 s", "to solve"], ["Live", "runs in the demo"]],
    rows: [["Aisha Bello, Nurse", "General Med Ward A", "General Medicine"], ["Chidi Okoro, Doctor", "Surgical Ward 1", "General Surgery"], ["Ngozi Eze, Doctor", "Maternity Ward", "Obstetrics & Gynaecology"], ["Fatima Musa, Support", "Physiotherapy Unit", "Physiotherapy"]],
    foot: "Synthetic data. This scenario is generated and solved live in the demo; the figures shown are from a recorded run.", link: ["/demo/helium-health", "Run it live"] },
  { id: "appt", module: "Appointment scheduling", title: "Doctor scheduling", blurb: "30 doctors across 8 clinic departments for a week of demand.",
    prompt: "Schedule our doctors across clinic departments for the week so we cover patient appointment demand. Match each doctor's specialty to the department and cover as many appointment slots as possible.",
    goals: [["Reward", "Match doctor specialty to clinic department", 55], ["Reward", "Cover patient appointment slot demand", 45]],
    metrics: [["30 → 8", "doctors across departments"], ["100%", "of appointment slots covered"], ["71 / 100", "schedule quality"], ["45.7 s", "to solve"]],
    note: "This solver scores the whole schedule rather than each doctor, so there is no per-doctor fit to show.",
    foot: "Synthetic data, generated for a design-partner pitch and solved by Intellign's production pipeline.", link: ["/demo/helium-health", "Open the interactive demo"] },
];

/* ---------- use cases, trust, pricing ---------- */
export const USE_CASES = [
  ["Healthcare", "Nurse rosters, patient-to-doctor matching, home-care visits."],
  ["Health insurance", "Claims to reviewers, enrollees to providers."],
  ["Logistics", "Delivery routes, driver assignment, less fuel."],
  ["Education", "Timetables, teacher placement, classroom use."],
  ["Public sector", "Field-worker postings and fair allocation."],
  ["Business operations", "Task assignment and balanced workloads."],
] as const;

export const TRUST = [
  ["Yours only.", "Sessions are private to you and your team unless you choose to share them."],
  ["Checked after solving.", "Every must-follow rule is re-checked and any violation is flagged."],
  ["Export anytime.", "CSV, Excel, PDF or a calendar file, no request needed."],
  ["Connected accounts stay protected.", "Google tokens are stored encrypted, and Sheets and Calendar are separate consents."],
] as const;

export const TIERS = [
  { name: "Free", price: "$0", per: "/ month", items: ["Capped optimization prompts", "Limited dataset size", "10 datasets per month", "Community support"], cta: "Start free", href: "/auth/signup" },
  { name: "Pro", price: "$15", per: "/ month", items: ["Higher usage limits", "Faster processing", "Scheduling, routing, assignment", "Unlimited dataset creation", "Email and priority support"], cta: "Choose Pro", href: "/auth/signup", feat: true },
  { name: "Enterprise", price: "Custom", per: "", items: ["Unlimited usage", "Custom integrations", "Dedicated support and SLAs", "Advanced compliance and constraints"], cta: "Talk to sales", href: `mailto:${SITE_EMAIL}` },
  { name: "Developer API", price: "$0.10", per: "/ solve", items: ["Subscription-based API access", "MCP and function-calling native", "Long-term enterprise contracts"], cta: "Read API docs", href: "/docs" },
] as const;
