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
  /** Reports the exact number of insight cards so the tab badge can match. */
  onCountChange?: (count: number) => void;
}

// Build coverage + summary insight cards from optimization result metrics (R2).
function buildResultInsights(metrics: any): Artifact[] {
  if (!metrics) return [];
  const out: Artifact[] = [];
  const total = metrics.total_targets ?? 0;
  const assigned = metrics.assigned_targets ?? metrics.assigned_count ?? 0;
  if (total > 0) {
    const pct = metrics.coverage_pct ?? Math.round((assigned / total) * 100);
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
  out.push({
    type: "session_summary_card",
    problem: metrics.solver_used ? `Solved with ${metrics.solver_used}` : "Optimization complete",
    solver: metrics.solver_used,
    resources: { count: metrics.total_resources ?? 0 },
    targets: { count: total },
    goals: [],
    ready: true,
  } as Artifact);
  return out;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ messages, jobId, onCountChange }) => {
  const [resultArtifacts, setResultArtifacts] = useState<Artifact[]>([]);

  // Fetch optimization results once a job exists; build coverage/summary cards.
  useEffect(() => {
    if (!jobId) { setResultArtifacts([]); return; }
    let cancelled = false;
    fetch(`${API_URL}/results/${jobId}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.metrics) return;
        setResultArtifacts(buildResultInsights(data.metrics));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [jobId]);

  const entries = useMemo(() => {
    const result: Array<{ artifact: Artifact; timestamp: string; key: string }> = [];
    for (const msg of messages) {
      if (!msg.artifacts?.length) continue;
      for (const art of msg.artifacts) {
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
  }, [messages, resultArtifacts]);

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
