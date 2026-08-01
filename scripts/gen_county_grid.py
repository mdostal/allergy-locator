#!/usr/bin/env python3
"""Generate data/county-grid.json -- a ~3,221-county SECONDARY sample layer
that densifies the map's gradient interpolation far beyond the 168-city
spine, per docs/ROADMAP.md's "Phase 2 -- true gradients + granularity" and
explicit user direction: "the single dot on the city is the biggest issue...
we need... ALL allergy data we have."

This does NOT touch or replace the 168 authoritative, hand-curated,
grass-ground-truth-fit cities in data/cities.json / data/allergy-scores.json
-- those stay exactly as validated. This is an ADDITIONAL, honestly-labeled
"modeled" sample set that only feeds the heatmap's spatial interpolation,
giving it real data to interpolate FROM in the vast area between named
cities instead of guessing across hundreds of miles.

Two different scoring paths, matching this project's existing confidence
split:
  - Grass: reuses the shipped formula's SHAPE (base_from_climate +
    elevation_raw + coastal_nudge + a turf/irrigation boost), but replaces
    the 168-city model's hand-curated per-city turf/seed-valley flags with a
    turfScore computed from REAL county-level NASS (hay/sod/grass-seed
    acreage) and USGS (irrigation withdrawal) data -- see
    docs/TURF-DATA-SOURCES.md. NLCD land-cover (the doc's "landTurf"
    component) is NOT included: national 30m raster processing was out of
    scope for a periodic static refresh in this environment -- an honest,
    documented simplification, not a silent gap.
  - Every other allergen: directly reuses source_allergens.py's existing
    Koppen-zone-table / state-presence-gate logic unchanged (that logic was
    already purely zone/state-driven, with no per-city hand-tuning, so it
    generalizes to any county for free).

Run `python3 scripts/fetch_county_data.py` first to populate data/raw/.
"""
import csv
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from koppen_classify import classify_koppen  # noqa: E402
import source_allergens as sa  # noqa: E402

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")

with open(os.path.join(DATA_DIR, "cities.json")) as f:
    CITIES = json.load(f)
with open(os.path.join(DATA_DIR, "species-ranges.json")) as f:
    SPECIES_RANGES = json.load(f)["species"]

TIER_THRESHOLDS = [(15, "near-zero"), (35, "low"), (65, "moderate"), (89, "high")]


def tier_for(score):
    for threshold, label in TIER_THRESHOLDS:
        if score < threshold:
            return label
    return "worst"


# ---------------------------------------------------------------------------
# 1. Load raw sources
# ---------------------------------------------------------------------------
def load_centroids():
    path = os.path.join(RAW_DIR, "census_county_centroids_2020.csv")
    counties = []
    with open(path, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            fips = row["STATEFP"] + row["COUNTYFP"]
            counties.append(
                {
                    "fips": fips,
                    "name": row["COUNAME"],
                    "state_name": row["STNAME"],
                    "lat": float(row["LATITUDE"]),
                    "lon": float(row["LONGITUDE"]),
                    "pop": int(row["POPULATION"]),
                }
            )
    return counties


STATE_NAME_TO_ABBR = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
    "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
    "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA",
    "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "Puerto Rico": "PR",
}


def load_elevations_ft():
    with open(os.path.join(RAW_DIR, "county_elevations_m.json")) as f:
        meters = json.load(f)
    return {fips: m * 3.28084 for fips, m in meters.items()}


def load_nass_turf():
    """Returns {fips: {"hay": acres, "sod": acres, "grass_legume": acres}},
    treating disclosure-suppressed ("(D)") or missing cells as unknown (None)
    rather than 0 -- resolved via state-mean fallback in compute_turf_score."""
    path = os.path.join(RAW_DIR, "nass_turf_county_2022.tsv")
    by_county = {}
    with open(path) as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            fips = row["state_ansi"] + row["county_ansi"]
            value = row["value"].replace(",", "")
            acres = float(value) if value.replace(".", "", 1).isdigit() else None
            key = {"HAY": "hay", "SOD": "sod", "GRASSES & LEGUMES TOTALS": "grass_legume"}.get(row["commodity"])
            if key is None:
                continue
            by_county.setdefault(fips, {})[key] = acres
    return by_county


def load_usgs_irrigation():
    """Returns {fips: irrigated_crop_acres_proxy} from the IC- (crop
    irrigation, separate from golf) freshwater withdrawal columns -- acres
    aren't directly in this file, so total freshwater withdrawal (Mgal/d) for
    crop irrigation is used as the irrigation-intensity proxy instead."""
    path = os.path.join(RAW_DIR, "usgs_water_use_2015_county.csv")
    by_county = {}
    with open(path) as f:
        f.readline()  # skip the citation line
        reader = csv.DictReader(f)
        for row in reader:
            fips = row.get("FIPS", "").strip()
            if not fips or len(fips) != 5:
                continue
            raw = row.get("IC-WFrTo", "--")
            try:
                by_county[fips] = float(raw)
            except ValueError:
                continue
    return by_county


