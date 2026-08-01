# Raw source data (county-level gradient expansion)

Fetched by `scripts/fetch_county_data.py` -- real, public, keyless government
data. Static snapshots, not a live feed: re-run the script periodically to
refresh (see the script's own docstring). Last fetched: 2026-07-31.

| File | Source | What it is |
|---|---|---|
| `census_county_centroids_2020.csv` | [US Census Bureau, 2020 population-weighted county centroids](https://www2.census.gov/geo/docs/reference/cenpop2020/county/CenPop2020_Mean_CO.txt) | Real lat/lon + population for all ~3,221 US counties/county-equivalents. |
| `usgs_water_use_2015_county.csv` | [USGS, "Estimated Use of Water in the United States, County-Level Data for 2015"](https://www.sciencebase.gov/catalog/item/5af3311be4b0da30c1b245d8) (Dieter et al. 2018, Circular 1441) | Real county-level irrigation withdrawal data -- the `IC-IrTot`/`IC-WFrTo` columns (crop irrigation, separate from golf) feed the turf/irrigation model. |
| `nass_turf_county_2022.tsv` | [USDA NASS, 2022 Census of Agriculture bulk export](https://www.nass.usda.gov/datasets/qs.census2022.txt.gz), filtered | County-level HAY, SOD, and GRASSES & LEGUMES TOTALS (grass-seed proxy) harvested acreage -- filtered down from the ~2.3 GB full bulk file to ~15.8k relevant rows. Some small-operation counties are suppressed ("(D)") per NASS disclosure rules -- expected, documented in `docs/TURF-DATA-SOURCES.md` section 2. |
| `county_elevations_m.json` | [open-elevation.com](https://www.open-elevation.com/) bulk lookup API, keyed by 5-digit county FIPS | Elevation (meters) at each county's population centroid. Not a government source, but a keyless, no-signup public API; validated against Denver's known ~1609m/5280ft elevation during sourcing. |

All public-domain (Census, USGS) or open-with-attribution (NASS terms) --
MIT-compatible, per the license audit already done in `docs/TURF-DATA-SOURCES.md`.

**Not fetched (documented limitation):** NLCD 30m land-cover raster (the
"landTurf" component in `docs/TURF-DATA-SOURCES.md` section 6.1) -- national
raster processing requires GIS tooling and multi-GB downloads impractical for
a periodic static refresh. `scripts/gen_county_grid.py`'s turf model runs on
the NASS + USGS components only (`agTurf`, `grassSeedFlag`, `irrigBoost`); see
that script's own docstring for how this changes the formula.
