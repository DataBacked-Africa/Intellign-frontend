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
            "border-[#6B1D1D]/30 text-[#6B1D1D]/80 bg-transparent",
            "hover:border-[#6B1D1D] hover:bg-[#6B1D1D]/10 hover:text-[#6B1D1D]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
};
