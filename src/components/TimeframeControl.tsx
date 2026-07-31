"use client";

import { MONTH_NAMES } from "@/lib/severity/season";

interface Props {
  /** null = annual (unmodified peak-season score, the original behavior). */
  month: number | null;
  onChange: (month: number | null) => void;
}

/**
 * Story s6: lets a user move off the default annual/peak view and see a
 * specific month's season-adjusted severity instead. Deliberately just a
 * select — story s7 (year playback) adds a play/step control alongside this,
 * not inside it, so this stays the single source of truth for "what month is
 * selected" either way.
 */
export function TimeframeControl({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="timeframe-select" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Timeframe
      </label>
      <select
        id="timeframe-select"
        value={month ?? "annual"}
        onChange={(e) => onChange(e.target.value === "annual" ? null : Number(e.target.value))}
        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <option value="annual">Annual (peak season)</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
