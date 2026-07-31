"use client";

import { BaseSvgMap } from "@/components/BaseSvgMap";
import { getComposite } from "@/lib/severity/composite";
import { compositeColor } from "@/lib/severity/palette";

interface Props {
  sensitivities: Record<string, number>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
}

/** Mode 2: one personalized green->red composite map, per the user's own framing
 * ("make the chart that goes from green to red purely on YOUR allergies"). */
export function CompositeMap({ sensitivities, onSelectCity, selectedCityId }: Props) {
  return (
    <BaseSvgMap
      ariaLabel="Your personalized allergy severity map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      colorForCity={(cityId) => {
        const composite = getComposite(sensitivities, cityId);
        return composite ? compositeColor(composite.value) : undefined;
      }}
      tooltipForCity={(cityId) => {
        const composite = getComposite(sensitivities, cityId);
        return composite ? `your score: ${composite.value}/100` : undefined;
      }}
    />
  );
}