# ---------------------------------------------------------------------------
# 2. Coastal flag -- nearest-authoritative-city inheritance (see gen_county_
#    grid.py's module docstring: a precise coastline geometry wasn't fetched,
#    so this borrows the verified coastal/non-coastal label from whichever of
#    the 168 hand-curated cities is closest, when that city is close enough
#    to be a meaningful proxy (~1 degree, roughly 70 miles).
# ---------------------------------------------------------------------------
def nearest_city_coastal(lat, lon):
    best = min(CITIES, key=lambda c: (c["lat"] - lat) ** 2 + (c["lon"] - lon) ** 2)
    distance = math.hypot(best["lat"] - lat, best["lon"] - lon)
    return best["coastal"] if distance < 1.0 else False


# ---------------------------------------------------------------------------
# 3. Turf/irrigation model -- real NASS + USGS components only (no NLCD)
# ---------------------------------------------------------------------------
def percentile(values, p):
    s = sorted(values)
    if not s:
        return 0
    idx = min(len(s) - 1, max(0, round(p / 100 * (len(s) - 1))))
    return s[idx]


def normalize(value, p05, p95):
    if p95 <= p05:
        return 0.0
    return max(0.0, min(1.0, (value - p05) / (p95 - p05)))


# ---------------------------------------------------------------------------
# 4. Grass severity (reuses gen_spine.py's formula shape)
# ---------------------------------------------------------------------------
def base_from_climate(k, lat):
    if k in ("Af", "Am", "Aw"):
        return 91
    if k == "Cfa":
        return round(85 - (lat - 28) * 2.2)
    if k == "Cfb":
        return 46
    if k == "Csa":
        return 40
    if k == "Csb":
        return 44
    if k == "Dfa":
        return 18
    if k == "Dfb":
        return 25
    if k == "Dfc":
        return 12
    if k in ("Dsb", "Dsc"):
        return 24
    if k == "BSh":
        return 44
    if k == "BSk":
        return 7
    if k == "BWh":
        return 51
    if k == "BWk":
        return 57
    return 38


def elevation_raw(elev_ft):
    if elev_ft > 6500:
        return -20
    if elev_ft > 5500:
        return -15
    if elev_ft > 4500:
        return -12
    if elev_ft > 3500:
        return -7
    if elev_ft > 2500:
        return -3
    if elev_ft > 1800:
        return -1
    return 0


def compress(x):
    return x if x <= 92 else 92 + (x - 92) * 0.4


def is_arid_weed_zone(koppen, state, lon, lat):
    if koppen in ("BWh", "BWk"):
        return True
    if koppen == "BSh" and state == "TX" and lat < 28.5 and lon < -97.0:
        return True  # south TX brush country, matches the 168-city pattern
    return False


def compute_grass_score(koppen, lat, elev_ft, coastal, turf_score, arid_weed):
    base = base_from_climate(koppen, lat)
    # turf_score in [0,1]; scaled so a maxed-out irrigation/ag-turf county
    # lands in the same ballpark as the hand-tuned model's biggest boosts
    # (Boise's turf_boost + seed_bonus totalled ~81 on top of a BSk base of 7).
    # NOTE (honest limitation): this only captures AGRICULTURAL irrigation
    # (real NASS hay/sod acreage + USGS crop-irrigation withdrawal) -- it
    # cannot see URBAN/residential lawn irrigation (that's NLCD "landTurf",
    # not fetched here, see this script's module docstring). Confirmed during
    # generation: this systematically understates dense-metro counties whose
    # real turf exposure is suburban lawns, not farmland (Denver, Salt Lake
    # City proper) even though it correctly picks up genuine irrigated-ag
    # valleys (Ada County/Boise).
    turf_boost = round(turf_score * 95)
    arid = 19 if (arid_weed and turf_score < 0.5) else 0  # mutually exclusive w/ heavy irrigation, same as gen_spine.py
    irrig_suppression = 0.9 if turf_score >= 0.3 else 0.0
    elevation_discount = round(elevation_raw(elev_ft) * (1 - irrig_suppression))
    coastal_nudge = -4 if coastal else 0
    raw = base + turf_boost + arid + elevation_discount + coastal_nudge
    return max(2, min(97, round(compress(raw))))


