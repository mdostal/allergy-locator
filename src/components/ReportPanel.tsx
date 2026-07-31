"use client";

import { useState } from "react";
import { generateReport, type Report } from "@/lib/reports/generate";
import { MONTH_NAMES } from "@/lib/severity/season";

interface Props {
  sensitivities: Record<string, number>;
}

/**
 * Story s8: generated on demand (a button), not recomputed on every slider
 * tick -- each report is a fresh 168-city x 12-month sweep (2016 composite
 * calls), cheap enough to run in one click but not something to run on every
 * render.
 */
export function ReportPanel({ sensitivities }: Props) {
  const [report, setReport] = useState<Report | null>(null);
  const hasSensitivities = Object.values(sensitivities).some((v) => v > 0);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Report</h3>
        <button
          type="button"
          disabled={!hasSensitivities}
          onClick={() => setReport(generateReport(sensitivities))}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
        >
          Generate report
        </button>
      </div>

      {!hasSensitivities && (
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Set a nonzero sensitivity above, then generate a report.
        </p>
      )}

      {hasSensitivities && !report && (
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Computed across all 168 cities x 12 months for your current sliders.
        </p>
      )}

      {report && (
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Best time + place
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              {report.bestTimePlace.city}, {report.bestTimePlace.state} in{" "}
              {MONTH_NAMES[report.bestTimePlace.month - 1]} — score {report.bestTimePlace.value}/100
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Avoid entirely (no good season for you there)
            </p>
            <ul className="mt-1 space-y-0.5 text-zinc-700 dark:text-zinc-300">
              {report.worstAvoid.map((c) => (
                <li key={c.cityId}>
                  {c.city}, {c.state} — best case still {c.floor}/100
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Notable seasonal windows
            </p>
            <ul className="mt-1 space-y-1 text-zinc-700 dark:text-zinc-300">
              {report.seasonalWindows.map((w) => (
                <li key={w.cityId}>
                  <span className="font-medium">
                    {w.city}, {w.state}
                  </span>{" "}
                  (avg {w.average}/100)
                  {w.lowWindow && <> — easy: {w.lowWindow}</>}
                  {w.highWindow && <>, rough: {w.highWindow}</>}
                  {!w.lowWindow && !w.highWindow && <> — steady year-round</>}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
            Not medical advice — modeled from open climate/vegetation data, not ground-truth-fit
            for every allergen. One input among many, same as the map above.
          </p>
        </div>
      )}
    </div>
  );
}
