# Turf Data Sources — the "planted / irrigated / managed grass" exposure layer

**Purpose.** The map currently colors by grass-pollen *severity* (season length × intensity × climate)
plus the arid-Southwest weed/dust layer (see `MODEL-NOTES.md`). Both are driven by *native / climatic*
grass. The missing driver — repeatedly confirmed by road-trip reactions and the AAFA city rankings
(Boise #1, Provo #4, Ogden #8, Spokane #9, SLC #13) — is **cultivated, irrigated, maintained turf**:
lawns, parks, golf, overseeded desert suburbs, hay/pasture, and grass-*seed* farming. This doc specs the
open datasets for that human layer and the build-time pipeline to turn them into a per-state (county
optional) `turfScore ∈ [0,1]` that multiplies the existing severity term.

**Hard constraint:** everything must be genuinely OPEN (public-domain or a permissive/attribution
license compatible with MIT redistribution) and bake to **static JSON at build time** — ZERO API keys at
runtime. A free NASS key used only during the build is fine; it is never shipped.

---

## 1. NLCD — National Land Cover Database  ⭐ PRIMARY LAYER  ✅ VERIFIED

- **Source:** MRLC (Multi-Resolution Land Characteristics consortium, USGS/EROS). https://www.mrlc.gov/data
- **Product / year:** *Annual NLCD Collection 1.2* — land cover for **1985–2025**, latest CONUS land-cover
  year **2025** (confirmed live on the MRLC data page). Older discrete-year releases (2021, 2019, 2016…)
  also available if you want a stable, widely-cited vintage.
- **Resolution:** **30 m** raster (GeoTIFF).
- **Access / download (all keyless):**
  - MRLC NLCD viewer + bulk GeoTIFF downloads: https://www.mrlc.gov/data
  - Full archive on USGS ScienceBase / USGS Science Data Catalog
    (e.g. NLCD 2021: https://data.usgs.gov/datacatalog/data/USGS:649595d8d34ef77fcb01dca1)
  - Mirrored in Google Earth Engine (`USGS/NLCD_RELEASES/...`) — handy for build-time zonal stats without
    downloading nation-scale rasters.
- **Cadence:** historically ~2–3 yr discrete releases; Collection 1.2 now delivers **annual** layers.
- **License:** **U.S. public domain** (USGS product; "nationally complete … public domain information").
  MIT-compatible, attribution appreciated not required. ✅
- **Classes to use as managed-turf proxies (legend verified verbatim from MRLC):**
  - **21 — Developed, Open Space:** "mostly vegetation in the form of **lawn grasses**. Impervious
    surfaces < 20%." → **lawns, parks, golf courses, cemeteries, road verges.** This is the single best
    turf proxy in the dataset. **Core term.**
  - **81 — Pasture/Hay:** "grasses, legumes, or grass-legume mixtures **planted** for livestock grazing or
    the **production of seed or hay crops**, typically perennial." → **planted grass agriculture.**
    **Core term.**
  - **82 — Cultivated Crops:** annual crops (corn, soy, cotton…) + perennial orchards/vineyards. Mostly
    **not** grass allergen → **exclude by default** (optional tiny weight only where you know it's grass
    hay; NASS handles hay better, see §2).
  - **Do NOT use 71 (Grassland/Herbaceous):** that is *native, unmanaged* range — "not subject to
    intensive management" — exactly the presence-not-severity signal `MODEL-NOTES.md` warns against.
  - 22/23/24 (developed low/med/high intensity) are mostly impervious; ignore for turf.
- **Fields to pull:** per-state (and per-county) **fraction of land area in class 21** and **fraction in
  class 81**, computed as a zonal histogram of the 30 m raster over Census state/county polygons.

## 2. USDA Census of Agriculture — NASS QuickStats  ✅ VERIFIED

- **Source:** https://quickstats.nass.usda.gov/ · API: https://quickstats.nass.usda.gov/api
- **API key:** **free**, one email signup. Used **at build time only**; never shipped. (Terms require the
  notice: "This product uses the NASS API but is not endorsed or certified by NASS.")
- **Query model:** REST `GET /api/api_GET/?key=…&commodity_desc=…&state_alpha=…&year=…&format=CSV`.
  Supports `agg_level_desc = STATE` or `COUNTY`; operators `__GE/__LE/__LIKE` etc.; 50k-row cap per call.
  `get_param_values` enumerates valid commodity/statistic values; `get_counts` sizes a query first.
- **License / terms:** NASS Terms of Service — official published aggregate estimates, freely
  redistributable with the attribution notice above. Census aggregates are U.S. public data.
  MIT-compatible with attribution. ✅
- **Fields to pull (state, county where non-disclosure allows):**
  - **SOD / turf farms:** `commodity_desc=SOD`, `statisticcat_desc=AREA HARVESTED` → acres. (2022 Census
    table "Nursery, Floriculture, … **Sod** …" confirmed to carry sod harvested acres at county level.)
  - **HAY:** `commodity_desc=HAY`, `AREA HARVESTED` → acres. Prefer NASS over NLCD-82 for hay because NASS
    separates hay from row crops.
  - **GRASS SEED:** grass-seed crops live under `group_desc=FIELD CROPS` / `commodity_desc` values such as
    `GRASSES & LEGUMES TOTALS` and specific `… SEED` items (ryegrass, fescue, bluegrass, bentgrass,
    orchardgrass). Pull `AREA HARVESTED` / `PRODUCTION` by state → drives the **grass-seed-ag flag** (§6).
- **Note:** county cells are suppressed (D) where a county has <3 operations — expect gaps; fall back to
  state value for those counties.

## 3. Irrigation — USGS Water Use + USDA IWMS  ✅ VERIFIED

- **Primary source:** USGS National Water Use compilation, most recent **2015** (Dieter et al. 2018,
  *Circular 1441*). "Estimated Use of Water in the United States County-Level Data for 2015" is a
  downloadable **state- and county-level dataset** (Excel/CSV via ScienceBase).
  https://www.usgs.gov/mission-areas/water-resources/science/water-use-united-states
- **Fields to pull:** `Irrigation, total self-supplied withdrawals` (Mgal/d) and **`Irrigation … acres`
  (thousand acres irrigated)** per state/county; every state reports irrigated acres by system type.
- **Cadence:** 5-yr compilations since 1950 (2015 is newest full release; monthly 2000–2020 model exists).
- **License:** **U.S. public domain** (USGS), credit-USGS requested. MIT-compatible. ✅
- **Secondary / cross-check:** USDA NASS **Irrigation & Water Management Survey (IWMS)** — also in
  QuickStats (`IRRIGATION` commodity / `AREA` acres) at the state level; same open NASS terms.
- **Role in model:** the **aridity boost** (§6). In Phoenix/Mesa and Intermountain valleys the NLCD
  open-space *fraction* is small (desert dominates the polygon) but the turf that exists is 100% irrigated
  Bermuda/rye and pollinates hard — irrigation intensity re-weights those states up.

## 4. Grass-seed production — Willamette Valley  ✅ VERIFIED

- **Citable sources (OSU Extension, open):**
  - https://valleyfieldcrops.oregonstate.edu/willamette-valley-grass-seed-production
  - https://extension.oregonstate.edu/impact/oregon-grass-seed-growers-gain-osu-research-extension
- **Verified facts:** the Willamette Valley is the **"grass seed capital of the world"**; Oregon produces
  **>90% of U.S. cool-season grass seed** and ~⅔ of national cool-season grass production (600M+ lb/yr,
  2017). This is a textbook targeted high-severity overlay and directly explains the AAFA Pacific-NW /
  Intermountain grass-city cluster.
- **License:** OSU Extension public educational content; the underlying *acreage numbers* come from NASS
  (§2, open). Cite OSU for the "capital" claim; drive the flag off NASS grass-seed acreage. ✅
- **Role:** seeds the **grass-seed-ag flag** (§6) — OR (Willamette), plus ID (Magic Valley/Boise),
  WA (Spokane/Columbia Basin), MN (Roseau) surface from NASS grass-seed acreage.

## 5. Golf-course density — OpenStreetMap  ⚠ OPEN-BUT-COPYLEFT (optional overlay)

- **Source:** OSM `leisure=golf_course`, pulled via **Overpass API** at build time
  (`area["ISO3166-2"="US-XX"]; nwr["leisure"="golf_course"](area); out count;`). Tag confirmed "de facto"
  and in active use. GNIS/USGS is a weaker alternative (points, not polygons, spotty for golf).
- **License:** OSM **data = ODbL** (Open Database License) — confirmed on
  https://www.openstreetmap.org/copyright. **Attribution *and* share-alike:** "if you alter or build upon
  our data, you may distribute the result only under the same license."
- **⚠ MIT caveat — read before using:** ODbL's copyleft can attach to a *derived database*. For an MIT
  repo, the safe pattern is: (a) use OSM **only at build time**, (b) reduce to a **non-substantial
  derived statistic** (one integer/float per state = golf-course *count/density*, not the geometry),
  (c) ship only that aggregate JSON, and (d) add an OSM/ODbL attribution line in the repo + map credits.
  Aggregated per-state counts are widely treated as a "produced work," not a redistribution of the OSM
  database. **If you want zero license ambiguity, drop golf entirely** — class 21 already captures golf
  turf as land cover, so golf is a *nice-to-have refinement, not a required input.* Flag this explicitly
  in the build config so the MIT-purity decision is a conscious toggle. ⚠
- **Role:** optional minor additive nudge (§6, `golfDensity`), off by default.

---

## 6. Integration spec — building `turfScore ∈ [0,1]`

All computed **at build time**, output to a static `data/turf-exposure.json` keyed by state FIPS (county
FIPS optional, same shape). No runtime keys, no runtime fetches.

### 6.1 Raw per-state inputs
| symbol | source | raw field | units |
|---|---|---|---|
| `openSpaceFrac` | NLCD (§1) | area in class **21** ÷ state land area | fraction 0–1 |
| `pastureHayFrac` | NLCD (§1) | area in class **81** ÷ state land area | fraction 0–1 |
| `sodAcres` | NASS SOD (§2) | AREA HARVESTED | acres |
| `hayAcres` | NASS HAY (§2) | AREA HARVESTED | acres |
| `grassSeedAcres` | NASS grass seed (§2/§4) | AREA HARVESTED (sum of grass-seed items) | acres |
| `irrigAcres` | USGS 2015 (§3) | irrigation, acres irrigated | thousand acres |
| `aridity` | derived | 1 − (state mean annual precip ÷ 40 in), clamped 0–1 | index 0–1 |
| `golfDensity` | OSM (§5, optional) | golf courses per 1000 km² | count/area |

### 6.2 Normalize each to 0–1 (min–max across the 50 states + DC, then cap at the 95th pctile to stop
one outlier flattening everyone):

```
norm(x)      = clamp( (x − p05) / (p95 − p05), 0, 1 )          # robust min–max
landTurf     = clamp( openSpaceFrac + 0.7 * pastureHayFrac, land-normalized )   # NLCD core
agTurf       = norm( sodAcres + hayAcres )                     # planted grass agriculture
grassSeedFlag= norm( grassSeedAcres )                          # 0..1, ~1 for OR/ID/WA/MN
irrigBoost   = norm( irrigAcres )                              # 0..1, high in AZ/CA/ID/NV valleys
golfNudge    = norm( golfDensity )   # optional, default 0
```

### 6.3 Combine into `turfScore` (weights sum to 1 on the core; boost is multiplicative *inside* turf):

```
core       = 0.55*landTurf + 0.30*agTurf + 0.15*grassSeedFlag        # base managed-turf presence
aridWeight = 1 + 0.6 * (aridity * irrigBoost)                         # 1.0 … ~1.6 for irrigated desert
turfScore  = clamp( core * aridWeight + 0.05*golfNudge, 0, 1 )
```

- **Why `aridity * irrigBoost` (product):** it fires ONLY where the land is dry *and* heavily irrigated —
  Phoenix/Mesa, Boise, SLC, Reno — the exact places small NLCD open-space fractions under-count real
  exposure. It does nothing in the humid East (already high `landTurf`) or the dry-but-unirrigated
  high desert (correctly stays green).
- `grassSeedFlag` is folded into `core` **and** left available as a standalone `>0.6` boolean the UI can
  surface ("grass-seed farming region") — this is what pushes Willamette/Boise into the red band even
  though their base grass-*season* term is modest.

### 6.4 How it plugs into the existing severity model — **use a bounded MULTIPLIER (recommended,
decisively), with a small grass-seed additive floor.**

