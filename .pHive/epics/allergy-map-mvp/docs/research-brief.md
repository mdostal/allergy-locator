# Research Brief v2 — Allergy Locator: Interactive Map (re-plan)

**Supersedes** the v1 research brief. This pass is a reconciliation brief: the technical
foundation changed substantially (via parallel research) between the original plan and
now. Codebase-only pass again — no context7/web validation needed, the new artifacts
below are the primary sources.

## What changed since the original plan
Documented in full in the two commits `f4171bc` (original epic) and `cf358e6`
("Livability Atlas expansion") on this branch. Summary:

1. **This project is Phase 1 of a 12-dimension "Livability Atlas"** (`docs/ROADMAP.md`),
   not a standalone allergy tool. Allergy is dimension 1, already flagged "flagship
   live, expanding." Care-access (dimension 2) and cost/housing (dimension 3) data are
   already gathered (`data/care-access.json`, `data/hospitals-*.json`,
   `data/cost-of-living.json`, `data/cost-single-parent.md`) but **out of this epic** —
   they're queued for later dimension epics, per the roadmap's own build order.
2. **The severity-scoring engine already exists, is already validated, and must not be
   rebuilt from scratch.** `scripts/gen_spine.py` generates `data/cities.json` (a
   168-city US spine: id, city, state, lat, lon, pop, elevation_ft, koppen zone, coastal
   flag, plus per-city `turf`/`aridsw` scoring hints) and `data/allergy-scores.json`
   (a pre-computed score per city, fully decomposed into 5 components:
   `base_season_climate`, `turf_boost`, `arid_weed`, `elevation_discount`,
   `coastal_nudge`). `data/allergy-scoring.md` documents the exact formula, an A/B test
   between two weighting variants (the shipped one fits real ground-truth reactions at
   **MAE 2.3**, 4x better than the alternative), and honest limitations.
3. **Critical scope nuance the design discussion must resolve:** the shipped formula and
   its pre-computed scores are **hardcoded to one fixed profile** — "grass-dominant,
   with ragweed/cedar/oak/elm/mold suppressed" (the author's real panel). It is
   explicitly documented as "wrong for anyone who reacts to ragweed, juniper, oak, or
   mold." This is NOT yet a general function of an arbitrary user-selected panel, even
   though `docs/ROADMAP.md` states the end-goal tool is "pick-your-panel → US map colored
   for you." Only the **grass axis** has a validated, tuned formula; weed/tree axes do
   not have equivalent rigor yet. This is a genuine open question for the design
   discussion, not a detail to silently paper over.
4. **Rendering target changed.** `docs/ROADMAP.md` states a hard requirement (addressed
   explicitly to "the hive build"): architect the map as a value-surface +
   confidence-surface engine per dimension, not hardcoded discrete dots, with county/
   raster granularity as the *eventual* target. However, the user has explicitly
   overridden scope for THIS epic (verbatim): *"your initial static, simple version is
   first and we iterate up"* — the full raster/heatmap engine and multi-dimension overlay
   architecture (one map + toggleable datasets vs. many maps) are explicitly deferred to
   v2/v3, not resolved now. The `data/us_states.svg` / `us_state_paths.json` state-fill
   approach from the original plan is superseded by the 168-city spine — a state-level
   fill can't even represent the new data (`cities.json` has no state-aggregate
   scores, only per-city).
5. **New content exists for the about/story pages:** `docs/story/ABOUT-v2.md` is a
   second draft of `docs/story/ABOUT.md` (different opening hook, same thesis) — this
   conveniently **already satisfies** the earlier user request for two `/about` layout
   variants to compare, at the content level (still needs a visual layout pass).
   `docs/story/MY-ANSWER.md` is a worked ground-truth validation against the new
   city-spine scoring model (parallel to the older `MY-STORY.md` panel-history
   narrative) — both are legitimate content, covering different things (medical history
   vs. lived-place validation).
6. **`docs/TURF-DATA-SOURCES.md`** documents the open data sources actually used for the
   turf/arid-weed layers already baked into `allergy-scores.json` — this closes out the
   research risk flagged in the original plan (Risk #4 / turf-data sourcing story) as
   already resolved.
7. **My prior v2/v3 roadmap** (`.pHive/planning/roadmap.md` — agentic panel ingestion +
   verification, multi-profile/family overlay) is still valid as a sub-scope, but now
   nests inside the much larger `docs/ROADMAP.md` vision. No duplication needed — cross-
   reference rather than rewrite.

## Carried-forward constraints (unchanged, still non-negotiable)
Zero cost, zero secrets, zero runtime data-fetch for the core map, no login/accounts/
tracking, "no place cures you" content invariant, directional-not-medical-advice
disclaimers throughout. `hive.config.yaml`: `planning.collaborative_review: false`
(solo review), `execution.default_methodology: classic`, no `task_tracking` adapter.

## Gaps / open questions for this design discussion
- **Grass-only vs. general-panel scope for v1** (§3 above) — the central open question.
- **Point-map rendering approach**: city markers (168 points) styled to look intentional
  (not "hardcoded dots" in the pejorative sense) vs. some interpolated
  surface even in v1. User's "keep it simple" steer points toward markers; confirm.
- **One map + toggleable datasets vs. many maps** — explicitly out of scope for this
  epic per the user; record as a v2/v3 decision point, not resolved here.
- **Data freshness**: `cities.json`/`allergy-scores.json` are static, hand-curated,
  generated by a Python script — confirm this stays a build-time artifact (matches the
  zero-runtime-fetch constraint) rather than needing a live pipeline.
