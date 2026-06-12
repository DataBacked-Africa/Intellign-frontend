"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Edit2, Check, X, Zap, Scale, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axiosConfig";
import { showToast } from "@/components/ui/CustomToast";
import { useSessionStore } from "@/store/useSessionStore";

const QUALITY_MODES: { id: "fast" | "balanced" | "best"; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: "fast",     label: "Fast",     sub: "Quick, approximate", icon: <Zap className="w-3.5 h-3.5" /> },
  { id: "balanced", label: "Balanced", sub: "Speed + quality",    icon: <Scale className="w-3.5 h-3.5" /> },
  { id: "best",     label: "Best",     sub: "Most optimized",     icon: <Trophy className="w-3.5 h-3.5" /> },
];

const QualityModeToggle: React.FC = () => {
  const qualityMode = useSessionStore((s) => s.qualityMode);
  const setQualityMode = useSessionStore((s) => s.setQualityMode);
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        Optimization mode
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {QUALITY_MODES.map((m) => {
          const active = qualityMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setQualityMode(m.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all",
                active
                  ? "border-[var(--brand-maroon)] bg-[var(--brand-maroon)]/8 text-[var(--brand-maroon)]"
                  : "border-gray-200 text-gray-500 hover:border-[var(--brand-maroon)]/40",
              )}
            >
              {m.icon}
              <span className="text-[11px] font-semibold">{m.label}</span>
              <span className="text-[9px] text-gray-400 leading-tight text-center">{m.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface SolverConfig {
  solver_type: "ga" | "ortools" | "schedule" | "greedy";
  params: Record<string, number | string | boolean>;
  tuned: boolean;
  last_run_at?: string;
}

interface SolverConfigPanelProps {
  sessionId: string;
  config: SolverConfig | null;
  onConfigUpdated?: (config: SolverConfig) => void;
}

const SOLVER_LABELS: Record<string, { label: string; color: string }> = {
  ga:       { label: "Genetic Algorithm", color: "bg-violet-100 text-violet-700 border-violet-200" },
  ortools:  { label: "OR-Tools",          color: "bg-blue-100 text-blue-700 border-blue-200" },
  schedule: { label: "Schedule Engine",   color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  greedy:   { label: "Greedy Heuristic",  color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const PARAM_LABELS: Record<string, string> = {
  population_size:  "Population Size",
  generations:      "Generations",
  mutation_rate:    "Mutation Rate",
  selection_method: "Selection Method",
  crossover_rate:   "Crossover Rate",
  elite_size:       "Elite Size",
};

export const SolverConfigPanel: React.FC<SolverConfigPanelProps> = ({ sessionId, config: configProp, onConfigUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState<SolverConfig | null>(null);

  // The prop is a stale snapshot; the real solver_config is persisted at run time.
  // Fetch it from /state so the Config tab shows the actual solver + params.
  useEffect(() => {
    if (!sessionId) return;
    axiosInstance.get(`/ingest/chat/${sessionId}/state`)
      .then(res => {
        const sc = res.data?.solver_config;
        if (sc && sc.solver_type) setFetched(sc as SolverConfig);
      })
      .catch(() => {});
  }, [sessionId]);

  const config = configProp ?? fetched;

  const handleEdit = () => { setDraft(config?.params ?? {}); setEditing(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(`/agent/ga-params/${sessionId}`, { solver_type: config?.solver_type, params: draft });
      onConfigUpdated?.({ ...config!, params: draft, tuned: true });
      setEditing(false);
      showToast.success("Saved", "Solver configuration updated.");
    } catch { showToast.error("Save Failed", "Could not update solver config."); }
    finally { setSaving(false); }
  };

  if (!config) {
    return (
      <div className="flex flex-col gap-5 p-4 h-full">
        <QualityModeToggle />
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-3 px-6">
          <Cpu className="w-10 h-10 text-gray-300" />
          <div>
            <p className="text-sm font-semibold text-gray-600">Solver auto-selected on run</p>
            <p className="text-xs text-gray-400 mt-1">We pick the best solver for your problem. Detailed params appear once goals are defined.</p>
          </div>
        </div>
      </div>
    );
  }

  const meta = SOLVER_LABELS[config.solver_type] ?? { label: config.solver_type, color: "bg-gray-100 text-gray-700 border-gray-200" };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <QualityModeToggle />
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Solver Configuration</p>
        {!editing
          ? <button onClick={handleEdit} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"><Edit2 className="w-3 h-3" /> Edit</button>
          : <div className="flex gap-1">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--brand-maroon)] text-white hover:bg-[var(--brand-maroon)]/90 disabled:opacity-50"><Check className="w-3 h-3" /> {saving ? "Saving…" : "Save"}</button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
        }
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", meta.color)}>{meta.label}</span>
        {config.tuned && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Tuned</span>}
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {Object.entries(editing ? draft : config.params).map(([key, value], i, arr) => (
          <div key={key} className={cn("flex items-center justify-between px-3 py-2.5", i < arr.length - 1 && "border-b border-gray-100", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
            <span className="text-xs text-gray-600">{PARAM_LABELS[key] ?? key}</span>
            {editing
              ? <input type="text" value={String(draft[key] ?? "")} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-lg text-right focus:outline-none focus:border-[var(--brand-maroon)]/50" />
              : <span className="text-xs font-semibold text-gray-900">{String(value)}</span>
            }
          </div>
        ))}
      </div>
      {config.last_run_at && <p className="text-[10px] text-gray-400">Last run: {new Date(config.last_run_at).toLocaleString()}</p>}
    </div>
  );
};
