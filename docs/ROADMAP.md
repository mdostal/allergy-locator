# Livability Atlas — series & tool roadmap

*The through-line: a content series where every episode ships a **real, reusable tool** for
others — not a one-off graphic. One focused scoring tool per livability dimension, then
composites that overlay them so anyone can decide where to live. Open source, US-focused.*

## Principles
- **Focused singles → composites.** Each dimension is ONE tight, single-purpose artifact + tool
  overlay (an episode). Then overlay tools that combine them to judge and decide.
- **Shared spine.** One canonical US city list (`data/cities.json`); *every* dimension scores the
  same cities, so overlays line up.
- **Decision sequence:** score the quality dimensions → **overlay COST late** (it reshuffles the
  board and surfaces cheap sleepers) → **apply the "nails in the coffin" disqualifiers LAST** (the
  on-camera reveal; for the private decision they can be applied early to save effort).
- **US is the product.** International gets rough climate-logic + commentary only — not a core
  scored tool.
- **Tools for others, consistently.** New overlays can be spun from the allergy tool's engine.
- **Transparent scoring.** No black boxes. Every score decomposes into its components (show the
  math) with a plain-language methodology doc per dimension. It won't be perfect — so show the work
  and let people audit and adjust the weights.
- **A/B against ground truth.** Calibrate weightings by how well they reproduce known, lived data
  points (e.g. real validated reactions); ship the variant that best fits reality.
- **User-adjustable & community-tweakable.** Weights are exposed as sliders users tune to their own
  body, and the open-source model invites others to submit their own ground-truth data points and
  propose weight changes. It's guesswork *made improvable* — transparent, forkable, crowd-correctable.
  No score is claimed as truth; it's a starting point everyone can bend toward their reality.
