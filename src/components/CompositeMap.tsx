"use client";

import { BaseSvgMap } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { getComposite } from "@/lib/severity/composite";
import { compositeColor } from "@/lib/severity/palette";
import { NO_DATA_COLOR } from "@/lib/severity/palette";

interface Props {
  sensitivities: Record<string, number>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  month: number | null;
}

/** Mode 2: one personalized green->red composite map, per the user's own framing
 * ("make the chart that goes from green to red purely on YOUR allergies"). */
export function CompositeMap({ sensitivities, onSelectCity, selectedCityId, month }: Props) {
  return (
    <BaseSvgMap
      ariaLabel="Your personalized allergy severity map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      renderMarker={(point, isSelected) => {
        const composite = getComposite(sensitivities, point.city.id, month ?? undefined);
        return (
          <CityMarker
            point={point}
            isSelected={isSelected}
            fill={composite ? compositeColor(composite.value) : NO_DATA_COLOR}
            tooltip={composite ? `your score: ${composite.value}/100` : undefined}
          />
        );
      }}
    />
  );
}
