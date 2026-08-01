"use client";

import { useMemo } from "react";
import { getAllergen } from "@/lib/allergens/registry";
import type { PanelSnapshot } from "@/lib/panel-history";

interface Props {
  history: PanelSnapshot[];
}

const CHART_WIDTH = 400;
const CHART_HEIGHT = 140;
const PADDING = { top: 10, right: 10, bottom: 24, left: 10 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Renders once 2+ uploaded panels exist (a single point can't show a trend).
 * Only allergens with a nonzero value in at least one snapshot get a line --
 * showing all ~29 registry entries, mostly flat at zero, would bury the
 * allergens that actually matter. Each line reuses that allergen's own
 * registry color (color follows the entity, same identity as the map/
 * sliders elsewhere in this app), with a legend since there are 2+ series.
 */
export function AllergyHistoryChart({ history }: Props) {
  const { allergenIds, points } = useMemo(() => {
    const ids = new Set<string>();
    for (const snapshot of history) {
      for (const [id, value] of Object.entries(snapshot.sensitivities)) {
        if (value > 0) ids.add(id);
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
      allergenIds: [...ids],
      points: computedPoints.map((p) => ({
        ...p,
        yFor: (id: string) => PADDING.top + innerHeight * (1 - (p.values[id] ?? 0) / 100),
      })),
    };
  }, [history]);

  if (history.length < 2 || allergenIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Your allergies over time</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        From your {history.length} uploaded test{history.length === 1 ? "" : "s"}.
      </p>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Your allergy sensitivities over time, one line per allergen"
        className="w-full"
      >
        {allergenIds.map((id) => {
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
        {allergenIds.map((id) => {
          const allergen = getAllergen(id);
          if (!allergen) return null;
          return (
            <span key={id} className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: allergen.color }} aria-hidden />
              {allergen.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
