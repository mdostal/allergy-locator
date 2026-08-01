#!/usr/bin/env python3
"""Fetch real NOAA daily climate normals (1991-2020) for each of the 168
cities' nearest weather station, to drive a genuine day-by-day phenology
model (story: daily-resolution season curves, replacing the coarse 4-zone-
group monthly model in lib/severity/season.ts).

Source: NOAA NCEI U.S. Daily Climate Normals (1991-2020) -- public domain,
keyless, station-level CSVs at
https://www.ncei.noaa.gov/data/normals-daily/1991-2020/access/{station}.csv

Each station file already includes NOAA's own computed daily normal mean
temperature (DLY-TAVG-NORMAL) and 50th-percentile precipitation
(DLY-PRCP-50PCTL) for every day of the year -- real 30-year climate normals,
not a modeled curve.

Re-run this periodically (it's a static pull, not a live feed) to refresh
against newer NOAA normals releases.
"""
import csv
import io
import json
import os
import subprocess

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
STATIONS_PATH = os.path.join(RAW_DIR, "ghcnd-stations.txt")
NORMALS_INDEX_URL = "https://www.ncei.noaa.gov/data/normals-daily/1991-2020/access/"
NORMALS_STATION_URL = "https://www.ncei.noaa.gov/data/normals-daily/1991-2020/access/{}.csv"


def fetch(url, timeout=30):
    return subprocess.run(
        ["curl", "-sS", "--max-time", str(timeout), url], check=True, capture_output=True
    ).stdout


def fetch_station_list():
    """GHCN station list: every station's id/lat/lon, real public data."""
    out_path = STATIONS_PATH
    if not os.path.exists(out_path):
        data = fetch("https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt", timeout=60)
        with open(out_path, "wb") as f:
            f.write(data)
    stations = []
    with open(out_path) as f:
        for line in f:
            stations.append(
                {"id": line[0:11].strip(), "lat": float(line[12:20]), "lon": float(line[21:30])}
            )
    return stations


def fetch_normals_station_ids():
    """Which stations actually have a 1991-2020 daily-normals file -- a
    subset of all GHCN stations."""
    cache_path = os.path.join(RAW_DIR, "normals_station_ids.txt")
    if not os.path.exists(cache_path):
        html = fetch(NORMALS_INDEX_URL, timeout=60).decode("utf-8", errors="ignore")
        ids = sorted(set(part.split('"')[0] for part in html.split('href="')[1:] if part.split('"')[0].endswith(".csv")))
        ids = [i[:-4] for i in ids]
        with open(cache_path, "w") as f:
            f.write("\n".join(ids))
    with open(cache_path) as f:
        return set(line.strip() for line in f if line.strip())


def nearest_stations(lat, lon, candidates, n=8):
    return sorted(candidates, key=lambda s: (s["lat"] - lat) ** 2 + (s["lon"] - lon) ** 2)[:n]


def has_real_temperature_data(days):
    return sum(1 for d in days if d and d.get("tavg_f") is not None) >= 300


def parse_normals_csv(raw_bytes):
    """Returns a 366-entry list (day-of-year index 0 = Jan 1) of
    {tavg_f, prcp_in} from a station's daily-normals CSV."""
    text = raw_bytes.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    days = [None] * 366
    for i, row in enumerate(reader):
        if i >= 366:
            break
        try:
            tavg = float(row["DLY-TAVG-NORMAL"])
        except (ValueError, KeyError):
            tavg = None
        try:
            prcp = float(row["DLY-PRCP-50PCTL"])
        except (ValueError, KeyError):
            prcp = None
        days[i] = {"tavg_f": tavg, "prcp_in": prcp}
    return days


def build():
    with open(os.path.join(DATA_DIR, "cities.json")) as f:
        cities = json.load(f)

    print("Loading GHCN station list...")
    all_stations = fetch_station_list()
    print(f"  {len(all_stations)} total stations")

    print("Loading list of stations with 1991-2020 daily normals...")
    normals_ids = fetch_normals_station_ids()
    print(f"  {len(normals_ids)} stations have normals files")

    # US1 (CoCoRaHS volunteer rain-gauge network) and USS (snow network)
    # stations have normals files but are precipitation/snow-only -- no
    # temperature data. Real-world finding, not an assumption: the first
    # matching pass put 78/168 cities on a station with zero valid
    # DLY-TAVG-NORMAL values. USC (NWS Cooperative) and USW (WBAN, official
    # first-order weather stations) are full climate stations.
    normals_stations = [
        s for s in all_stations if s["id"] in normals_ids and not s["id"].startswith(("US1", "USS"))
    ]
    print(f"  matching against {len(normals_stations)} candidate full-climate stations")

    out_path = os.path.join(RAW_DIR, "city_daily_normals.json")
    cache = {}
    if os.path.exists(out_path):
        with open(out_path) as f:
            cache = json.load(f)

    for i, city in enumerate(cities):
        existing = cache.get(city["id"])
        if existing and has_real_temperature_data(existing["days"]):
            continue

        candidates = nearest_stations(city["lat"], city["lon"], normals_stations, n=8)
        found = False
        for station in candidates:
            try:
                raw = fetch(NORMALS_STATION_URL.format(station["id"]))
                days = parse_normals_csv(raw)
            except Exception:  # noqa: BLE001
                continue
            if has_real_temperature_data(days):
                cache[city["id"]] = {"station_id": station["id"], "days": days}
                print(f"  [{i + 1}/{len(cities)}] {city['city']}, {city['state']} -> {station['id']}")
                found = True
                break
        if not found:
            print(f"  [{i + 1}/{len(cities)}] {city['city']}, {city['state']}: NO station with temp data in nearest 8")

    with open(out_path, "w") as f:
        json.dump(cache, f)
    print(f"Wrote {len(cache)} cities' daily normals -> {out_path}")


if __name__ == "__main__":
    build()
