# Design Discussion v3 — Allergy Locator: Interactive Map (re-plan, round 3)

**Status: supersedes v2.** Round 2 review rejected v2's grass-primary scope narrowing
and its timeframe deferral, then further corrected round 3's own initial framing:
this is a comprehensive, data-driven, generic allergen map — every allergen there's
sourceable data for, not a curated list — with two map modes and a full time
dimension, all as v1 scope. The v1/v2 epic docs are preserved in git history
(`f4171bc`) for reference but are obsolete.

## §0 Prelude
No prior KG decisions system in use for this project (no `/hive:why` history). No
PRIOR DECISIONS section.

**NORTH STAR** (from `.pHive/project-profile.yaml`, still current): reverse "pollen
near me now" tool → "given MY allergens, where in the US is best/worst for me?" Public,
no login. Now understood as Phase 1 of a larger livability atlas (`docs/ROADMAP.md`),
but this epic's own success bar is unchanged: ship the working allergy tool.

## §1 Goal
Ship a comprehensive, data-driven, general-purpose interactive allergy map with two
modes, built on the 168-city spine (`data/cities.json`) and the already-validated
grass-severity methodology (`data/allergy-scores.json` / `allergy-scoring.md`) as the
reference implementation and flagship worked example — not as a ceiling on scope.
Per the user's direction across three rounds of correction (verbatim, quoted below):

- **Mode 1 — Allergen overlay map (build first).** *"The first version is just to turn
  on and off overlays on a map of what the allergens are — ex: ragweed toggled on as
  dark green gradients, bluegrass toggled on as a blueish gradient, cedar toggled on as
  a reddish gradient etc."* A raw, unpersonalized view: toggle any allergen there's
  data for — on/off, each its own gradient overlay across the 168 cities. Not about any
  one person's sensitivity yet — this is "what's out there."
- **Mode 2 — Personalized composite (build second).** *"Then we build sensitivity
  sliders for YOU to see YOUR overlay with them and then we can make the chart that
  goes from green to red purely on YOUR allergies."* A slider per allergen combines the
  selected allergens' Mode-1 values into one green→red composite score, personalized.
  The author's real, mostly-grass panel loads as the flagship example/default (*"MINE
  is mostly grass... however this is a general tool for anyone"*).
- **Comprehensive, data-driven scope — not a curated list.** *"Not 15 known allergens,
  ALL KNOWN — we want mold, we want everything that we have data for... this is a
  GENERIC ALLERGEN MAP."* And, more emphatically: *"MY TEST had more than 15, I just
  wasn't reactive to them all — WE PULL ALL ALLERGY DATA WE HAVE — PERIOD — WE PUT THEM
  ALL ON THERE... don't hardcode, just loop through allergy toggles for shit in data."*
  This is a binding product AND architecture requirement — see §2 item 1.
- **Time dimension — not deferred.** *"We need to do it by date, season, etc as we have
  all the data and you want to be able to play out areas over time... even a 'play the
  year' button... to see the highs and lows... You may find the best time and area for
  YOU is mid summer in Florida or YOU may do best in winter in Alaska."* Both modes need
  a date/season control, plus a **year-playback** animation and **reports**
  ("by the END of this") summarizing best time+place for a given sensitivity profile.

## §2 Proposed approach

