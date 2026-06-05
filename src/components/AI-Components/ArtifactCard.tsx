"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart2, Target, Zap, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Artifact {
  type: string;
  content?: string;
  headers?: string[];
  rows?: string[][];
  tables?: Record<string, { rows: number; missing_pct: number; duplicates: number; outlier_cols: string[] }>;
  overall_score?: number;
  issues?: string[];
  coverage_pct?: number;
  uncovered_targets?: number;
  bottleneck?: string;
  suggestion?: string;
  complexity?: string;
  recommended_solver?: string;
  estimated_runtime_seconds?: number;
  constraint_density?: number;
  note?: string;
  problem?: string;
  solver?: string;
  resources?: { count: number; synthetic_cols?: string[] };
  targets?: { count: number; source?: string };
  goals?: string[];
  ready?: boolean;
}

const ARTIFACT_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  data_quality_report:    { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Data Quality",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  coverage_estimate:      { icon: <Target className="w-3.5 h-3.5" />,   label: "Coverage",       color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  problem_complexity_card:{ icon: <Zap className="w-3.5 h-3.5" />,      label: "Complexity",     color: "text-amber-600 bg-amber-50 border-amber-200" },
  session_summary_card:   { icon: <FileText className="w-3.5 h-3.5" />, label: "Summary",        color: "text-violet-600 bg-violet-50 border-violet-200" },
  table:                  { icon: <BarChart2 className="w-3.5 h-3.5" />,label: "Table",          color: "text-gray-600 bg-gray-50 border-gray-200" },
};
const DEFAULT_META = { icon: <FileText className="w-3.5 h-3.5" />, label: "Insight", color: "text-gray-600 bg-gray-50 border-gray-200" };

const DataQualityBody: React.FC<{ artifact: Artifact }> = ({ artifact }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-gray-900">{artifact.overall_score ?? "—"}</div>
      <div className="text-xs text-gray-500">/ 100 quality score</div>
    </div>
    {artifact.tables && Object.entries(artifact.tables).map(([name, meta]) => (
      <div key={name} className="text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
        <span className="font-semibold capitalize">{name}</span>
        <span className="text-gray-500 ml-2">{meta.rows} rows</span>
        {meta.missing_pct > 0 && <span className="text-amber-500 ml-2">{meta.missing_pct.toFixed(1)}% missing</span>}
        {meta.duplicates > 0 && <span className="text-red-500 ml-2">{meta.duplicates} duplicates</span>}
      </div>
    ))}
    {artifact.issues?.map((issue, i) => (
      <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{issue}
      </div>
    ))}
  </div>
);

const CoverageBody: React.FC<{ artifact: Artifact }> = ({ artifact }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-gray-900">{artifact.coverage_pct ?? "—"}%</div>
      <div className="text-xs text-gray-500">targets covered</div>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${artifact.coverage_pct ?? 0}%` }} />
    </div>
    {artifact.bottleneck && (
      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">⚠ {artifact.bottleneck}</p>
    )}
    {artifact.suggestion && <p className="text-xs text-gray-500 italic">{artifact.suggestion}</p>}
  </div>
);

const ComplexityBody: React.FC<{ artifact: Artifact }> = ({ artifact }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase",
        artifact.complexity === "high" ? "bg-red-100 text-red-700"
          : artifact.complexity === "medium" ? "bg-amber-100 text-amber-700"
          : "bg-green-100 text-green-700")}>
        {artifact.complexity ?? "unknown"} complexity
      </span>
    </div>
    {artifact.recommended_solver && (
      <p className="text-xs text-gray-600">Recommended: <span className="font-semibold">{artifact.recommended_solver}</span></p>
    )}
    {artifact.estimated_runtime_seconds != null && (
      <p className="text-xs text-gray-500">Estimated runtime: ~{artifact.estimated_runtime_seconds}s</p>
    )}
    {artifact.note && <p className="text-xs text-gray-500 italic">{artifact.note}</p>}
  </div>
);

const SummaryBody: React.FC<{ artifact: Artifact }> = ({ artifact }) => (
  <div className="space-y-1.5 text-xs">
    {artifact.problem && <p className="font-semibold text-gray-900">{artifact.problem}</p>}
    {artifact.resources && <p className="text-gray-600">Resources: {artifact.resources.count}{artifact.resources.synthetic_cols?.length ? ` (${artifact.resources.synthetic_cols.length} synthetic cols)` : ""}</p>}
    {artifact.targets && <p className="text-gray-600">Targets: {artifact.targets.count}{artifact.targets.source === "generated" ? " (generated)" : ""}</p>}
    {artifact.solver && <p className="text-gray-600">Solver: {artifact.solver}</p>}
    {artifact.goals?.map((g, i) => <p key={i} className="text-gray-500">• {g}</p>)}
    {artifact.ready && <p className="text-emerald-600 font-semibold mt-1">✓ Ready to optimize</p>}
  </div>
);

const TableBody: React.FC<{ artifact: Artifact }> = ({ artifact }) => {
  if (!artifact.headers || !artifact.rows) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{artifact.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>)}</tr>
        </thead>
        <tbody>
          {artifact.rows.map((row, ri) => (
            <tr key={ri} className="border-t border-gray-100 even:bg-gray-50/40">
              {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-gray-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ArtifactCardProps {
  artifact: Artifact;
  timestamp?: string;
  defaultExpanded?: boolean;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, timestamp, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = ARTIFACT_META[artifact.type] ?? DEFAULT_META;
  const [bg, bdColor] = [meta.color.split(" ")[1], meta.color.split(" ")[2]];

  const renderBody = () => {
    switch (artifact.type) {
      case "data_quality_report":     return <DataQualityBody artifact={artifact} />;
      case "coverage_estimate":       return <CoverageBody artifact={artifact} />;
      case "problem_complexity_card": return <ComplexityBody artifact={artifact} />;
      case "session_summary_card":    return <SummaryBody artifact={artifact} />;
      case "table":                   return <TableBody artifact={artifact} />;
      default: return artifact.content
        ? <pre className="text-xs text-gray-600 whitespace-pre-wrap">{artifact.content}</pre>
        : null;
    }
  };

  return (
    <div className={cn("rounded-xl border overflow-hidden bg-white", bg, bdColor)}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
        <span className={cn("flex-shrink-0", meta.color.split(" ")[0])}>{meta.icon}</span>
        <span className={cn("text-xs font-semibold flex-1", meta.color.split(" ")[0])}>{meta.label}</span>
        {timestamp && <span className="text-[10px] text-gray-400">{timestamp}</span>}
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", expanded && "rotate-180")} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 border-t border-gray-100/60">{renderBody()}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
