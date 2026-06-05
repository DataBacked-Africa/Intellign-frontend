"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { ArtifactCard, Artifact } from "./ArtifactCard";
import { ChatMessage } from "@/hooks/useUnifiedChat";
import { API_URL } from "@/lib/axiosConfig";

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface InsightsTabProps {
  messages: ChatMessage[];
  /** When set + the job is done, post-optimization insight cards are built from results. */
  jobId?: string;
  /** Session id — used to load durable artifacts from the DB (restored on reload). */
  sessionId?: string | null;
  /** Reports the exact number of insight cards so the tab badge can match. */
  onCountChange?: (count: number) => void;
}

// Build coverage + summary insight cards from the full optimization result (R2).
function buildResultInsights(data: any): Artifact[] {
  if (!data) return [];
  const metrics = data.metrics ?? data;
  const out: Artifact[] = [];
  const total = metrics.total_targets ?? 0;
  const assigned = metrics.assigned_targets ?? metrics.assigned_count ?? 0;
  const pct = metrics.coverage_pct ?? metrics.solution_quality ?? (total > 0 ? Math.round((assigned / total) * 100) : undefined);
  if (total > 0) {
    const uncovered = metrics.unassigned_targets ?? Math.max(0, total - assigned);
    out.push({
      type: "coverage_estimate",
      coverage_pct: pct,
      uncovered_targets: uncovered,
      bottleneck: uncovered > 0
        ? `${uncovered} target(s) left uncovered — capacity or skill gaps likely.`
        : undefined,
      suggestion: uncovered > 0 ? "Add resources or relax a constraint to lift coverage." : undefined,
    } as Artifact);
  }
  const solver = metrics.solver_used ?? data.solver_used;
  const goalDescs: string[] = Array.isArray(data.goals_used)
    ? data.goals_used.map((g: any) => g?.description ?? g?.name).filter(Boolean)
    : [];
  out.push({
    type: "session_summary_card",
    problem: solver ? `Solved with ${solver}` : "Optimization complete",
    solver,
    quality_mode: data.ga_params_used?.quality_mode ?? metrics.quality_mode,
    resources: { count: metrics.total_resources ?? 0 },
    targets: { count: total },
    assigned: assigned || undefined,
    coverage: pct,
    best_fitness: data.best_fitness ?? metrics.best_fitness,
    elapsed_seconds: metrics.elapsed_time_seconds,
    goals: goalDescs,
    ready: true,
  } as Artifact);
  return out;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ messages, jobId, sessionId, onCountChange }) => {
  const [resultArtifacts, setResultArtifacts] = useState<Artifact[]>([]);
  const [durableArtifacts, setDurableArtifacts] = useState<Artifact[]>([]);

  // Durable artifacts from the DB — restored on reload, independent of chat turns.
  useEffect(() => {
    if (!sessionId) { setDurableArtifacts([]); return; }
    let cancelled = false;
    fetch(`${API_URL}/ingest/chat/${sessionId}/artifacts`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !Array.isArray(data?.artifacts)) return;
        setDurableArtifacts(data.artifacts as Artifact[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sessionId, messages.length]);   // re-fetch as the conversation advances

  // Fetch optimization results once a job exists; build coverage/summary cards.
  useEffect(() => {
    if (!jobId) { setResultArtifacts([]); return; }
    let cancelled = false;
    fetch(`${API_URL}/results/${jobId}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.metrics) return;
        setResultArtifacts(buildResultInsights(data));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [jobId]);

  const entries = useMemo(() => {
    const result: Array<{ artifact: Artifact; timestamp: string; key: string }> = [];
    const seen = new Set<string>();
    const sig = (a: Artifact) => `${a.type}|${a.note ?? a.content ?? JSON.stringify(a).slice(0, 120)}`;
    // Durable (DB) artifacts first — the canonical record.
    for (const art of durableArtifacts) {
      const s = sig(art);
      if (seen.has(s)) continue;
      seen.add(s);
      result.push({ artifact: art, timestamp: "saved", key: `db-${result.length}` });
    }
    // Message artifacts (covers older sessions not yet in the DB), deduped.
    for (const msg of messages) {
      if (!msg.artifacts?.length) continue;
      for (const art of msg.artifacts) {
        const s = sig(art as Artifact);
        if (seen.has(s)) continue;
        seen.add(s);
        result.push({
          artifact: art as Artifact,
          timestamp: msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          key: msg.id,
        });
      }
    }
    // Post-optimization insights last (most recent)
    for (let i = 0; i < resultArtifacts.length; i++) {
      result.push({ artifact: resultArtifacts[i], timestamp: "result", key: `result-${i}` });
    }
    return result;
  }, [messages, resultArtifacts, durableArtifacts]);

  useEffect(() => { onCountChange?.(entries.length); }, [entries.length, onCountChange]);

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">No insights yet</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[220px]">
            Data quality reports, coverage estimates, and summaries will appear here as you work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {entries.length} insight{entries.length !== 1 ? "s" : ""} this session
      </p>
      {entries.map((entry, i) => (
        <ArtifactCard
          key={`${entry.key}-${i}`}
          artifact={entry.artifact}
          timestamp={entry.timestamp}
          defaultExpanded={i === entries.length - 1}
        />
      ))}
    </div>
  );
};
