#!/usr/bin/env python3
"""Fetch the real, public, keyless county-level source data that
gen_county_grid.py needs (story: county/raster gradient expansion, per
docs/ROADMAP.md's "Phase 2 -- true gradients + granularity" and
docs/TURF-DATA-SOURCES.md's turf/irrigation research).

Zero-cost, zero-secrets, zero live DB per this project's constraints: this
script pulls a handful of small, versioned, public government files into
data/raw/ (committed to the repo, with source + fetch date documented in
each file's own header/companion note) so the county grid can be
regenerated offline by gen_county_grid.py without re-fetching every time.
Re-run this script periodically (the user asked for "pull it every so
often") to refresh against newer Census/USGS/NASS releases -- it's a
static pull, not a live feed.

Sources (all public domain / open government data, no API key required):
  1. US Census Bureau 2020 county population-weighted centroids (lat/lon).
  2. USGS "Estimated Use of Water in the United States, County-Level Data
     for 2015" -- real county irrigation withdrawal data.
  3. USDA NASS 2022 Census of Agriculture bulk export, filtered down to
     just HAY / SOD / GRASSES & LEGUMES TOTALS at county level (the full
     bulk file is ~2.3 GB uncompressed; only the ~1 MB filtered extract is
     kept).
  4. Elevation per county centroid, via the open-elevation.com bulk API
     (no key, batched requests).
"""
import csv
import io
import json
import os
import subprocess
import sys
import time

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
os.makedirs(RAW_DIR, exist_ok=True)


def fetch(url, timeout=30):
    """Shell out to curl rather than urllib: this machine's python.org build
    has no linked CA bundle (a known python.org-installer gap), while curl
    already uses the system trust store correctly."""
    print(f"  GET {url}")
    return subprocess.run(
        ["curl", "-sS", "--max-time", str(timeout), url], check=True, capture_output=True
    ).stdout


def fetch_post_json(url, payload, timeout=60):
    return subprocess.run(
        [
            "curl", "-sS", "--max-time", str(timeout), "-X", "POST", url,
            "-H", "Content-Type: application/json", "-d", json.dumps(payload),
        ],
        check=True,
        capture_output=True,
    ).stdout


def fetch_census_centroids():
    """US Census Bureau 2020 county population-weighted centroids -- real
    lat/lon + population for all ~3,221 counties/county-equivalents."""
    out_path = os.path.join(RAW_DIR, "census_county_centroids_2020.csv")
    url = "https://www2.census.gov/geo/docs/reference/cenpop2020/county/CenPop2020_Mean_CO.txt"
    data = fetch(url)
    with open(out_path, "wb") as f:
        f.write(data)
    rows = data.decode("utf-8-sig").count("\n")
    print(f"  -> {out_path} ({rows} lines)")


def fetch_usgs_irrigation():
    """USGS 2015 county-level water use compilation -- real per-county
    irrigation withdrawal data (Dieter et al. 2018, Circular 1441)."""
    out_path = os.path.join(RAW_DIR, "usgs_water_use_2015_county.csv")
    # Resolve the current download URL via the ScienceBase catalog API
    # (the item ID is stable; the file's disk path can change on re-upload).
    item_id = "5af3311be4b0da30c1b245d8"
    meta = json.loads(fetch(f"https://www.sciencebase.gov/catalog/item/{item_id}?format=json&fields=files"))
    csv_file = next(f for f in meta["files"] if f["name"].endswith(".csv"))
    data = fetch(csv_file["downloadUri"])
    with open(out_path, "wb") as f:
        f.write(data)
    print(f"  -> {out_path} ({len(data)} bytes)")


