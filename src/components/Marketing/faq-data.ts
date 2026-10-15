// Plain data module (NOT "use client") so both the server page (JSON-LD)
// and the client FAQ component can import the same source of truth.
// Answers are checked against the backend: solver quality claims, timings and
// MCP details match what ships (see docs/intellign-landing.html in the draft).
export const FAQ_ITEMS = [
  {
    q: "Do I need my own data to try it?",
    a: "No. Intellign can generate a sample dataset in under a minute so you can see a full plan. Generated rows are always labelled as samples.",
  },
  {
    q: "How is this different from asking a chatbot?",
    a: "A chatbot writes an answer that sounds right. Intellign uses AI to understand your words, then hands the problem to a real solver. Every must-follow rule is checked again after solving, and you see which solver ran and how well the plan scored.",
  },
  {
    q: "Is the plan really the best one?",
    a: "It depends on the solver. When an exact solver runs, Intellign reports how far the plan is from the best possible one, and tells you when it is proven optimal. For large or complex problems it uses search methods that find a very strong plan quickly, and reports a quality score instead of a proof. It always tells you which one ran.",
  },
  {
    q: "How long does it take?",
    a: "Small problems take seconds: assigning 40 staff to 10 wards took about four in our demo. Larger or schedule-heavy problems take longer, from tens of seconds up.",
  },
  {
    q: "Can I trust the plan?",
    a: "Every must-follow rule is checked again after solving, and any violation is flagged. When data is missing, Intellign asks you instead of filling the gap. The plan, with the reasons behind it, can be exported.",
  },
  {
    q: "What kinds of problems can it plan?",
    a: "Assignment (people to places), scheduling (rosters and timetables) and routing, plus combinations such as scheduling and routing together.",
  },
  {
    q: "Can the plan go back to Google Sheets or my calendar?",
    a: "Yes. You can send an approved plan to a new Google Sheet, push it to Google Calendar, or download it as CSV, Excel, PDF or .ics. Systems such as HR or hospital platforms connect through the API.",
  },
  {
    q: "Can my AI assistant use Intellign?",
    a: "Yes. Intellign has an MCP server, so any MCP-capable assistant can use it as a tool. Use the hosted server at mcp.intellign.ai with your API key, or run it yourself with pip install \"intellign[mcp]\".",
  },
];