- **Keep it honest with current comps.** Score off LIVE data, never memory or nostalgia — prices move
  (Austin's rents fell since it was framed). Always include the **"stay put" option** as a real comp
  so *leaving* has to earn it, rather than being assumed.
- **Gradients, not buckets.** Every overlay is a continuous **heatmap** on granular (county/raster)
  data with visible confidence — never state fills or lone city dots. Intra-state spread is the whole
  problem (NYC $5k/mo ≠ Rochester $2k/mo). Interpolate where data is sparse, but *show* it's a guess.
- **FEEL → REAL → false.** Every piece cross-checks the lived **FEEL** (what it was actually like)
  against the **REAL** (verified, sourced data), and names the **FALSE** in both directions — the
  averages that lie AND our own confident memories that don't survive a receipt. That honesty *is*
  the product.

## Data / store note
Qdrant here is **read-only** (`find` + `list_collections`, no store tool) — I can't push to it from
my side. **This doc + the `data/*.json` datasets are the store** until a qdrant write path is wired
up; then the roadmap + datasets get ingested.

---

## Dimensions (build order)

### 1. Allergy — 🟢 flagship live, expanding
Scores a place against *your* panel: grass-season length × climate + planted/irrigated-turf +
arid-Southwest weed/dust. Not native presence, never the generic index.
- **Data:** USDA PLANTS, NLCD, USDA Ag Census, USGS irrigation, AAFA/NAB (ref).
- **Now:** personal life-atlas artifact live; **building the full US-city allergy dataset** (this
  step) to power the tool + a comprehensive ranking.
- **Tool:** pick-your-panel → US map colored for you → click a place.
- **Known soft spots (tweakable):** elevation probably helps on its own (thinner air, less grass) but
  it's entangled with turf/season — kept as a transparent, adjustable component, not a proven isolate.
  And city-level scores miss *intra-city terrain* (the SLC valley reacts; the mountains above it
  don't) — a future sub-city/terrain refinement. Boise rougher than the N. Idaho lakes confirms both.

### 2. Care access — 3 layers (pediatric cardiac · pediatric specialty · general) — next
Map ALL US cardiac + children's hospitals, plot every spine city, show drive time to/from each.
**Built general-use** — anyone can use it, not a one-family tool.
- **Layer A — Pediatric cardiac / congenital-heart-surgery programs** (the specialized one).
- **Layer B — Pediatric specialty** (children's hospitals: peds cardiology, NICU/infant, neuro,
  ENT, etc.).
- **Layer C — General hospital access** (nearest adequate acute-care / major medical center — for
  everyone).
- **Data:** children's-hospital + congenital-heart-surgery program directories, US News peds
  rankings, hospital geolocation → nearest-facility + estimated drive time per city.
  Tiers: ≤30 / ≤60 / ≤120 / 120+ min.
- **Note:** for planned surgery, an established team often stays the anchor even after a move
  (follow-ups/reports done locally, surgery with the same folks) — so "nearest" isn't the only lens;
  "reachable for planned surgery" matters too. And as a family's specialty needs narrow over time,
  this constraint *loosens* — worth modeling as adjustable.

### 3. Cost / housing / local cost — overlaid LATE
Median home + rent + property tax + cost-of-living — **plus the single-parent reality**, on CURRENT comps.
- **Housing:** current rent + home comps (LIVE — Austin rents dropped; a 3BR may be ~$1,800 on a 14-mo
  lease now, verify). Include a **"stay put" comp** (Austin / **Mueller**) so leaving is a real decision.
- **Childcare:** toddler daycare / Montessori pricing AND availability (Austin ran ~$2k/mo at Bright
  Horizons + the Montessori — verify others + the waitlist problem). Often the single biggest line.
- **⭐ Single-parent-with-childcare model:** one income, full childcare, **no meaningful tax breaks** —
  the true monthly nut differs wildly from generic COL. Build a single-parent-adjusted cost index.
- **Data:** Census ACS, Zillow ZHVI/ZORI (current), C2ER/BestPlaces COL, county property tax, Child
  Care Aware, EITC/CDCTC reality.
- **Role:** the reshuffler — layered near the end of the decision funnel. Keep it honest.

### 4. Water & earthwork rights
Rainwater-harvesting legality + the earthwork/grading permit threshold (how much cut/fill dirt you
can move before a permit — the ">50 lbs / whatever the minimum" question), well/septic freedom.
- **Data:** state rainwater-harvesting statutes, county grading ordinances, well/septic rules.

### 5. Smells & beauty
Scent + landscape: ponderosa (vanilla bark), juniper, sage, **desert tea (Mormon tea / Ephedra)**,
piñon. *Nice irony: the dry-West signature scents are all his NON-allergens.*
- **Data:** dominant flora + subjective landscape/aesthetic. The "does it smell and look like home" score.

### 6. Growing / greenhouse capability
Can you grow / run a greenhouse: hardiness, season length, water, sun.
- **Data:** USDA hardiness zones, frost-free days, precip/water availability, NREL sun.

### 7. Seasons & their lengths
Köppen climate, frost-free days, seasonal distribution (real 4 seasons? how long is winter?).
- **Data:** NOAA climate normals, Köppen zones.

### 8. Sun & solar (with UV overlay)
Sunny days/year + solar irradiance → expected rooftop solar production (kWh per kW installed), plus
a UV-index overlay.
- **Data:** NREL NSRDB / PVWatts, NOAA sunshine, EPA UV index.

### 9. Schooling — credits, homeschool, hybrid
Homeschool legal burden, hybrid/umbrella/microschool availability, dual-credit / early-college.
- **Data:** HSLDA state-law tiers, state ed depts, co-op/hybrid directories.

### 10. Family & community life
The felt texture of a place **for a family, not a bachelor** — seasonal traditions + kid/family
culture, weighted OVER nightlife.
- **Scores:** real trick-or-treat Halloween (decorated houses, kids out) · fall fests / pumpkin
  patches / hayrides · caroling + holiday community · snow for snowmen / white winters · kid &
  family activities · family-accessible arts / music / comedy.
- **De-weighted (bachelor scene):** burlesque, late-night comedy, bars/clubs, kink-friendly,
  ren-fair — nice-to-have, not the driver.
- **Data:** community-events calendars, snowfall normals, walkable trick-or-treat signals,
  family-attraction density. Subjective + directional; sliders let scene-weighters flip it.
- **Why:** it's what a parent actually optimizes for — and most "best places" lists ignore it.

### 11. Context & wellbeing stats (pull-alongside)
Reference stats layered *alongside* the decision — not primary scorers, but revealing context chips.
- **Health & fitness** of the population (CDC PLACES / County Health Rankings, RWJF), **happiness /
  wellbeing** (Gallup-Sharecare, WalletHub), **family-environment** indices, **education** (ties to
  #9), and **housing-stock quirks** — e.g. **homes with stairs vs single-level** (accessibility /
  kid-safety / aging), home age, lot size.
- **Data:** CDC PLACES, County Health Rankings, Gallup-Sharecare Well-Being, Census ACS (housing
  characteristics), WalletHub / BestPlaces indices.
- **Role:** overlay/context chips on the composite — "here's what living here does to people" — not a
  veto. Grows as we find interesting stats.

### 12. Single-parent economics & the benefits cliff
Not a map overlay — a distinct honest analysis + chart. For a single parent with one toddler, plot
**NET disposable resources vs GROSS income**. Model the cliff: TWC childcare subsidy, SNAP,
Medicaid/CHIP, ACA subsidies, EITC/CTC — and where each phases out. Question: is there a **"sweet
spot"** where ~$60k + benefits nets more real disposable than ~$120k paying full childcare + full
insurance + higher tax? And are single parents penalized worse than two-parent households?
- **Data:** TWC/TX-HHS eligibility thresholds, SNAP/Medicaid limits, ACA subsidy tables, IRS
  EITC/CTC, verified childcare costs.
- **Framing:** illustrative/systemic content ("the system punishes the striving single parent"),
  NOT the user's personal path (he's high-income). Ties to the numbers-and-agendas thread.

### + International companion
Rough climate-logic + chat only (Mediterranean summers dry = low grass; olive/cypress = his
negatives; tropics = year-round). Broken out from the US tool; commentary, not a scored product.

### + Composite / overlay layer
Combine the singles with a weighting UI → personalized ranked shortlist. Runs the decision funnel
(quality → cost late → nails last).

---

## Corrections / field notes (feed the models)
- **Whitewright TX** (buddy's 5 acres, Grayson Co.) — broken out; rural N. TX, Bermuda + pasture/hay
  = high. Cheap land, unkind air.
- **Oahu HI** — "didn't seem that bad": **ocean breeze + surf seem to reset him; he only sneezed
  inland.** → coastal-moderation sub-factor worth modeling (beach good, interior worse).
- **Geraldine MT (family farm)** — his *first-ever* grass reaction, as a toddler who put it in his
  mouth (oral, not the air). Good air; the story, not a score change.

## Phased requirements (the build order for the engine)
The dimensions are the WHAT; these phases are the HOW. Each is a shippable step, and **every phase
must not box out the next.**
- **Phase 1 — Allergy tool (NOW, via `hive execute`).** Ship pick-your-panel → US map. **Hard v1
  requirement:** architect the map as a **heatmap/overlay-ready engine** (takes a value-surface + a
  confidence-surface per dimension), NOT hardcoded discrete dots — so Phases 2–4 slot in without a
  rewrite.
- **Phase 2 — True gradients + granularity.** Upgrade allergy from city dots to a continuous heatmap
  on **county/raster** data (NLCD turf raster + climate/season grids) with a **visible confidence
  layer** (measured vs interpolated). The 168 spine cities become labeled anchors on top.
- **Phase 3 — Dimension overlays.** Add each dimension (care, cost, water/earthwork, sun, seasons,
  growing, smells, schooling, wellbeing) as its own value+confidence surface on the shared engine,
  county/raster-granular, on the shared spine.
- **Phase 4 — Composite + controls.** Weighted **phase-blend** of overlays, user weight **sliders**,
  community ground-truth submission + weight proposals. The decision funnel (quality → cost late →
  nails last) runs here.

**Cross-cutting requirements (EVERY phase & dimension):** transparent decomposable scoring +
methodology doc · user-adjustable & community-tweakable weights · gradients-not-buckets (county/raster,
never state) · confidence shown · current comps + stay-put option · A/B vs ground truth · open-source,
tools-for-others.

## Data granularity & heatmap rendering (core architecture)
Every overlay renders as a **continuous heatmap/gradient**, not state fills or lone dots — intra-state
spread is huge (NYC ~$5k/mo vs Rochester ~$2k/mo). Two data postures per dimension:
- **Native-continuous (TRUE gradients):** allergy (NLCD 30m turf raster + climate/season grids),
  sun/solar (NREL irradiance raster), seasons/climate (PRISM/Köppen grids), care-access (drive-time
  isochrones from facility points = a real access surface). These render honest gradients from source.
- **Point/area → interpolated (BEST-GUESS gradients):** cost/housing (ZIP/county Zillow + Census —
  interpolate, never state-average), childcare (central-city-specific, county), wellbeing (county).
  Interpolate between points (IDW / kriging-style) and **render a confidence layer** — measured cells
  vs interpolated-guess cells must look different so no one mistakes a guess for data.
- **Granularity target:** **county-level (~3,143 counties) or raster — NOT state, NOT just the 168
  cities.** The 168-city spine stays as labeled reference dots + validation anchors *on top of* the
  surface, not as the surface itself.
- **Composite = phase-blend:** overlays combine as a weighted blend of normalized value-surfaces
  (allergy × care × cost …), carrying the same confidence transparency through.
- **Engine implication (tell the hive build):** build the map as a **raster/heatmap engine from the
  start** — it takes a value-surface + a confidence-surface per dimension. Retrofitting discrete
  dots → heatmap later is painful; bake it in now.

## Deployment (mdostal.com)
Tools live under **mdostal.com** (the allergy tool is building now via `hive execute`).
- **Recommended architecture: ONE map engine, toggleable overlays** — not N separate static pages.
  Build the allergy map's engine to accept dimension layers; each dimension (`/map/allergy`,
  `/map/healthcare`, `/map/cost`, …) is a *view/overlay* on the same engine. **This is what makes the
  composite vision possible** (allergy × care × cost, weighted) — separate pages can't stack.
- Per-dimension routes double as clean shareable/SEO pages per episode; the unified map is the
  power-user/composite view.
- Every dimension keeps its data as its own `data/*.json` on the shared city spine so overlays line up.

## Status board
| # | Dimension | Artifact | Tool overlay | Data | Status |
|---|-----------|----------|--------------|------|--------|
| 1 | Allergy | ✅ live | in build | gathering full-city | **active** |
| 2 | Cardiac care | — | — | — | queued (next) |
| 3 | Cost/housing | — | — | — | queued (overlay late) |
| 4 | Water/earthwork | — | — | — | queued |
| 5 | Smells/beauty | — | — | — | queued |
| 6 | Growing/greenhouse | — | — | — | queued |
| 7 | Seasons | — | — | — | queued |
| 8 | Sun/solar+UV | — | — | — | queued |
| 9 | Schooling | — | — | — | queued |
| 10 | Family & community life | — | — | — | queued |
| 11 | Context & wellbeing stats | — | — | — | queued |
| 12 | Single-parent economics / benefits cliff | — | — | — | queued (analysis, not map) |
| + | Composite overlay | — | — | — | queued (last) |
