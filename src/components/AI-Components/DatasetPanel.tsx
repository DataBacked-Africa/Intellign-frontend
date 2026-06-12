"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Download, Database, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/axiosConfig";

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface PreviewData {
  table: "resources" | "targets";
  columns: string[];
  rows: Record<string, any>[];
  total_count: number;
  is_synthetic: boolean;
}

interface GenerationStatus {
  // Backend writes "generating" while running, "complete"/"failed" when done.
  status: "idle" | "generating" | "in_progress" | "complete" | "failed";
  resources_rows?: number;       // present while generating (progress) and at completion
  targets_rows?: number;
  requested_resources?: number;  // target totals while generating
  requested_targets?: number;
  total_resources?: number;      // legacy alias
  total_targets?: number;
  error?: string | null;         // populated when status === "failed"
}

const isActiveStatus = (s?: string) => s === "generating" || s === "in_progress";

interface DatasetPanelProps {
  sessionId: string;
  dataContext: {
    resources_metadata?: { count: number; columns: string[] } | null;
    targets_metadata?: { count: number; columns: string[] } | null;
  } | null;
  onDownload: (table: "resources" | "targets", format: "csv" | "xlsx") => void;
  /** Pass true when action_taken === 'generate_sample_dataset' to immediately subscribe SSE */
  isGenerating?: boolean;
}

// ── Generation Progress Bar ──────────────────────────────────────────────────

const GenerationProgress: React.FC<{ status: GenerationStatus }> = ({ status }) => {
  const resTotal = status.requested_resources ?? status.total_resources ?? 0;
  const tgtTotal = status.requested_targets ?? status.total_targets ?? 0;
  const resDone  = status.resources_rows ?? 0;
  const tgtDone  = status.targets_rows ?? 0;
  // While generating we usually don't get incremental row counts, so show an
  // indeterminate-but-moving bar based on whatever rows have landed.
  const overallPct = resTotal + tgtTotal > 0
    ? Math.min(95, Math.round(((resDone + tgtDone) / (resTotal + tgtTotal)) * 100))
    : 40;

  return (
    <div className="flex flex-col gap-4 p-4 h-full justify-center">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="w-5 h-5 text-[var(--brand-maroon)] animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Generating dataset…</p>
          <p className="text-xs text-gray-400">This usually takes 5–20 seconds</p>
        </div>
      </div>

      {/* Overall bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Overall progress</span>
          <span>{overallPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-[var(--brand-maroon)] transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-table rows */}
      {resTotal > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span>Resources</span>
          <span className="font-semibold tabular-nums">{resDone} / {resTotal} rows</span>
        </div>
      )}
      {tgtTotal > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span>Targets</span>
          <span className="font-semibold tabular-nums">{tgtDone} / {tgtTotal} rows</span>
        </div>
      )}
    </div>
  );
};

// ── Table preview ────────────────────────────────────────────────────────────

