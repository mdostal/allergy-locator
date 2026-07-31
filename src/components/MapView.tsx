"use client";

import { useState } from "react";
import { AllergenToggleList } from "@/components/AllergenToggleList";
import { SensitivitySliders } from "@/components/SensitivitySliders";
import { UsMap } from "@/components/UsMap";
import { CompositeMap } from "@/components/CompositeMap";
import { StateDetailPanel } from "@/components/StateDetailPanel";
import { TimeframeControl } from "@/components/TimeframeControl";
import { YearPlayback } from "@/components/YearPlayback";
import authorPreset from "@data/presets/author.json";

type Mode = "overlay" | "composite";

export function MapView() {
  const [mode, setMode] = useState<Mode>("overlay");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [sensitivities, setSensitivities] = useState<Record<string, number>>({});
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  function toggleAllergen(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function setSensitivity(id: string, value: number) {
    setSensitivities((prev) => ({ ...prev, [id]: value }));
  }

  function loadAuthorPreset() {
    setSensitivities(authorPreset.sensitivities);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:flex-row">
      <div className="flex flex-col gap-4 md:w-64 md:flex-shrink-0">
        <div
          role="radiogroup"
          aria-label="Map mode"
          className="inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "overlay"}
            onClick={() => setMode("overlay")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === "overlay"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Allergen overlays
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "composite"}
            onClick={() => setMode("composite")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === "composite"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            My map
          </button>
        </div>

        {mode === "overlay" ? (
          <AllergenToggleList active={active} onToggle={toggleAllergen} />
        ) : (
          <SensitivitySliders
            sensitivities={sensitivities}
            onChange={setSensitivity}
            onLoadPreset={loadAuthorPreset}
          />
        )}

        <StateDetailPanel
          cityId={selectedCityId}
          mode={mode}
          activeAllergenIds={Array.from(active)}
          sensitivities={sensitivities}
          month={month}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-end gap-3">
          <YearPlayback month={month} onMonthChange={setMonth} />
          <TimeframeControl month={month} onChange={setMonth} />
        </div>
        {mode === "overlay" ? (
          <UsMap
            active={active}
            onSelectCity={setSelectedCityId}
            selectedCityId={selectedCityId}
            month={month}
          />
        ) : (
          <CompositeMap
            sensitivities={sensitivities}
            onSelectCity={setSelectedCityId}
            selectedCityId={selectedCityId}
            month={month}
          />
        )}
      </div>
    </div>
  );
}