# ---------------------------------------------------------------------------
# 5. Comprehensive (non-grass) allergens -- directly reuse source_allergens.py
# ---------------------------------------------------------------------------
def compute_comprehensive_scores(koppen, state, coastal):
    scores = {}
    for allergen_id, _label, _category, koppen_table, coastal_bonus in sa.ALLERGEN_DEFS:
        base = koppen_table.get(koppen, 0)
        coastal_adj = coastal_bonus if coastal else 0
        scores[allergen_id] = max(0, min(100, round(base + coastal_adj)))

    for allergen_id, _label, category in sa.ORIGINAL_PANEL_NON_GRASS:
        present_states = set(SPECIES_RANGES[sa.SPECIES_RANGES_KEY[allergen_id]])
        if state not in present_states:
            scores[allergen_id] = 0
        else:
            koppen_table = sa.CATEGORY_BASELINE[category]
            scores[allergen_id] = max(0, min(100, round(koppen_table.get(koppen, 0))))
    return scores


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def build():
    centroids = load_centroids()
    elevations_ft = load_elevations_ft()
    nass = load_nass_turf()
    irrigation = load_usgs_irrigation()

    # NASS-suppressed ("(D)") or missing counties default to 0, NOT a state
    # mean. docs/TURF-DATA-SOURCES.md suggests a state-value fallback, but
    # NASS suppresses a cell specifically because a county has too few
    # operations to report (<3) -- that condition correlates with LOW real
    # acreage, not "unknown, could be anything." A state mean actively hurts
    # states with a few huge irrigated-ag counties next to many near-zero
    # ones (e.g. Arizona: Maricopa/Yuma's real farm acreage would otherwise
    # get smeared onto Coconino/Flagstaff, a forested high plateau with
    # ~zero agriculture -- verified as a real bug during generation, caught
    # by comparing this county's output against Flagstaff's own
    # ground-truth-adjacent city score).
    def nass_value(fips, key):
        v = nass.get(fips, {}).get(key)
        return v if v is not None else 0.0

    records = []
    for c in centroids:
        fips = c["fips"]
        state = STATE_NAME_TO_ABBR.get(c["state_name"])
        if state is None or state == "PR":
            continue  # county grid covers the 50 states + DC, matching cities.json's scope
        elev_ft = elevations_ft.get(fips, 500.0)
        koppen = classify_koppen(c["lat"], c["lon"], elev_ft, state)
        coastal = nearest_city_coastal(c["lat"], c["lon"])
        records.append(
            {
                "fips": fips,
                "name": c["name"],
                "state": state,
                "lat": c["lat"],
                "lon": c["lon"],
                "elevation_ft": round(elev_ft),
                "koppen": koppen,
                "coastal": coastal,
                "hay": nass_value(fips, "hay"),
                "sod": nass_value(fips, "sod"),
                "grass_legume": nass_value(fips, "grass_legume"),
                "irrigation": irrigation.get(fips, 0.0),
            }
        )

    hay_p05, hay_p95 = percentile([r["hay"] for r in records], 5), percentile([r["hay"] for r in records], 95)
    sod_p05, sod_p95 = percentile([r["sod"] for r in records], 5), percentile([r["sod"] for r in records], 95)
    gl_p05, gl_p95 = percentile([r["grass_legume"] for r in records], 5), percentile(
        [r["grass_legume"] for r in records], 95
    )
    irr_p05, irr_p95 = percentile([r["irrigation"] for r in records], 5), percentile(
        [r["irrigation"] for r in records], 95
    )

    counties_out = []
    for r in records:
        ag_turf = normalize(r["hay"] + r["sod"], hay_p05 + sod_p05, hay_p95 + sod_p95)
        grass_seed_flag = normalize(r["grass_legume"], gl_p05, gl_p95)
        irrig_boost = normalize(r["irrigation"], irr_p05, irr_p95)
        # grass_legume (the grass-seed-farming proxy) is effectively dead data:
        # the 2022 Census of Agriculture's "GRASSES & LEGUMES TOTALS" line item
        # is almost universally suppressed/unreported at county level (p95=0
        # nationally, verified during generation) -- kept in the formula at a
        # token weight in case a future NASS vintage populates it, but ag_turf
        # (real hay+sod acreage) and irrig_boost (real USGS irrigation
        # withdrawal) carry the actual signal.
        turf_score = max(0.0, min(1.0, 0.45 * ag_turf + 0.45 * irrig_boost + 0.10 * grass_seed_flag))

        arid_weed = is_arid_weed_zone(r["koppen"], r["state"], r["lon"], r["lat"])
        grass_score = compute_grass_score(r["koppen"], r["lat"], r["elevation_ft"], r["coastal"], turf_score, arid_weed)

        scores = {"grass": grass_score}
        scores.update(compute_comprehensive_scores(r["koppen"], r["state"], r["coastal"]))

        counties_out.append(
            {
                "fips": r["fips"],
                "name": r["name"],
                "state": r["state"],
                "lat": r["lat"],
                "lon": r["lon"],
                "koppen": r["koppen"],
                "scores": scores,
            }
        )

    out_path = os.path.join(DATA_DIR, "county-grid.json")
    with open(out_path, "w") as f:
        json.dump({"counties": counties_out}, f)

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"Wrote {len(counties_out)} counties x {len(counties_out[0]['scores'])} allergens -> {out_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    build()