def fetch_nass_turf_acreage():
    """USDA NASS 2022 Census of Agriculture -- county-level HAY, SOD, and
    GRASSES & LEGUMES TOTALS (grass-seed proxy) harvested acreage, per
    docs/TURF-DATA-SOURCES.md sections 2 and 4. The full bulk export is
    ~2.3 GB; this filters to ~15k relevant rows (~1 MB) and discards the rest.
    """
    out_path = os.path.join(RAW_DIR, "nass_turf_county_2022.tsv")
    targets = {
        ("HAY", "AREA HARVESTED"),
        ("SOD", "AREA IN PRODUCTION"),
        ("GRASSES & LEGUMES TOTALS", "AREA HARVESTED"),
    }
    url = "https://www.nass.usda.gov/datasets/qs.census2022.txt.gz"
    print(f"  GET {url} (large download, streaming filter via curl | gunzip)")
    import gzip

    written = 0
    curl = subprocess.Popen(["curl", "-sS", "--max-time", "300", url], stdout=subprocess.PIPE)
    with gzip.GzipFile(fileobj=curl.stdout) as gz:
        text_stream = io.TextIOWrapper(gz, encoding="latin-1", newline="")
        header = next(text_stream).rstrip("\n").split("\t")
        idx = {name: i for i, name in enumerate(header)}
        with open(out_path, "w") as out:
            out.write("state_ansi\tcounty_ansi\tstate_alpha\tcounty_name\tcommodity\tvalue\n")
            for line in text_stream:
                parts = line.rstrip("\n").split("\t")
                if len(parts) <= max(idx.values()):
                    continue
                if parts[idx["AGG_LEVEL_DESC"]] != "COUNTY":
                    continue
                if parts[idx["DOMAIN_DESC"]] != "TOTAL":
                    continue
                if parts[idx["UNIT_DESC"]] != "ACRES":
                    continue
                key = (parts[idx["COMMODITY_DESC"]], parts[idx["STATISTICCAT_DESC"]])
                if key not in targets:
                    continue
                out.write(
                    "\t".join(
                        [
                            parts[idx["STATE_ANSI"]],
                            parts[idx["COUNTY_ANSI"]],
                            parts[idx["STATE_ALPHA"]],
                            parts[idx["COUNTY_NAME"]],
                            parts[idx["COMMODITY_DESC"]],
                            parts[idx["VALUE"]],
                        ]
                    )
                    + "\n"
                )
                written += 1
    curl.wait()
    print(f"  -> {out_path} ({written} rows)")


def fetch_elevations():
    """Elevation (meters) for every county centroid, via open-elevation.com's
    keyless bulk lookup API. Cached so re-running this script doesn't
    re-fetch elevations for counties it already has."""
    centroids_path = os.path.join(RAW_DIR, "census_county_centroids_2020.csv")
    out_path = os.path.join(RAW_DIR, "county_elevations_m.json")

    with open(centroids_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        points = [
            {"fips": row["STATEFP"] + row["COUNTYFP"], "lat": float(row["LATITUDE"]), "lon": float(row["LONGITUDE"])}
            for row in reader
        ]

    cache = {}
    if os.path.exists(out_path):
        with open(out_path) as f:
            cache = json.load(f)

    missing = [p for p in points if p["fips"] not in cache]
    print(f"  {len(points)} counties, {len(missing)} missing elevation (cache hit for the rest)")

    batch_size = 200
    for i in range(0, len(missing), batch_size):
        batch = missing[i : i + batch_size]
        payload = {"locations": [{"latitude": p["lat"], "longitude": p["lon"]} for p in batch]}
        for attempt in range(3):
            try:
                result = json.loads(fetch_post_json("https://api.open-elevation.com/api/v1/lookup", payload))
                break
            except Exception as e:  # noqa: BLE001 -- retry any transient network error
                print(f"    batch {i // batch_size} attempt {attempt + 1} failed: {e}")
                time.sleep(2)
        else:
            print(f"    batch {i // batch_size} failed after retries, skipping")
            continue
        for p, r in zip(batch, result["results"]):
            cache[p["fips"]] = r["elevation"]
        print(f"    batch {i // batch_size + 1}/{(len(missing) + batch_size - 1) // batch_size} done")

    with open(out_path, "w") as f:
        json.dump(cache, f)
    print(f"  -> {out_path} ({len(cache)} counties)")


STEPS = {
    "centroids": fetch_census_centroids,
    "irrigation": fetch_usgs_irrigation,
    "turf": fetch_nass_turf_acreage,
    "elevation": fetch_elevations,
}

if __name__ == "__main__":
    requested = sys.argv[1:] or list(STEPS.keys())
    for name in requested:
        print(f"[{name}]")
        STEPS[name]()
