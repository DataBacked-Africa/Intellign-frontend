import Link from "next/link";

// Static, hand-tokenized JSX, replaces the dangerouslySetInnerHTML HTML string.
// c = comment, k = keyword, v = name, s = string (styled via .code-block classes).
const C = ({ children }: { children: React.ReactNode }) => <span className="c">{children}</span>;
const K = ({ children }: { children: React.ReactNode }) => <span className="k">{children}</span>;
const V = ({ children }: { children: React.ReactNode }) => <span className="v">{children}</span>;
const S = ({ children }: { children: React.ReactNode }) => <span className="s">{children}</span>;

export default function CodeSample() {
  return (
    <section className="mk-container code-section">
      <div>
        <div className="eyebrow">For developers</div>
        <h2>One call from <em>any</em> LLM.</h2>
        <p>
          Intellign ships a Python SDK and an MCP server your assistant can call
          as a tool. Describe the problem, post the resources, receive an
          assignment.
        </p>
        <p>
          When a healthcare model needs to schedule nurses, it calls Intellign.
          When a logistics model needs to route deliveries, it calls Intellign.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Link href="/docs" className="btn btn-secondary">See full reference</Link>
          <Link href="/docs" className="btn btn-ghost">MCP guide</Link>
        </div>
      </div>
      <pre className="code-block">
        <C># pip install intellign, call it from any LLM or agent framework.</C>{"\n"}
        <K>from</K> intellign <K>import</K> Intellign{"\n\n"}
        client = Intellign(){"\n\n"}
        result = client.<V>solve</V>({"\n"}
        {"    "}goal=<S>&quot;Minimize total nurse overtime&quot;</S>,{"\n"}
        {"    "}constraints=[{"\n"}
        {"        "}<S>&quot;Each ward needs ≥ 3 nurses per shift&quot;</S>,{"\n"}
        {"        "}<S>&quot;No nurse exceeds 48h/week&quot;</S>,{"\n"}
        {"    "}],{"\n"}
        {"    "}resources=nurses,{"\n"}
        {"    "}targets=wards,{"\n"}
        ){"\n\n"}
        <C># → 50/50 assigned, every decision explained</C>{"\n"}
        result.assignments
      </pre>
    </section>
  );
}