Current model (per `MODEL-NOTES.md`):
```
baseSeverity = seasonLength × intensity × climate      (+ arid weed/dust layer, separate)
```
Add the turf layer as:
```
finalSeverity = baseSeverity × (1 + α * turfScore)  +  β * grassSeedFlag
                 with α = 0.8 ,  β = 0.12  (on a 0–1 severity scale)
```

- **Multiplier, not additive, for the main term.** Additive would light up empty low-base states just for
  having some lawns, re-creating the "red rectangle" failure. A multiplier **keeps green states green**
  (low base × anything ≈ low) while amplifying places that are *both* pollen-capable *and* turf-heavy —
  the warm-humid South and the irrigated valleys. `α=0.8` gives up to ~1.8× headroom, enough to move
  Mesa and the Southern turf belt up without saturating.
- **The one exception — a small additive `β*grassSeedFlag` floor.** Grass-seed valleys (Boise, Willamette)
  can have a *modest* climatic base (short dry season) yet be genuinely miserable because the *air is full
  of cultivated seed-grass pollen*. A pure multiplier on a small base under-ranks them vs. the AAFA truth.
  A tiny additive floor (β≈0.12) guarantees a documented grass-seed-farming state can't be colored "fine."
  Keep β small so it never dominates a truly high-base state.

