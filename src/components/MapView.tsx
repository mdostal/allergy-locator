"use client";

import { useState } from "react";
import { AllergenToggleList } from "@/components/AllergenToggleList";
import { UsMap } from "@/components/UsMap";
import { StateDetailPanel } from "@/components/StateDetailPanel";

export function MapView() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

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

  const primaryActiveId = active.size > 0 ? Array.from(active)[0] : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:flex-row">
      <div className="flex flex-col gap-4 md:w-64 md:flex-shrink-0">
        <AllergenToggleList active={active} onToggle={toggleAllergen} />
        <StateDetailPanel cityId={selectedCityId} activeAllergenId={primaryActiveId} />
      </div>
      <div className="flex-1">
        <UsMap
          active={active}
          onSelectCity={setSelectedCityId}
          selectedCityId={selectedCityId}
        />
      </div>
    </div>
  );
}
