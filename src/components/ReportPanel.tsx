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
  const [showFullRanking, setShowFullRanking] = useState(false);
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

          <div>
            <button
              type="button"
              onClick={() => setShowFullRanking((v) => !v)}
              className="text-xs font-medium uppercase tracking-wide text-blue-600 hover:underline dark:text-blue-400"
            >
              {showFullRanking ? "Hide" : "Show"} full ranking (all {report.fullRanking.length} cities)
            </button>

            {showFullRanking && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="w-full table-fixed text-left text-[11px]">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                    <tr className="text-zinc-500 dark:text-zinc-400">
                      <th className="w-6 px-1.5 py-1 font-medium">#</th>
                      <th className="px-1.5 py-1 font-medium">City</th>
                      <th className="w-9 px-1.5 py-1 font-medium">Avg</th>
                      <th className="w-16 px-1.5 py-1 font-medium">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.fullRanking.map((c, i) => (
                      <tr key={c.cityId} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-1.5 py-1 text-zinc-400 dark:text-zinc-500">{i + 1}</td>
                        <td className="truncate px-1.5 py-1 text-zinc-700 dark:text-zinc-300">
                          {c.city}, {c.state}
                        </td>
                        <td className="px-1.5 py-1 text-zinc-700 dark:text-zinc-300">{c.average}</td>
                        <td className="whitespace-nowrap px-1.5 py-1 text-zinc-500 dark:text-zinc-400">
                          {c.best.value}–{c.worst.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