### 6.5 Output shape
```jsonc
// data/turf-exposure.json  (baked at build; committed static; no runtime deps)
{
  "AZ": { "turfScore": 0.71, "openSpaceFrac": 0.03, "irrigBoost": 0.88,
          "grassSeedFlag": 0.0, "notes": "irrigated desert turf (Bermuda/rye)" },
  "OR": { "turfScore": 0.83, "grassSeedFlag": 0.97, "notes": "Willamette grass-seed capital" },
  "ID": { "turfScore": 0.79, "grassSeedFlag": 0.71, "irrigBoost": 0.74 }
  // …51 rows; add a parallel county block keyed by 5-digit FIPS if desired
}
```

---

## 7. Honest limits & caveats
- **30 m NLCD aggregation:** class 21 lumps lawns + parks + golf + wide road verges; it cannot isolate
  *turfgrass species* or irrigation status — that's exactly why §3 irrigation and §2 NASS are layered on.
  A 30 m pixel also under-resolves narrow suburban lawns, slightly undercounting dense-city turf.
- **State vs county:** state is fully buildable from all sources today. County is available for NLCD
  (zonal) and USGS irrigation, but **NASS county cells are suppressed** for low-operation counties (sod,
  grass seed especially) — expect holes; fall back to the state value.
- **Vintage mismatch:** NLCD 2025 vs NASS 2022 Census vs USGS 2015 water use. Acceptable — these are
  slow-moving structural layers (a grass-seed valley or a golf-dense metro doesn't move in a decade).
  Document the vintage per field; don't imply they're the same year.
- **Irrigation year:** USGS 2015 is the newest *full* compilation; fine as a structural weight, but note
  it predates recent Sun-Belt suburban growth (likely *undercounts* AZ/TX/NV turf — conservative bias).
- **OSM/ODbL (golf):** the only non-permissive input. Copyleft/share-alike risk for an MIT repo — mitigate
  by shipping only aggregated per-state counts + attribution, or **omit golf entirely** (class 21 already
  covers golf turf). Make it an explicit build toggle; default OFF for license cleanliness.
- **Everything else (NLCD, NASS, USGS) is U.S. public domain / open with attribution → MIT-clean.**
