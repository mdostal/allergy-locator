"use client";

import { useMemo, useState } from "react";
import cities from "@data/cities.json";
import { getComposite } from "@/lib/severity/composite";
import { hasDailyCurve } from "@/lib/severity/daily-curves";
import type { ModelSettings } from "@/lib/model-settings";
import { MONTH_NAMES } from "@/lib/severity/season";

interface Props {
  sensitivities: Record<string, number>;
  settings: ModelSettings;
}

const CITIES_BY_STATE = (() => {
  const grouped = new Map<string, typeof cities>();
  for (const city of [...cities].sort((a, b) => a.city.localeCompare(b.city))) {
    const list = grouped.get(city.state) ?? [];
    list.push(city);
    grouped.set(city.state, list);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
})();

const MAX_TRIP_DAYS = 60;

interface DateParts {
  month: number;
  day: number;
}

function parseIsoDate(iso: string): DateParts | null {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { month: Number(match[1]), day: Number(match[2]) };
}

/** Walks the calendar forward using a fixed leap-year reference (2024, so
 * Feb 29 is a valid step) -- only the month/day matters for this
 * climatological, year-independent forecast, never the actual year. */
function addDays({ month, day }: DateParts, amount: number): DateParts {
  const d = new Date(2024, month - 1, day);
  d.setDate(d.getDate() + amount);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

function isSameDate(a: DateParts, b: DateParts): boolean {
  return a.month === b.month && a.day === b.day;
}

function formatDate({ month, day }: DateParts): string {
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${day}`;
}

interface ForecastDay extends DateParts {
  value: number | null;
}

/**
 * Explicit user direction: "I'd like the users to be able to pick and go
 * over WHEN they are traveling so they could forecast their allergies in an
 * area for a time." Built on the same real, per-city NOAA-daily-normal
 * curves (data/daily-season-curves.json) that upgraded the main map's
 * month-granularity controls -- this is the first surface that exposes full
 * day-level precision end to end.
 */
export function TripPlanner({ sensitivities, settings }: Props) {
  const [cityId, setCityId] = useState(cities[0].id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const hasSensitivities = Object.values(sensitivities).some((v) => v > 0);
  const city = cities.find((c) => c.id === cityId);
  const cityHasDailyCurve = hasDailyCurve(cityId);

  const forecast = useMemo<ForecastDay[] | null>(() => {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end || !hasSensitivities) return null;

    const days: DateParts[] = [];
    let current = start;
    for (let i = 0; i <= MAX_TRIP_DAYS; i++) {
      days.push(current);
      if (isSameDate(current, end)) break;
      if (i === MAX_TRIP_DAYS) return null; // malformed/too-long range, bail rather than guess
      current = addDays(current, 1);
    }

    return days.map(({ month, day }) => {
      const composite = getComposite(sensitivities, cityId, month, {
        day,
        seasonStrength: settings.seasonStrength,
        combinationMethod: settings.combinationMethod,
      });
      return { month, day, value: composite?.value ?? null };
    });
  }, [cityId, startDate, endDate, sensitivities, settings, hasSensitivities]);

  const validDays = forecast?.filter((d): d is ForecastDay & { value: number } => d.value !== null) ?? [];
  const best = validDays.length ? validDays.reduce((a, b) => (b.value < a.value ? b : a)) : null;
  const worst = validDays.length ? validDays.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const average = validDays.length
    ? Math.round(validDays.reduce((sum, d) => sum + d.value, 0) / validDays.length)
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Trip planner</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Forecast your allergies for a place and a date range, using your sensitivities above.
      </p>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Destination</span>
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {CITIES_BY_STATE.map(([state, list]) => (
            <optgroup key={state} label={state}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Departure</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Return</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </label>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {cityHasDailyCurve
          ? "Real day-by-day NOAA climate-normal data for this city."
          : "No day-level station match for this city -- using the coarser monthly model."}{" "}
        A climatological forecast (what a typical year looks like), not a specific year&rsquo;s weather.
      </p>

      {!hasSensitivities && (
        <p className="text-zinc-500 dark:text-zinc-400">Set a nonzero sensitivity above to forecast a trip.</p>
      )}

      {hasSensitivities && (!startDate || !endDate) && (
        <p className="text-zinc-500 dark:text-zinc-400">Pick a departure and return date.</p>
      )}

      {hasSensitivities && startDate && endDate && !forecast && (
        <p className="text-zinc-500 dark:text-zinc-400">
          That range looks off, or is longer than {MAX_TRIP_DAYS} days -- try a shorter trip.
        </p>
      )}

      {forecast && best && worst && average !== null && city && (
        <div className="flex flex-col gap-2">
          <p className="text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">{city.city}, {city.state}</span>: average score{" "}
            <span className="font-semibold">{average}/100</span> over your trip.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Best day: {formatDate(best)} ({best.value}/100) &middot; Worst day: {formatDate(worst)} (
            {worst.value}/100)
          </p>
          <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <tbody>
                {forecast.map((d) => (
                  <tr key={`${d.month}-${d.day}`} className="border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
                    <td className="px-2 py-1 text-zinc-500 dark:text-zinc-400">{formatDate(d)}</td>
                    <td className="px-2 py-1 text-zinc-700 dark:text-zinc-300">
                      {d.value !== null ? `${d.value}/100` : "no data"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
