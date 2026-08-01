"use client";

import { useMemo, useState } from "react";
import { getAllergen } from "@/lib/allergens/registry";
import type { PanelSnapshot } from "@/lib/panel-history";

interface Props {
  history: PanelSnapshot[];
}

const CHART_WIDTH = 400;
const CHART_HEIGHT = 140;
const PADDING = { top: 10, right: 10, bottom: 24, left: 10 };

type View = "chart" | "table";
const VIEWS: Array<{ value: View; label: string }> = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Full history" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Renders once 2+ uploaded panels exist (a single point can't show a trend).
 * Two switchable views (explicit user direction: "another tab appears that
 * shows the full charting over time so we can see ALL of your allergy data
 * over time"):
 *   - "Chart": the compact trend line -- only allergens with a nonzero value
 *     in at least one snapshot get a line, since showing all ~29 registry
 *     entries mostly flat at zero would bury what actually matters.
 *   - "Full history": every allergen ever recorded in ANY snapshot (even an
 *     all-zero one), as a plain table -- the complete, unfiltered record. A
 *     blank cell means that allergen wasn't part of that particular upload,
 *     distinct from a real recorded 0.
 *
 * This is presented as prefacing future long-term, account-backed historical
 * tracking (see v4 in .pHive/planning/roadmap.md, explicitly deferred) --
 * everything here still works with zero accounts, browser-local only.
 */
export function AllergyHistoryChart({ history }: Props) {
  const [view, setView] = useState<View>("chart");

  const { chartAllergenIds, allAllergenIds, points } = useMemo(() => {
    const chartIds = new Set<string>();
    const allIds = new Set<string>();
    for (const snapshot of history) {
      for (const [id, value] of Object.entries(snapshot.sensitivities)) {
        allIds.add(id);
        if (value > 0) chartIds.add(id);
      }
    }

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const xStep = history.length > 1 ? innerWidth / (history.length - 1) : 0;

    const computedPoints = history.map((snapshot, i) => ({
      x: PADDING.left + i * xStep,
      date: snapshot.date,
      values: snapshot.sensitivities,
    }));

    return {
      chartAllergenIds: [...chartIds],
      allAllergenIds: [...allIds],
      points: computedPoints.map((p) => ({
        ...p,
        yFor: (id: string) => PADDING.top + innerHeight * (1 - (p.values[id] ?? 0) / 100),
      })),
    };
  }, [history]);

  if (history.length < 2 || allAllergenIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Your allergies over time</h3>
        <div
          role="tablist"
          aria-label="History view"
          className="flex gap-1 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800"
        >
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={view === option.value}
              onClick={() => setView(option.value)}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                view === option.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        From your {history.length} uploaded test{history.length === 1 ? "" : "s"}.
      </p>

      {view === "chart" ? (
        chartAllergenIds.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Every recorded value is 0 so far -- nothing to trend yet. See the Full history tab for
            everything recorded.
          </p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="img"
              aria-label="Your allergy sensitivities over time, one line per allergen"
              className="w-full"
            >
              {chartAllergenIds.map((id) => {
                const allergen = getAllergen(id);
                if (!allergen) return null;
                const linePoints = points.map((p) => `${p.x.toFixed(1)},${p.yFor(id).toFixed(1)}`).join(" ");
                return (
                  <g key={id}>
                    <polyline points={linePoints} fill="none" stroke={allergen.color} strokeWidth={2} />
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.yFor(id)} r={2.5} fill={allergen.color}>
                        <title>
                          {allergen.label} on {formatDate(p.date)}: {p.values[id] ?? 0}/100
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })}
              {points.map((p, i) => (
                <text
                  key={i}
                  x={p.x}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[8px] dark:fill-zinc-500"
                >
                  {formatDate(p.date)}
                </text>
              ))}
            </svg>

            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {chartAllergenIds.map((id) => {
                const allergen = getAllergen(id);
                if (!allergen) return null;
                return (
                  <span key={id} className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: allergen.color }}
                      aria-hidden
                    />
                    {allergen.label}
                  </span>
                );
              })}
            </div>
          </>
        )
      ) : (
        <div className="max-h-56 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
              <tr className="text-zinc-500 dark:text-zinc-400">
                <th className="px-2 py-1 font-medium">Date</th>
                {allAllergenIds.map((id) => (
                  <th key={id} className="whitespace-nowrap px-2 py-1 font-medium">
                    {getAllergen(id)?.label ?? id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((snapshot, i) => (
                <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap px-2 py-1 text-zinc-700 dark:text-zinc-300">
                    {formatFullDate(snapshot.date)}
                  </td>
                  {allAllergenIds.map((id) => (
                    <td key={id} className="px-2 py-1 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {snapshot.sensitivities[id] !== undefined ? snapshot.sensitivities[id] : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