const TableView: React.FC<{ preview: PreviewData }> = ({ preview }) => {
  // Column picker: default to the first 8, let the user choose the rest.
  const [visible, setVisible] = useState<string[]>(() => preview.columns.slice(0, 8));
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setVisible(preview.columns.slice(0, 8)); }, [preview.columns.join(",")]); // eslint-disable-line

  const toggleCol = (c: string) =>
    setVisible(v => v.includes(c) ? v.filter(x => x !== c) : [...preview.columns.filter(pc => v.includes(pc) || pc === c)]);

  const shown = preview.columns.filter(c => visible.includes(c));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700 capitalize">{preview.table}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{preview.total_count} rows · {preview.columns.length} cols</span>
          {preview.is_synthetic && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium">synthetic</span>
          )}
          {preview.columns.length > 8 && (
            <button onClick={() => setPickerOpen(o => !o)}
              aria-expanded={pickerOpen}
              className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors cursor-pointer">
              columns ({shown.length}/{preview.columns.length})
            </button>
          )}
        </div>
      </div>
      {pickerOpen && (
        <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg border border-gray-100 bg-gray-50">
          {preview.columns.map(c => (
            <button key={c} onClick={() => toggleCol(c)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border transition-colors cursor-pointer",
                visible.includes(c)
                  ? "bg-[var(--brand-maroon)] text-white border-transparent"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200 text-xs">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {shown.map(col => (
                <th key={col} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.slice(0, 10).map((row, ri) => (
              <tr key={ri} className="border-t border-gray-100 even:bg-gray-50/40">
                {shown.map(col => (
                  <td key={col} className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{String(row[col] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

export const DatasetPanel: React.FC<DatasetPanelProps> = ({
  sessionId, dataContext, onDownload, isGenerating = false,
}) => {
  const [resourcesPreview, setResourcesPreview] = useState<PreviewData | null>(null);
  const [targetsPreview,   setTargetsPreview]   = useState<PreviewData | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [genStatus,        setGenStatus]        = useState<GenerationStatus>({ status: "idle" });
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── SSE subscription ──────────────────────────────────────────────────────

  const subscribeSSE = useCallback(() => {
    if (!sessionId || sseRef.current) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const url = `${API_URL}/ingest/chat/${sessionId}/generation-stream${token ? `?token=${token}` : ""}`;

    const es = new EventSource(url);
    sseRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data: GenerationStatus & { type?: string; ready_to_run?: boolean; goals?: any[] } = JSON.parse(ev.data);
        if (data.type === 'bridge') {
          // Generation done + goals compiled server-side → light up the Run card
          // and clear the generating flag so the UI unblocks.
          import('@/store/useSessionStore').then(({ useSessionStore }) => {
            useSessionStore.getState().setChatShared({
              readyToRun: !!data.ready_to_run,
              goals: data.goals ?? [],
              isGenerating: false,
            });
          });
          // Also trigger a preview load — the bridge event means data is ready.
          setTimeout(fetchPreviews, 500);
          return;
        }
        setGenStatus(data);
        if (data.status === "complete") {
          es.close();
          sseRef.current = null;
          // Reset the shared isGenerating flag so the canvas header badge clears
          // and the optimization run is no longer visually blocked.
          import('@/store/useSessionStore').then(({ useSessionStore }) => {
            useSessionStore.getState().setChatShared({ isGenerating: false });
          });
          // Auto-fetch previews once done
          setTimeout(fetchPreviews, 500);
        } else if (data.status === "failed") {
          es.close();
          sseRef.current = null;
          import('@/store/useSessionStore').then(({ useSessionStore }) => {
            useSessionStore.getState().setChatShared({ isGenerating: false });
          });
        }
      } catch {}
    };

    es.onerror = () => {
      // SSE dropped mid-generation (network blip, proxy timeout). Don't leave
      // the spinner stuck — fall back to polling the status endpoint until a
      // terminal state arrives.
      es.close();
      sseRef.current = null;
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${API_URL}/ingest/chat/${sessionId}/generation-status`, { headers: authHeaders() });
          if (!r.ok) return;
          const data: GenerationStatus = await r.json();
          setGenStatus(data);
          if (data.status === "complete" || data.status === "failed") {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            // Reset shared isGenerating flag on both terminal states.
            import('@/store/useSessionStore').then(({ useSessionStore }) => {
              useSessionStore.getState().setChatShared({ isGenerating: false });
            });
            if (data.status === "complete") setTimeout(fetchPreviews, 500);
          }
        } catch { /* transient — keep polling */ }
      }, 5000);
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe immediately if isGenerating=true (fired by parent when action_taken detected)
  useEffect(() => {
    if (isGenerating && !isActiveStatus(genStatus.status)) {
      setGenStatus({ status: "generating" });
      subscribeSSE();
    }
  }, [isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also poll once on mount to catch generation already in flight
  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_URL}/ingest/chat/${sessionId}/generation-status`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then((data: GenerationStatus | null) => {
        if (data && isActiveStatus(data.status)) {
          setGenStatus(data);
          subscribeSSE();
        }
      })
      .catch(() => {});
  }, [sessionId, subscribeSSE]);

  // Cleanup SSE + poll fallback on unmount
  useEffect(() => () => {
    sseRef.current?.close();
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchPreviews = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    const headers = authHeaders();
    const [r, t] = await Promise.all([
      fetch(`${API_URL}/ingest/chat/${sessionId}/preview?table=resources&rows=10`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
      fetch(`${API_URL}/ingest/chat/${sessionId}/preview?table=targets&rows=10`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
    ]);
    if (r) setResourcesPreview(r);
    if (t) setTargetsPreview(t);
    setLoading(false);
  }, [sessionId]);

  // Always try to load previews on mount. The canvas mounts its own chat
  // instance whose dataContext may be empty even though data exists in the
  // session (download works) — gating on dataContext left this tab blank.
  // The preview endpoint falls back to the Redis session_manager and just
  // 404s harmlessly if there genuinely is no data.
  useEffect(() => {
    if (sessionId) fetchPreviews();
  }, [sessionId, dataContext, fetchPreviews]);

  // ── Render states ─────────────────────────────────────────────────────────

  // Generation in progress
  if (isActiveStatus(genStatus.status)) {
    return <GenerationProgress status={genStatus} />;
  }

  // Generation failed — surface the failure, never fall through to "No data yet"
  if (genStatus.status === "failed" && !resourcesPreview && !targetsPreview) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
        <Database className="w-10 h-10 text-red-300" />
        <div>
          <p className="text-sm font-semibold text-red-600">Data generation failed</p>
          <p className="text-xs text-gray-500 mt-1">
            {genStatus.error || "Something went wrong while generating the dataset."}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Ask the assistant to try again — e.g. “generate the sample again”.
          </p>
        </div>
      </div>
    );
  }

  // Just finished — show success flash then fall through to data
  if (genStatus.status === "complete" && !resourcesPreview && !targetsPreview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <p className="text-sm font-semibold text-gray-700">Dataset ready!</p>
        <p className="text-xs text-gray-400">Loading preview…</p>
      </div>
    );
  }

  // No data at all
  if (!dataContext?.resources_metadata && !dataContext?.targets_metadata && !resourcesPreview && !targetsPreview) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6">
        <Database className="w-10 h-10 text-gray-300" />
        <div>
          <p className="text-sm font-semibold text-gray-600">No data yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload files or generate a sample to see your dataset here.</p>
        </div>
      </div>
    );
  }

  if (loading && !resourcesPreview && !targetsPreview) {
    return (
      <div className="flex flex-col gap-4 p-4 h-full" aria-busy="true" aria-label="Loading dataset preview">
        {[0, 1].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="h-8 bg-gray-100" />
              {[...Array(5)].map((_, r) => <div key={r} className="h-7 border-t border-gray-100 bg-gray-50/60" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dataset Preview</p>
        <button onClick={fetchPreviews} disabled={loading} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>
      {resourcesPreview && (
        <div>
          <TableView preview={resourcesPreview} />
          <div className="flex gap-2 mt-2">
            <button onClick={() => onDownload("resources", "csv")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition-colors"><Download className="w-3 h-3" /> CSV</button>
            <button onClick={() => onDownload("resources", "xlsx")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition-colors"><Download className="w-3 h-3" /> Excel</button>
          </div>
        </div>
      )}
      {targetsPreview && (
        <div>
          <TableView preview={targetsPreview} />
          <div className="flex gap-2 mt-2">
            <button onClick={() => onDownload("targets", "csv")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition-colors"><Download className="w-3 h-3" /> CSV</button>
            <button onClick={() => onDownload("targets", "xlsx")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition-colors"><Download className="w-3 h-3" /> Excel</button>
          </div>
        </div>
      )}
    </div>
  );
};
