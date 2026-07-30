# Design Discussion — Allergy Locator: Interactive Map MVP

**Status:** revised after user review round 1 — user has signed off to proceed
("I think we're good to begin"). This revision folds in real scope changes from that
round (toggleable multi-allergen layers, current/forecast time dimension, agentic panel
ingestion + verification, and a corrected roadmap), not just cosmetic edits.

## §0 Prelude
No prior KG decisions found (`/hive:why` not run — no cycle-state/decision history exists
yet for this greenfield project; this is epic #1). No PRIOR DECISIONS section.

**NORTH STAR** (from `.pHive/project-profile.yaml`):
- **Goal:** An open-source interactive US map that answers "given MY allergens, where in
  the US is best/worst for me?" — the reverse of every "pollen near me now" tool.
- **Audience:** Anyone with an allergy panel choosing where to live; primary worked
  example is the author (grass-dominant profile). Public, no login.
- **Scale:** Low — static site, hobby plan. Directional tool, not high-concurrency SaaS.
- **Pain points:** Presence ≠ severity — a naive presence map is a useless red rectangle;
  coloring must be severity-based.
- **Success:** A public URL where picking allergens recolors the map, click-through works,
  $0 cost, fully open, no secrets.
- **Avoid:** Any secret in repo/client. Presence-only coloring. Runtime data-fetch for the
  core map. Scope creep beyond a state-level US map.

## §1 Goal
Build the first working version of Allergy Locator end-to-end: a static, interactive
US map (Next.js/Vercel, zero-cost, zero-key) covering **50 states + DC (51 geographic
units total** — not 51 states; corrected after round 1) that colors each unit on a
green→red **severity** scale, per allergen, for a user-selected or user-provided panel,
across a **selectable date/timeframe** (current season position → seasonal outlook), lets
the user click a state to see what's driving its color and when in the year it matters,
and tells the project's own origin story on real site pages. The user's own 2013→2026
allergy-panel history and road-trip reactions are the literal, falsifiable QA oracle for
whether the coloring is right, per `docs/E2E-TESTING.md`.

This is not a new idea-generation exercise — `REQUIREMENTS.md`, `.pHive/planning/
architecture.md`, `docs/MODEL-NOTES.md`, and `docs/E2E-TESTING.md` already specify the
core product and coloring algorithm; this design discussion adds the round-1 expansions
(multi-allergen toggles, time dimension, agentic ingestion) on top. This epic's job is to
**build the v1 slice of it** — see §1b roadmap for what's in this epic vs. deferred.

## §1a Terminology (resolves grill-record V1)
- **Panel** — the underlying allergen dataset (CONTEXT.md's canonical term): which
  allergens someone reacts to, at what severity, per their actual test results.
- **Profile** — the named, saved UI construct that wraps one panel (e.g., "mine,"
  "partner's"). v1 has exactly one active profile at a time (no save/switch); saving
  and holding multiple profiles is v3 (see roadmap).

All stories and story YAMLs use "panel" for the data concept and "profile" only for the
(future) saved/named container around it.

**"Static" (clarified, round 3)** describes two specific things and nothing else: (1) the
**data pipeline** — severity inputs are baked at build time, zero runtime fetch; and
(2) the **rendering technique** — an inlined SVG (vector paths recolored via CSS/JS), not
a server-rendered raster/canvas image. It does **not** describe the user experience. From
the user's perspective the map is a fully **dynamic, interactive heatmap**: colors
recompute client-side in real time as they toggle allergens, move the timeframe control,
or load a different panel — it just never makes a network call to do it, and the color
values themselves are pixels/paths on an SVG rather than a live raster tile layer.
"Slice 2 — static severity map" (vertical-plan.md) is named for using one *hardcoded*
profile, not for being non-interactive — its map still recolors correctly if you swap
which allergens the hardcoded panel contains; the toggle/timeframe *controls* just don't
exist as UI yet until Slices 4-5.

## §1b Roadmap (locked with the user, round 1)
This epic (`allergy-map-mvp`) decomposes stories for **v1 only**. v2 and v3 are real,
intended, and documented here so v1's architecture doesn't box them out — but they are
**not** decomposed into stories in this epic; they become their own future epics once v1
ships and is validated against the author's panel.

- **v1 (this epic):** interactive severity map, per-allergen toggle + color-coding,
  current-position + seasonal-outlook time dimension, manual allergen picker + preset +
  JSON/CSV panel import (single active profile, no save), about/story pages, full E2E
  harness. Architecture is agent-controllable by design (state is serializable) so v2
  doesn't require a rewrite, but no chat UI or LLM calls ship in v1.
- **v2 (future epic):** agentic panel ingestion — user pastes/uploads a raw report, an
  LLM parses it into the exact same panel schema v1's JSON import already uses, a
  **second, independent LLM pass verifies** the extraction against the source (checking
  for fabricated allergens/values before anything renders), and only a verified panel
  populates the map. Also: a documented, agent-friendly control API/tool surface (so an
  external agent — Claude Desktop via MCP, a script, etc. — can drive the map without
  the in-app chat).
- **v3 (future epic):** multiple named, saved profiles; save/share; overlay multiple
  profiles at once (the family use case — e.g. a parent and child's panels shown
  together).

## §2 Proposed approach (v1)
Eight layers (expanded from 6 after round-1 feedback), sequenced as vertical slices in
`vertical-plan.md`:

1. **App scaffold.** Next.js (App Router, TypeScript) + pnpm, deployed to Vercel hobby,
   auto-deploy on push to `main`. Styling: **Tailwind CSS** (confirmed by user, round 1).
   Tailwind is a developer-ergonomics choice only — it does not by itself deliver
   accessibility; colorblind-safe coloring is a separate palette decision (Risk #5).
2. **Data pipeline (build-time, zero runtime fetch for the baked core).**
   `scripts/build-data.ts` normalizes `data/species-ranges.json` + season/climate inputs
   into `data/severity-model.json`. Presence + grass-season/climate layers need zero new
   external calls. Turf/irrigation + arid-weed layers, and any additional open datasets
   from the round-1 "deep dive" ask (see item 7 below), are a separate, explicit sourcing
   task — see Risk #4.
3. **Severity scoring engine.** Presence gates which allergens list on a state; severity
   (season length × intensity × climate + irrigated/planted-turf weighting + arid-
   Southwest weed/dust layer) drives the color, computed **per selected allergen** (not
   only a single blended score — see item 4) so individual allergens can be toggled and
   viewed independently. Pure function, unit-tested against the E2E oracle table before
   the UI consumes it.
4. **Interactive map UI — multi-layer + time-aware (expanded, round 1).** Inlined SVG,
   no external map CDN. Two round-1 additions beyond the original single-score map:
   - **Per-allergen toggle layers.** The user can turn individual allergens on/off and
     see each one's own color-coded severity, not just a combined score. Combined
     ("your whole panel") remains the default view; toggling isolates one allergen at a
     time for "which specific thing is driving this."
   - **Date/timeframe control.** A control (e.g. a month/date selector) re-scores the
     map for a chosen point in the year, so a user can ask "what does this look like in
     April vs. August" for trip/move planning. **Scope decision for v1 (proposed):**
     this is a **climatological/seasonal outlook** — computed from the already-planned
     season-length/intensity data (the same inputs driving the static severity model),
     NOT live day-by-day weather-service pollen forecasting. True meteorological
     forecasts come from commercial providers (Ambee, IQVIA/Pollen.com, Google Pollen)
     that are rate-limited/paid at any real scale, which conflicts with the $0/no-key
     hard constraint. "Current conditions right now" stays the existing **optional**
     Google-Pollen live toggle (still off by default, still server-proxied). This
     reconciles "current AND forecast" with the cost constraint; flagged for iteration
     per the user ("we'll have to play with this iteratively") rather than treated as
     final.
   Click a state → panel with allergens present + season window + plain-English "why,"
   sourced from the same severity engine (no duplicated logic).
5. **Profile input (v1 scope, corrected round 1).** Manual allergen picker (grasses/
   weeds/trees checklist) + a load-a-preset shortcut for the author's own panel (doubles
   as the E2E fixture) + a structured **JSON/CSV panel import**. Correction from round 1:
   nobody uploads a pre-made "allergy map" — the import is raw allergen/severity data
   (from a test panel), and the app builds the map from it. No save, no multiple
   profiles, no overlay in v1 (that's v3).
6. **Story/about pages + disclaimers (resolved, round 1).** A single `/about` route with
   two tabs: **"My Story"** (the author's personal journey — MY-STORY.md /
   WHY-THIS-EXISTS.md / IMMUNOTHERAPY.md content) and **"The Project"** (what the tool is,
   how the coloring works, "not medical advice"). This is a UI story and auto-detected
   for `/design` delegation (step 16) — per the user's suggestion, the delegated design
   pass should produce **2 layout variants** for the tabbed page so the user can pick a
   winner (or ship both behind a flag), rather than a single take. Placeholder images
   ship as visible placeholders (user will supply real photos later — confirmed, no
   action needed now).
7. **Agent-controllable surface (new, round 1 — v1 groundwork only).** Full map state
   (active panel/selected allergens, toggle states, date/timeframe) is serializable to
   URL query params from day one. This is the only v1-scoped piece of the "agentic tools/
   API" ask: it makes the map already scriptable/shareable-by-URL without any LLM
   involved, and it's the foundation v2's in-app agent and any external agent (MCP tool,
   script) will target later without a rewrite. **Explicitly deferred to v2:** the in-app
   chat agent, LLM-based panel parsing, the verification-agent pass, and any published
   MCP/tool-spec wrapper — none of those ship in this epic.
8. **Data deep-dive (new, round 1).** A research task to survey additional open, freely-
   embeddable US datasets beyond USDA/GBIF for the turf/arid-weed severity sub-layers and
   any other severity inputs — see Risk #4 and §6 decisions.

Cross-cutting: E2E test harness per `docs/E2E-TESTING.md` (unit scoring tests, per-
allergen toggle correctness, data-integrity checks, Playwright ground-truth assertions),
CI wiring, and the `secret_scan` / zero-external-calls guardrails as non-negotiable gates
on every PR.

## §3 Scale assessment
**Large — unchanged, but larger within Large after round 1.** Reasoning:
- Eight distinct layers now (was six): build pipeline, per-allergen severity engine,
  time-aware multi-layer map UI, profile/import, about/story content with a two-variant
  design pass, an agent-controllable state surface, a dataset deep-dive, plus the full
  test harness.
- Zero existing application code — from-scratch build.
- Cross-stack: TypeScript build tooling, data normalization/research, SVG/React
  rendering with new toggle + time-control UI, URL-state serialization, CI.
- Long-horizon and correctness-critical: the severity model (now per-allergen, not just
  blended) is judged against a falsifiable human answer key across 8+ named places.
- v2/v3 are real and documented (§1b) but explicitly **out** of this epic's story
  decomposition — kept out to stop the vertical-slice invariant ("every story leaves a
  working product state") from being violated by half-building an LLM feature.

**Recommendation:** run full H/V planning + structured outline (Phase B2 + B3) — proceeding
now per user sign-off.

## §4 Key risks
1. **Severity formula is genuinely unvalidated code.** Mitigation: build the E2E oracle
   table from `docs/E2E-TESTING.md` as literal unit-test fixtures alongside the scoring
   engine, now including per-allergen assertions (toggle one allergen → does the isolated
   color match expectation), not just blended-score assertions.
2. **Scope discipline across a 3-phase roadmap.** Mitigation: §1b's explicit v1/v2/v3
   split, restated in every H/V and outline artifact, so "agentic" and "multi-profile"
   asks don't silently creep into v1 stories.
3. **PDF/report upload is explicitly v1-out** (unchanged from round 1's Q1 answer: v1
   ships JSON/CSV import; report/PDF ingestion becomes v2's *agentic* path, not a v1
   parser). Mitigation: no PDF/OCR dependency anywhere in this epic.
4. **Turf/irrigation, arid-weed, and "deep dive" data may require new open-data
   sourcing.** Only grass/weed/tree species-range presence is committed today. Mitigation:
   an explicit `research` story surveys open, freely-embeddable US datasets (candidates
   to validate, not assume: USDA Cropland Data Layer for irrigated/agricultural land as a
   turf proxy, NOAA climate normals for an aridity index, EPA AirNow for a dust/air-
   quality irritant signal, CDC environmental public health tracking). AAAAI/NAB remain
   explicitly reference/QA-only per `REQUIREMENTS.md` — not embeddable regardless of how
   useful they'd be.
5. **Colorblind-safe, multi-series color scale.** Now harder than round 1's single
   green→red scale: per-allergen toggle views need colors that stay distinguishable from
   each other **and** colorblind-safe individually. Mitigation: use the `dataviz` skill's
   documented palette method rather than inventing one.
6. **No CI exists yet.** Mitigation: CI wiring is an explicit, early story.
7. **"Current AND forecast" data cost/licensing (new, round 1).** True real-time/forecast
   pollen data from commercial providers is not free at scale and would reintroduce a
   paid-key dependency into what's meant to be a $0 tool. Mitigation: v1 ships a
   climatological/seasonal-outlook timeframe control (derived from already-baked season
   data, no new key), and treats true live/forecast conditions as the existing optional,
   off-by-default Google-Pollen toggle — explicitly flagged as an area to iterate on
   rather than a final decision (user's own framing).
8. **Agentic ingestion (v2) reintroduces a cost/key dependency if built naively (new,
   round 1).** An LLM parse+verify pipeline is not free per-call and a project-held API
   key would violate the zero-secrets/zero-cost constraints. Mitigation (recorded now so
   v1's architecture doesn't foreclose it): v2 should use a **bring-your-own-key** model —
   the user supplies their own LLM provider key, held only in their own browser, used
   either for direct client→provider calls or through a stateless proxy that never logs
   or stores it. Not built in v1; recorded here because it constrains v1's state model to
   stay clean/serializable (§2 item 7) so v2 can be added without a rewrite.

## §5 Dependencies
- Vercel account + hobby-plan project connected to `mdostal/allergy-locator` (external,
  user-owned).
- No new external API dependency for v1's core map. The optional Google-Pollen live
  toggle remains explicitly optional/off-by-default and out of the critical path.
- Item 8's data deep-dive may introduce a new open-data dependency — must meet the same
  bar as USDA/GBIF: free, attributable, bakeable at build time, no runtime key.
- v2 (future epic) will depend on a user-supplied LLM API key (BYO-key) — not a v1
  dependency, recorded for architectural continuity only.

## §6 Decisions locked with the user (round 1 — supersedes round-1 open questions)
1. **Upload scope:** JSON/CSV structured panel import ships in v1. Agentic (LLM parse +
   independent LLM verify) is v2, explicitly deferred.
2. **"Upload allergy maps" — corrected:** nobody uploads a finished map; users upload/
   enter their raw panel (allergens + severity from their tests) and the app builds the
   map. Save/share/multiple-profile-overlay is v3, for family use.
3. **Time/season surface:** confirmed — the map must support changing date/timeframe and
   viewing allergen amounts over it, with the explicit understanding this will be
   iterated on rather than nailed down in one pass. v1 ships the climatological/seasonal-
   outlook version (§2 item 4, §4 Risk #7).
4. **Turf/irrigation + arid-weed data:** no dataset already in hand beyond what's
   committed — deep-dive additional open US pollen/allergy/land-use datasets as part of
   this epic (§2 item 8, §4 Risk #4).
5. **Styling:** Tailwind CSS — confirmed.
6. **About/story routing:** one `/about` route, tabbed ("My Story" vs. "The Project").
   The `/design` delegation for this story should produce 2 layout variants for the user
   to choose between (or ship both) rather than a single take.
7. **Story-page images:** ship visible placeholders; user will supply real photos later.
   No action needed in this epic beyond not blocking on missing images.

No blocking open questions remain for Phase B2. Any further refinement on the time/
timeframe UX (item 3) and the exact deep-dive dataset picks (item 4) will surface as
elicitation answers in the structured outline and/or as findings in their own stories'
`research` steps — both are explicitly iterative by the user's own framing, not gates on
starting.

## §7 Non-negotiables carried into every story (do not re-litigate per-story)
- Zero cost, zero secrets, zero runtime data-fetch for the v1 core map, no login/
  accounts/tracking in v1, state-level resolution only, severity-not-presence coloring
  (now per-allergen too), "no place cures you" as a content invariant, directional-not-
  medical-advice disclaimers throughout, v2/v3 features stay out of this epic's stories.
