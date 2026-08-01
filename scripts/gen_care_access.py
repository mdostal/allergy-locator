#!/usr/bin/env python3
"""
Regenerates data/care-access.json from the 3 hospital-facility lists
(data/hospitals-general.json, data/hospitals-pediatric-cardiac.json,
data/hospitals-pediatric-specialty.json) against the 168-city spine
(data/cities.json).

Care-access dimension 2 (docs/ROADMAP.md), v5's "second real dataset" slice.
This script didn't exist before -- the original care-access.json was
hand-assembled with no reproducible generation path. Written now because a
real data-quality bug was found by inspection before building a map layer on
top of it: 9 cities (including New York City and Baltimore) had a verified
pediatric cardiac-surgery program but ZERO entry in the pediatric-specialty
hospital list at all, so their "nearest specialty care" silently resolved to
a much farther facility than reality. Those 10 hospitals (St. Louis has two)
were added to hospitals-pediatric-specialty.json, reusing the exact
name/city/state/lat/lon already verified in the cardiac list -- not new
unverified facts, just closing an inconsistency between two lists that
otherwise share nearly every major academic children's hospital.

Method (unchanged from the original file's own documented method):
est_drive_min = great_circle_distance_mi * 1.25 road-factor / 55 mph.
Distance is straight-line (haversine), not real routing -- a documented,
honest approximation, consistent with every other estimate in this project.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROAD_FACTOR = 1.25
AVG_SPEED_MPH = 55

TIERS = [(30, "<=30"), (60, "<=60"), (120, "<=120")]


def tier_for(minutes):
    for threshold, label in TIERS:
        if minutes <= threshold:
            return label
    return "120+"


def haversine_mi(lat1, lon1, lat2, lon2):
    r = 3958.8  # Earth radius in miles
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def nearest_facility(city, facilities):
    best = None
    best_dist = None
    for f in facilities:
        d = haversine_mi(city["lat"], city["lon"], f["lat"], f["lon"])
        if best_dist is None or d < best_dist:
            best_dist = d
            best = f
    distance_mi = round(best_dist, 1)
    est_drive_min = round(distance_mi * ROAD_FACTOR / AVG_SPEED_MPH * 60, 1)
    return {
        "nearest_facility": best["name"],
        "facility_city": f"{best['city']}, {best['state']}",
        "distance_mi": distance_mi,
        "est_drive_min": est_drive_min,
        "tier": tier_for(est_drive_min),
    }


def main():
    cities = json.loads((ROOT / "data/cities.json").read_text())
    layers = {
        "pediatric_cardiac": json.loads((ROOT / "data/hospitals-pediatric-cardiac.json").read_text()),
        "pediatric_specialty": json.loads((ROOT / "data/hospitals-pediatric-specialty.json").read_text()),
        "general": json.loads((ROOT / "data/hospitals-general.json").read_text()),
    }

    out = {
        "_meta": {
            "description": "US healthcare access per city across 3 facility layers. Drive time is an ESTIMATE, not real routing.",
            "method": "est_drive_min = great_circle_distance_mi * 1.25 road-factor / 55 mph, converted to minutes. Distance is straight-line (haversine).",
            "tiers": {"<=30": "<=30 min", "<=60": "<=60 min", "<=120": "<=120 min", "120+": ">120 min"},
            "layer_counts": {name: len(facilities) for name, facilities in layers.items()},
            "caveat": "Straight-line distance x 1.25 factor underestimates drive time in mountainous/rural terrain (e.g. Rocky Mountain West).",
        }
    }

    for city in cities:
        record = {"city": f"{city['city']}, {city['state']}"}
        for layer_name, facilities in layers.items():
            record[layer_name] = nearest_facility(city, facilities)
        out[city["id"]] = record

    (ROOT / "data/care-access.json").write_text(json.dumps(out, indent=2) + "\n")
    print(f"Wrote data/care-access.json for {len(cities)} cities across {len(layers)} layers.")


if __name__ == "__main__":
    main()
