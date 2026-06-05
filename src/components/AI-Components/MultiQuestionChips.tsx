"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionGroup {
  id: string;
  question: string;
  suggestions: string[];
  /** When true, the user can pick multiple chips in this group (e.g. goals). */
  multi_select?: boolean;
  /** When true, the user can also type a free-text answer for this group. */
  allow_custom?: boolean;
}

interface MultiQuestionChipsProps {
  groups: QuestionGroup[];
  onSubmit: (combined: string) => void;
  disabled?: boolean;
}

// Selection value: single groups store a string; multi groups store string[]
type Sel = Record<string, string | string[]>;

const hasValue = (v: string | string[] | undefined): boolean =>
  Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";

export const MultiQuestionChips: React.FC<MultiQuestionChipsProps> = ({
  groups,
  onSubmit,
  disabled = false,
}) => {
  const [sel, setSel] = useState<Sel>({});
  const [custom, setCustom] = useState<Record<string, string>>({});

  const anyMulti = groups.some((g) => g.multi_select || g.allow_custom);

  const flatten = (s: Sel): string => {
    const parts: string[] = [];
    for (const g of groups) {
      const v = s[g.id];
      if (Array.isArray(v)) parts.push(...v);
      else if (v) parts.push(v);
      const c = custom[g.id]?.trim();
      if (c) parts.push(c);
    }
    return parts.join(" · ");
  };

  const handleChip = (group: QuestionGroup, value: string) => {
    if (disabled) return;
    setSel((prev) => {
      let next: Sel;
      if (group.multi_select) {
        const arr = Array.isArray(prev[group.id]) ? [...(prev[group.id] as string[])] : [];
        const idx = arr.indexOf(value);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(value);
        next = { ...prev, [group.id]: arr };
      } else {
        next = { ...prev, [group.id]: value };
      }
      // Auto-submit only for simple all-single 2-group cards with no custom inputs
      if (!anyMulti && groups.length <= 2 && groups.every((g) => hasValue(next[g.id]))) {
        onSubmit(flatten(next));
      }
      return next;
    });
  };

  const isChosen = (group: QuestionGroup, value: string): boolean => {
    const v = sel[group.id];
    return Array.isArray(v) ? v.includes(value) : v === value;
  };

  // Ready when every group has either a chip selection or a custom value
  const ready = groups.every(
    (g) => hasValue(sel[g.id]) || (g.allow_custom && (custom[g.id]?.trim() ?? "") !== "")
  );

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-3">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            {group.question}
            {group.multi_select && (
              <span className="ml-1.5 normal-case font-normal text-gray-400">· pick any</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.suggestions.map((s, i) => {
              const chosen = isChosen(group, s);
              return (
                <button
                  key={i}
                  onClick={() => handleChip(group, s)}
                  disabled={disabled}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                    chosen
                      ? "border-[#6B1D1D] bg-[#6B1D1D]/10 text-[#6B1D1D] font-semibold"
                      : "border-gray-300 text-gray-600 bg-transparent hover:border-[#6B1D1D]/50 hover:text-[#6B1D1D]/80",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                  )}
                >
                  {group.multi_select && <span className="mr-1">{chosen ? "✓" : "+"}</span>}
                  {s}
                </button>
              );
            })}
          </div>
          {group.allow_custom && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Plus className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={custom[group.id] ?? ""}
                onChange={(e) => setCustom((c) => ({ ...c, [group.id]: e.target.value }))}
                placeholder="Add your own…"
                disabled={disabled}
                className="flex-1 bg-transparent text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none border-b border-dashed border-gray-300 focus:border-[#6B1D1D]/50 py-0.5"
              />
            </div>
          )}
        </div>
      ))}

      {/* Multi-select / custom cards need explicit submit */}
      {(anyMulti || groups.length > 2) && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => ready && onSubmit(flatten(sel))}
            disabled={!ready || disabled}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
              ready && !disabled
                ? "bg-[#6B1D1D] text-white hover:bg-[#6B1D1D]/90"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
            )}
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
};