### 1. Comprehensive, data-driven allergen scope (the central correction this round)
`species-ranges.json`'s current 15 species are the author's own curated *reactive*
subset (his 2013 full panel tested far more — trees, grasses, weeds, molds — he just
wasn't positive on most of them), not the full allergen universe. Two binding decisions
follow directly:

- **Data scope: pull and include every allergen there's sourceable data for** — trees,
  grasses, weeds, mold, full stop. Not a curated "standard tracked set" chosen by the
  planner; whatever the research/data-sourcing step can find open data for gets
  included. No allergen excluded for seeming minor or regional.
- **Architecture: the allergen list is data-driven, never hardcoded in UI/engine code.**
  Toggles, sliders, palette assignment, and click-through all iterate over whatever
  allergens exist in the sourced data (e.g., loop over a data file's keys/entries) —
  adding a new allergen to the data must require zero UI code changes. Binding for
  every story touching Mode 1/Mode 2 UI (also listed in §7).

**Mold is a special call-out** — it doesn't fit the pollen model at all: spore-based,
driven by humidity/moisture/decay, not a bloom season, needing its own data source and
severity model. **Real conflict to flag:** the standard mold-count source (NAB station
network) is the same source `REQUIREMENTS.md` already flags as "reference/QA only —
NOT embedded (reuse restricted)." Finding an open, embeddable mold data source (or an
honest modeled proxy from humidity/climate data, labeled as such) is a genuine open
research question, not a formality — its own risk (§4) and its own early story in the
vertical plan.

**Honesty requirement, unchanged in spirit from earlier rounds:** grass keeps its
rigorous ground-truth fit (MAE 2.3); every other allergen is a good-faith modeled
extension without an equivalent ground-truth fit yet. A `confidence: validated |
modeled` flag per allergen carries this honestly rather than flattening it.

- **Mode 1 (overlay map):** each allergen's per-city severity value renders as its own
  colored gradient (distinct hue per allergen, per the user's example — ragweed dark
  green, bluegrass blue-ish, cedar reddish; exact palette is a `dataviz`-skill task, not
  a design-discussion decision).
- **Mode 2 (personalized composite):** a sensitivity slider per allergen (0-100 or
  none/mild/moderate/severe) weights that allergen's Mode-1 value into a single
  composite score per city, colored green→red. The author's real panel is the loadable
  flagship example — one valid slider configuration among all possible ones, not a
  special code path.

### 2. Time dimension: season/date control + year playback + reports
Not deferred (reverses v2's deferral). Three layered pieces, sequenced simplest-first
in the vertical plan:
- **Season-position scoring.** Extend each allergen's severity formula with a month/
  date parameter, using the season-length/timing data already implicit in
  `MODEL-NOTES.md`'s cited sources (Anderegg 2021, Zhang-Steiner 2022) and Köppen-zone
  seasonality — a modeling extension of data already on hand, not a new external
  data-sourcing task. Both Mode 1 and Mode 2 read from this.
- **Year playback.** A "play the year" control that animates the map through month-by-
  month (or finer, if the underlying season model supports it) positions, so a user
  watches a city's (or their personalized composite's) severity rise and fall — this is
  what surfaces "mid-summer Florida vs. winter Alaska" for a given sensitivity profile.
- **Reports.** A generated summary (best time + place for the active sensitivity
  profile, worst-avoid list, notable seasonal windows) — the concrete "by the END of
  this" deliverable. Format (on-page panel vs. exportable doc) is a structured-outline
  detail, not resolved here.

**Explicit honesty note (unchanged):** this is a **modeled seasonal curve**, not live
meteorological forecasting. "Play the year" plays through the *model*, not a real-time
weather feed.

### 3. Map rendering — 168-city point map, multi-layer, engine kept clean for later upgrade
Render `data/cities.json`'s 168 cities as color-coded markers on a US base map.
Multi-layer: Mode 1 shows N allergen overlays (toggleable, each own gradient), Mode 2
shows one composite overlay (green→red). Click a city → full component breakdown
(reusing `allergy-scores.json`'s existing decomposition pattern, generalized per-
allergen) as a plain-English "why," including the active season/date position.

Per-city confidence is **"validated"** for grass, **"modeled"** for every other
allergen (§2 item 1) — carried forward honestly, never flattened. Data model stays a
`{location, value, confidence}` shape per allergen per timeframe so `docs/ROADMAP.md`'s
later county/raster upgrade extends rather than replaces it — a cheap, one-way-door-
avoiding step, not scope creep in itself (this round's real scope growth is the
allergen/time expansion the user asked for directly, not this data-model line).

### 4. Panel/sensitivity input
Per-allergen sensitivity sliders (§2 item 1, Mode 2), rendered by looping over the
sourced allergen data (never a hardcoded slider list) + a "load the author's example"
shortcut (flagship panel, doubles as the E2E fixture). JSON/CSV import for a full
slider-set remains a reasonable v1 feature, covering the full comprehensive allergen
list.

### 5. Story/about pages — ship both, user picks live
*"Ship about 1 and 2 with a toggle and I'll choose."* `/about` ships **both** `ABOUT.md`
and `ABOUT-v2.md` content behind an in-page toggle (not an either/or content decision,
not deferred to `/design`) — the user compares live rather than from a mockup. Layout
(tabs: "My Story" vs. "The Project", per round 1) still goes through `/design`
delegation; the copy-variant toggle is a concrete requirement handed to that delegation,
not an open question for it to resolve.

### 6. Agent-controllable URL state
Serialize the active view (mode, all allergen sliders/toggles, active date/timeframe) to
URL query params. State shape scales with however many allergens the data-sourcing step
produces (§2 item 1) — likely a compressed/encoded param rather than one per allergen —
but the principle is unchanged from prior rounds: no chat/LLM in this epic; the full v2
agentic-ingestion plan stays in `.pHive/planning/roadmap.md`.

### 7. Tooling readiness
Unchanged — still needs to happen, still never completed (the background teammate
failed before the session restart, per `.pHive/agent-complete/aed3d23d0f44c776a/
complete.json`'s `verdict: failure`). Re-run as the epic's first story.

Cross-cutting: E2E harness validates grass (the rigorous case) against `MY-ANSWER.md`'s
ground-truth table across multiple timeframe positions (not just "now"), and validates
every other allergen overlay only for presence/plausibility (no ground-truth table
exists for those yet — honestly scoped test coverage, matching §2 item 1's confidence
labeling). `secret_scan` / zero-external-calls guardrails unchanged.

## §3 Scale assessment
**Still Large, and larger with each round** — the user has consistently asked for more
real scope (all allergens comprehensively, not a curated list; full time dimension, not
deferred), not less. Reasoning:
- Mode 1 and Mode 2 are two real, distinct rendering/interaction modes, not one map
  with a toggle.
- Comprehensive, data-sourced allergen coverage (including a from-scratch mold data/
  model question) is real new data-sourcing + modeling work, not a UI change.
- Time dimension adds a genuine new modeling task (season-position scoring) plus a
  playback UI plus a reporting deliverable — three sub-slices, not one.
- The user asked explicitly for "vision and iteration on deferring things and doing
  simplest first" — i.e., trusted this plan to find the right thin-first sequencing
  across a genuinely larger true scope, which is exactly what H/V planning does.

**Recommendation:** re-run H/V planning + structured outline (Phase B2 + B3) against
this larger, locked scope.

## §4 Key risks
1. **Non-grass severity formulas are new, unvalidated modeling work**, not a data-
   sourcing task like turf/arid-weed was. Mitigation: explicit `confidence: validated |
   modeled` labeling (§2 item 1); ship as directional, not silently equal to grass's
   rigor.
2. **Season-position modeling is new work on top of existing data**, not a new external
   source — but it's still unbuilt. Mitigation: sequence it as its own slice with a
   `research` step that operationalizes the season-length literature already cited in
   `MODEL-NOTES.md`, rather than assuming it falls out of the existing per-city scores
   for free.
3. **"Play the year" + reports could balloon scope** if treated as one monolithic
   feature. Mitigation: three explicit sub-slices (season-position scoring → playback UI
   → reports), each independently shippable, per §2 item 2.
4. **A comprehensive-allergen × slider × timeframe state space is much bigger than a
   single grass value.** Mitigation: still URL-param serialization (§2 item 6), just a
   larger/encoded schema; no architecture change.
5. **Mold sourcing conflicts with an existing hard constraint.** The standard mold-count
   source (NAB) is already documented in `REQUIREMENTS.md` as reference/QA-only, not
   embeddable. Mitigation: dedicated research story (vertical-plan Slice 2b) to find an
   open, embeddable mold data source or build an honestly-labeled modeled proxy from
   humidity/climate data — do not silently skip mold or silently violate the reuse
   restriction to get it.
6. **"All allergens there's data for" could expand indefinitely** if the data-sourcing
   step has no bound. Mitigation: the research story scopes to what real open sources
   actually cover (USDA PLANTS species range data, NAB-alternative mold sources, etc.),
   not an unbounded search — bounded by data availability, not by planner curation.
7. **168-city granularity still reads as "thin"** for users expecting their exact town.
   Mitigation unchanged: honest "nearest of 168 reference cities" framing.
8. **Re-litigating settled ground.** Tailwind, tooling list, about-page routing/layout
   remain unchanged from prior rounds — this revision only touches allergen scope, time
   dimension, and the about-copy decision.

## §5 Dependencies
- No new external API dependency — all scoring stays build-time/static, computed from
  data already in the repo plus newly-sourced open data (comprehensive allergen list,
  mold), not a runtime fetch.
- `/design` delegation for the about-page layout pass (§2 item 5), with the
  both-variants-with-toggle requirement handed in explicitly.
- Reports (§2 item 2) depend on Mode 2 (personalized composite) and season-position
  scoring both existing first — naturally sequenced late in the vertical plan.
- The comprehensive-allergen data-sourcing story (§2 item 1) blocks Mode 1's full
  buildout (beyond the grass proof-of-pipeline) — sequenced early in the vertical plan.

## §6 Open questions for the user
None blocking — this round's direction was explicit enough to proceed. Noted for the
record rather than asked as a gate: mold and non-grass severity will be **modeled, not
ground-truth-validated**, since no panel/lived-reaction data exists for those categories
the way it does for grass — flag if you have ground-truth data for other allergens.

## §7 Non-negotiables carried into every story
Zero cost, zero secrets, zero runtime data-fetch, no login/accounts/tracking, "no place
cures you" content invariant, directional-not-medical-advice disclaimers throughout
(including the season-model-not-forecast distinction), **the allergen list is always
data-driven, never hardcoded in UI/engine code** (new this round, binding), v2/v3
features (agentic ingestion, multi-profile, full raster engine, multi-dimension
overlays) stay out of this epic's stories.
