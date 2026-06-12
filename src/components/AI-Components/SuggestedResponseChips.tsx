"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SuggestedResponseChipsProps {
  suggestions: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export const SuggestedResponseChips: React.FC<SuggestedResponseChipsProps> = ({
  suggestions,
  onSelect,
  disabled = false,
}) => {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSelect(s)}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all",
            "border-[var(--brand-maroon)]/30 text-[var(--brand-maroon)]/80 bg-transparent",
            "hover:border-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)]/10 hover:text-[var(--brand-maroon)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
};
