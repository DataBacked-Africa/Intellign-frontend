const CODE_HTML = `<span class="c">// Any LLM, any framework, any runtime.</span>
<span class="k">const</span> <span class="v">result</span> = <span class="k">await</span> intellign.solve({
  goal:        <span class="s">"Minimize total nurse overtime"</span>,
  constraints: [
    <span class="s">"Each ward needs ≥ 3 nurses per shift"</span>,
    <span class="s">"No nurse exceeds 48h/week"</span>,
  ],
  resources: nurses,
  tasks:     shifts,
});

<span class="c">// → 240/240 assigned, fitness 0.987, 2.3s</span>
<span class="k">return</span> result.assignments;`;

export default function CodeSample() {
  return (
    <section className="mk-container code-section">
      <div>
        <div className="eyebrow">For developers</div>
        <h2>One call from <em>any</em> LLM.</h2>
        <p>
          Intellign exposes a single endpoint your assistant can call as a tool.
          Describe the problem, post the resources, receive an assignment.
        </p>
        <p>
          When a healthcare model needs to schedule nurses, it calls Intellign.
          When a logistics model needs to route deliveries, it calls Intellign.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <a href="#docs" className="btn btn-secondary">See full reference</a>
          <a href="#docs" className="btn btn-ghost">MCP guide</a>
        </div>
      </div>
      <pre className="code-block" dangerouslySetInnerHTML={{ __html: CODE_HTML }} />
    </section>
  );
}
