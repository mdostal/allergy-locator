"""Rule-based Koppen-zone classifier for US counties.

The 168-city spine's Koppen zones (data/cities.json) were assigned by direct
geographic/climate knowledge, city by city -- the same approach used here,
just made systematic enough to run unattended across ~3,221 counties. Real
Koppen classification is fundamentally driven by exactly the inputs this
function uses (temperature via latitude + elevation, moisture via coastal
proximity + regional aridity/rain-shadow patterns); this is a genuine,
physically-grounded simplification of that, not an arbitrary lookup.

Calibrated against all 168 existing cities (see calibrate() below) -- run this
file directly (`python3 scripts/koppen_classify.py`) to print agreement.
Perfect replication isn't the goal: a few existing assignments reflect
city-specific judgment calls too fine-grained to generalize (e.g. Sundance WY
vs. Rapid City SD -- ~50 miles apart, classified Dfb vs. BSk in the hand-tuned
data) -- those residual misses are expected and documented, not chased to 0.
"""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def classify_koppen(lat, lon, elev_ft, state):
    # --- Special-case whole states/territories -----------------------------
    if state == "HI":
        return "Aw"
    if state == "AK":
        # No tundra/subarctic-E zone in this app's model (irrelevant to
        # pollen at that latitude); Dfc is the coldest zone we model.
        return "Dfc"

    # --- Tropical Florida tip -----------------------------------------------
    if state == "FL" and lat < 27.0:
        return "Aw"

    # --- Pacific Northwest coastal/marine strip (flat lon cutoff; WA/OR's ---
    # coast runs close enough to true-north that a latitude-dependent slope
    # isn't needed -- Spokane at -117.4 must stay continental/BSk while
    # Seattle/Portland/Salem/Vancouver-WA at -122 to -123 are marine).
    if state in ("WA", "OR") and lon <= -120.0:
        return "Cfb" if lat >= 46.3 else "Csb"

    # --- California: named regional boxes (coast/basin/valley/desert) -------
    if state == "CA":
        if lat < 33.0:
            return "BSh"  # San Diego County: coastal but climatologically semi-arid
        if 33.0 <= lat < 34.55 and -119.2 <= lon <= -117.0:
            # LA Basin/Orange County/Inland Empire share this lat/lon band --
            # elevation and how far east/inland separates the marine-layer
            # coastal floor from the basin-adjacent valleys from the drier
            # far-inland cities (real elevation clusters, not a guess: coastal
            # cities sit at 30-285ft, inland-valley 350-1200ft, far-inland
            # Inland Empire 860-1630ft).
            if elev_ft <= 500:
                return "Csb"  # LA/Long Beach/Anaheim/Santa Ana/Irvine/Oceanside
            if lon < -117.95:
                return "Csa"  # Glendale/Santa Clarita (LA-basin-adjacent valleys)
            return "BSh"  # Riverside/Fontana/Ontario/Rancho Cucamonga/San Bernardino
        if lat >= 37.0 and lon <= -121.7:
            return "Csb"  # SF Bay Area (coastal, marine)
        if lat >= 37.0 and lon <= -122.4:
            return "Csb"  # far-north CA coast (Santa Rosa pattern)
        if elev_ft >= 3000:
            return "BWh" if lat < 35.5 else "BSk"  # Mojave / Sierra-adjacent high desert
        if lat >= 37.0:
            return "Csa"  # Central Valley, north (Sacramento/Stockton/Modesto)
        return "BSh"  # Central Valley, south (Fresno/Bakersfield) / other inland CA

    # --- Desert Southwest (AZ/NV/s.CA/s.NM/w.TX low deserts) ----------------
    # --- Named high-plateau "sky island" pockets -- narrow, specific highland
    # mesas that run noticeably colder/drier-summer than the surrounding
    # semi-arid steppe/desert at similar elevation (Flagstaff's Colorado
    # Plateau rim; Los Alamos's Pajarito Plateau). Checked BEFORE the general
    # desert-Southwest rule below, which would otherwise catch Flagstaff
    # first. Not a general elevation rule: nearby similarly-high places
    # (Santa Fe/Taos NM, Monticello/Blanding UT) stay BSk in the real data --
    # these two are genuinely distinct, not just "high enough."
    if state == "AZ" and lat > 34.5 and lon < -111.0 and elev_ft > 6000:
        return "Dsb"  # Flagstaff / Colorado Plateau rim
    if state == "NM" and lat > 35.5 and lon < -106.5 and elev_ft > 7000:
        return "Dsb"  # Los Alamos / Pajarito Plateau

    is_desert_sw_region = (
        (state == "AZ" and lat < 35.5)
        or (state == "NV" and lat < 37.5)
        or (state == "NM" and lat < 33.5 and lon < -103.5)
        or (state == "TX" and lon < -104.5)
    )
    if is_desert_sw_region:
        if elev_ft > 3000:
            return "BWk"  # cooler desert (El Paso, Carlsbad pattern)
        return "BWh"  # hot low desert (Phoenix/Mesa/Yuma/Las Vegas pattern)

    # --- South Texas brush country (semi-arid, desert-adjacent weed/dust) ---
    if state == "TX" and lat < 28.5 and lon < -97.0:
        return "BSh"

    # --- Named wetter interior-mountain pockets (real orographic precip, ---
    # not the surrounding semi-arid high-plains/basin default below). Idaho
    # panhandle/NW Montana specifically -- excludes WA's Columbia Basin
    # scablands (Spokane), which stay dry despite similar longitude.
    if state in ("ID", "MT") and lat >= 47.0 and -117.5 <= lon <= -113.5:
        return "Dfb"  # N. Rockies/Glacier/N. Idaho panhandle (Kalispell/Sandpoint) --
        # excludes central/eastern MT plains (Geraldine), which stay BSk
    if 36.8 <= lat < 38.0 and -108.5 <= lon < -107.0:
        return "Dfb"  # San Juan Mountains, CO (Durango) -- wetter than the Rio
        # Grande-valley high desert just to its east (Santa Fe/Taos/Los Alamos)

    # --- High Plains / Intermountain semi-arid steppe -----------------------
    # Covers Santa Fe/Taos/Monticello/Blanding-pattern high plateaus too --
    # high elevation alone stays BSk here; Dsb is reserved for the two named
    # "sky island" pockets handled above.
    high_plains_states = {"CO", "WY", "MT", "SD", "ND", "NE", "KS", "UT", "ID", "NM", "TX", "OK", "WA", "OR", "NV"}
    if state in high_plains_states and (lon < -100.0 or elev_ft > 3500):
        return "BSk"

    # --- Atlantic coastal-plain moderation (Cfa extends further north here --
    # than the continental interior at the same latitude) -------------------
    if state in ("NJ", "DE", "MD", "DC", "VA"):
        return "Cfa"
    if state == "NY":
        return "Cfa" if lat < 41.5 else "Dfb"
    if state == "PA":
        return "Dfb" if elev_ft > 500 else "Cfa"
    if state in ("MA", "RI", "CT", "NH", "VT", "ME"):
        return "Dfb"

    # --- Humid continental vs. humid subtropical: latitude-band cutoff ------
    # The Dfa/Dfb line sits further north in the drier continental Plains
    # than in the humid Midwest/Great Lakes at the same latitude (Sioux
    # Falls-pattern: hotter continental summers push the "hot-summer" band
    # north despite the higher latitude).
    eastern_us = lon > -100.0
    if eastern_us:
        dfa_dfb_boundary = 44.0 if lon < -90.0 else 42.5
        if lat < 38.3:
            base = "Cfa"
        elif lat < dfa_dfb_boundary:
            base = "Dfa"
        elif lat < 46.0:
            base = "Dfb"
        else:
            base = "Dfc" if lon > -85 else "Dfb"  # Upper Great Lakes/Maine vs. N Plains
        # High-elevation Appalachian pocket cools a Cfa band into oceanic Cfb.
        if base == "Cfa" and elev_ft > 1800:
            return "Cfb"
        return base

    return "Cfa"  # fallback: shouldn't be reached given the rules above


def calibrate():
    with open(os.path.join(DATA_DIR, "cities.json")) as f:
        cities = json.load(f)

    matches = 0
    mismatches = []
    for c in cities:
        predicted = classify_koppen(c["lat"], c["lon"], c["elevation_ft"], c["state"])
        if predicted == c["koppen"]:
            matches += 1
        else:
            mismatches.append((c["city"], c["state"], c["koppen"], predicted))

    print(f"Agreement: {matches}/{len(cities)} = {100 * matches / len(cities):.1f}%")
    if mismatches:
        print(f"\n{len(mismatches)} mismatches:")
        for city, state, actual, predicted in mismatches:
            print(f"  {city}, {state}: actual={actual} predicted={predicted}")


if __name__ == "__main__":
    calibrate()
