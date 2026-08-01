"use client";

import { useState } from "react";
import { CareAccessMap } from "@/components/CareAccessMap";
import { GradientLegend } from "@/components/GradientLegend";
import { getCareAccess, CARE_ACCESS_LAYERS, type CareAccessLayer } from "@/lib/care-access/score";
import { compositeColor } from "@/lib/severity/palette";
import cities from "@data/cities.json";

const CITY_BY_ID = new Map(cities.map((c) => [c.id, c]));

export function CareAccessView() {
  const [layer, setLayer] = useState<CareAccessLayer>("general");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const selectedCity = selectedCityId ? CITY_BY_ID.get(selectedCityId) : undefined;
  const selectedResult = selectedCityId ? getCareAccess(selectedCityId, layer) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:flex-row">
      <div className="flex flex-col gap-4 md:w-64 md:flex-shrink-0">
        <div
          role="radiogroup"
          aria-label="Care access layer"
          className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
        >
          {CARE_ACCESS_LAYERS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={layer === option.id}
              onClick={() => setLayer(option.id)}
              className={`rounded-md px-3 py-1.5 text-left text-sm font-medium ${
                layer === option.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Estimated drive time to the nearest facility, straight-line distance only (not real
          routing) — see{" "}
          <a
            href="https://github.com/mdostal/allergy-locator/blob/main/data/care-access-methodology.md"
            className="text-blue-600 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            methodology
          </a>
          .
        </p>

        {selectedCity && (
          <div className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedCity.city}, {selectedCity.state}
            </p>
            {selectedResult ? (
              <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                <p>Nearest facility: {selectedResult.nearestFacility}</p>
                <p>Location: {selectedResult.facilityCity}</p>
                <p>Est. drive time: ~{Math.round(selectedResult.driveMinutes)} min ({selectedResult.tier})</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">No data for this layer.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="w-56">
          <GradientLegend label="Care access concern (higher = farther)" colorForValue={compositeColor} />
        </div>
        <CareAccessMap layer={layer} onSelectCity={setSelectedCityId} selectedCityId={selectedCityId} />
      </div>
    </div>
  );
}
