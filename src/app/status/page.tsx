"use client";

import { useEffect, useState } from "react";
import MarketingNav from "@/components/Marketing/MarketingNav";
import MarketingFooter from "@/components/Marketing/MarketingFooter";
import { API_URL } from "@/lib/axiosConfig";

type ServiceState = "active" | "degraded" | "down";

interface PublicStatus {
  overall: "operational" | "degraded" | "outage";
  services: Record<string, ServiceState>;
  timestamp: string;
}

const SERVICE_LABELS: Record<string, { name: string; desc: string }> = {
  chat_api:            { name: "Chat & API",          desc: "Conversational interface and REST endpoints" },
  data_ingestion:      { name: "Data ingestion",      desc: "File upload, parsing and schema analysis" },
  dataset_generation:  { name: "Dataset generation",  desc: "Synthetic sample data generation" },
  optimization_engine: { name: "Optimization engine", desc: "Solvers: assignment, scheduling, routing" },
  session_storage:     { name: "Session storage",     desc: "Durable sessions, history and results" },
  background_workers:  { name: "Background workers",  desc: "Queued generation and ingestion jobs" },
};

const STATE_UI: Record<ServiceState, { label: string; dot: string; text: string }> = {
  active:   { label: "Active",   dot: "#10B981", text: "light-dark(#047857, #34D399)" },
  degraded: { label: "Degraded", dot: "#F59E0B", text: "light-dark(#B45309, #FBBF24)" },
  down:     { label: "Down",     dot: "#EF4444", text: "light-dark(#B91C1C, #F87171)" },
};

const OVERALL_COPY: Record<PublicStatus["overall"], string> = {
  operational: "All systems operational.",
  degraded: "Some services are degraded — core flows still work.",
  outage: "We're experiencing an outage on one or more services.",
};

export default function StatusPage() {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const load = () =>
      fetch(`${API_URL}/status/public`)
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((d: PublicStatus) => { setStatus(d); setFailed(false); })
        .catch(() => setFailed(true));
    load();
    timer = setInterval(load, 30_000);
    return () => { if (timer) clearInterval(timer); };
  }, []);

  const overall: PublicStatus["overall"] = failed ? "outage" : status?.overall ?? "operational";
  const overallUI = failed
    ? { dot: "#EF4444", text: "light-dark(#B91C1C, #F87171)" }
    : overall === "operational"
      ? { dot: "#10B981", text: "light-dark(#047857, #34D399)" }
      : overall === "degraded"
        ? { dot: "#F59E0B", text: "light-dark(#B45309, #FBBF24)" }
        : { dot: "#EF4444", text: "light-dark(#B91C1C, #F87171)" };

  return (
    <div className="mk-page">
      <MarketingNav />
      <main>
        <section className="mk-container" style={{ padding: "120px 32px 80px", maxWidth: 760 }}>
          <div className="eyebrow">Status</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1.1, margin: "16px 0 10px" }}>
            Service <em style={{ fontStyle: "italic", color: "var(--brand-maroon)" }}>status</em>.
          </h1>

          {/* Overall banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
            background: "var(--neutral-0)", border: "1px solid var(--brand-bone-deep)", borderRadius: 12,
            margin: "20px 0 28px",
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%", background: overallUI.dot,
              boxShadow: `0 0 0 4px ${overallUI.dot}22`, flexShrink: 0,
            }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: overallUI.text }}>
              {failed ? "Status service unreachable — we may be experiencing an outage." : OVERALL_COPY[overall]}
            </span>
          </div>

          {/* Per-service rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(SERVICE_LABELS).map(([key, meta]) => {
              const st: ServiceState = failed ? "down" : status?.services?.[key] ?? "active";
              const ui = STATE_UI[st];
              return (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 16px",
                  background: "var(--neutral-0)", border: "1px solid var(--brand-bone-deep)", borderRadius: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{meta.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--neutral-700)", opacity: 0.75, marginTop: 1 }}>{meta.desc}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ui.dot, display: "inline-block" }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: ui.text }}>{ui.label}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 12, color: "var(--neutral-700)", opacity: 0.6, marginTop: 18, fontFamily: "var(--font-mono)" }}>
            {status ? `Last checked ${new Date(status.timestamp).toLocaleTimeString()} · refreshes every 30s` : "Checking…"}
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
