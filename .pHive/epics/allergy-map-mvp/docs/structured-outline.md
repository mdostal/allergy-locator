# Structured Outline — Allergy Locator: Interactive Map MVP (v1)

Builds on `design-discussion.md`, `horizontal-plan.md`, and `vertical-plan.md`
(10 slices, 0-9, after round-2 revisions). This is the detailed execution plan story
decomposition (Phase C) will map onto.

## Part 1 — Scope recap
v1 only. v2 (agentic ingestion + verify, agent API) and v3 (multi-profile/family) are
fully specified in `.pHive/planning/roadmap.md` and explicitly **not** decomposed into
stories here.

## Part 2 — Detailed approach per slice

### Slice 0 — Tooling & skill readiness
No app code. Output is a short `TOOLING.md` (or a section in `.pHive/CONTEXT.md`) listing:
enabled skills (from `anthropics/skills` + skills.sh candidates in `vertical-plan.md`),
why each was picked, and one smoke-test result per skill. Decision: prefer the
already-connected Playwright MCP over a separate `webapp-testing` skill unless the skill
adds something the MCP tools don't (evaluate at execution time, don't install both
redundantly).

### Slice 1 — Scaffold + deploy skeleton
`create-next-app` (App Router, TypeScript, Tailwind, `src/` layout, ESLint). Connect to
Vercel (user's existing hobby account) with auto-deploy on push to `main`. Add
`.env.example` documenting `GOOGLE_POLLEN_API_KEY` (name only, no value, matches existing
architecture.md decision). Add a global disclaimer footer component now — every later
page/slice reuses it, so it should not be re-invented per page. Add empty `vitest`
(or `jest`) + Playwright config so CI has something to run from Slice 1 onward, even
before there's app logic worth testing.

### Slice 2 — Static severity map, one hardcoded profile
`lib/severity/` — pure TS module: `gate(panel, state) -> Allergen[]` and
`score(panel, state) -> number` (blended only, this slice). Consumes
`data/severity-model.json` (produced by a first, presence/season/climate-only pass of
`scripts/build-data.ts`). `components/UsMap.tsx` renders `data/us_states.svg` paths,
colored via the severity score through a chosen color-scale function (placeholder scale
this slice; Slice 6's palette work replaces it with the validated colorblind-safe one).
`data/presets/author.json` is created here — the derived panel from `docs/E2E-TESTING.md`
(allergen selections + notes only, no raw medical documents, per that doc's explicit
privacy boundary). Unit tests for `lib/severity/` are table-driven directly from the
`docs/E2E-TESTING.md` oracle table's core assertions (the ones not requiring turf/arid-
weed data yet).

### Slice 3 — Profile input
`components/AllergenPicker.tsx` (checklist by category: grass/weed/tree).
`lib/panel-schema.ts` defines the canonical panel JSON shape (this is the schema v2's
agentic parsing will target later — keep it clean and documented, per roadmap.md).
`lib/panel-import.ts` parses + validates uploaded JSON/CSV, rejecting malformed input
with a specific, user-facing error (never silently guessing a value). App state
(`lib/app-state.ts`, React context or a small store) holds the single active panel.

### Slice 4 — Per-allergen toggle
Extend `lib/severity/score` to `scoreByAllergen(panel, state) -> Record<Allergen,
number>`. `components/AllergenToggle.tsx` — per-allergen on/off, drives which score(s)
`UsMap` renders (combined vs. isolated). Unit tests add per-allergen assertions (e.g.
"grass-only toggle in TX scores high; ragweed-only toggle in TX for the author's negative
profile scores near-zero, matching the Austin case in the oracle table").

### Slice 5 — Date/timeframe control
Extend the severity function signature with a `timeframe` (month or date) parameter,
scored against season-window data already implied by `data/severity-model.json`.
`components/TimeframeControl.tsx` (a month slider or select). This is explicitly the
climatological-outlook interpretation (design-discussion §4 Risk #7) — no new external
data source.

### Slice 6 — Turf/irrigation + arid-weed data integration
Research sub-step first (own `research` step in the story): read `docs/TURF-DATA-SOURCES.md`
if it has landed by then (a separate research pass, in flight as of this outline,
producing verified open sources + a recommended combine rule + rejected non-open
candidates — left uncommitted until this slice picks it up, per round-3 discussion);
otherwise validate candidate open datasets directly (USDA Cropland Data Layer, NOAA
climate normals, EPA AirNow) for license + bake-ability. Pick one approach per axis
(source new data, or a documented coarse approximation — design-discussion §4 Risk #4
gives both options explicit sign-off).
Extend `scripts/build-data.ts` and `lib/severity/score` with the two new sub-layers.
Extend unit tests with the remaining oracle-table assertions that specifically require
this layer (Carlsbad, Mesa). This is also where the colorblind-safe, multi-series palette
(design-discussion Risk #5) gets finalized, using the `dataviz` skill's method, since by
now the map needs to render both combined and per-allergen views clearly.

### Slice 7 — Agent-controllable URL state
`lib/url-state.ts` — serialize/deserialize `{panel, toggles, timeframe}` to/from URL
query params (e.g. `?panel=...&allergens=grass,ragweed&t=2026-04`). Wire `AllergenPicker`,
`AllergenToggle`, and `TimeframeControl` to read/write this on change, so the URL is
always a live mirror of the current view (shareable link "for free").

### Slice 8 — About/story pages
`/about` route with two tabs, sourced from `docs/story/ABOUT.md` (general/project) and
`docs/story/MY-STORY.md` + `WHY-THIS-EXISTS.md` + `IMMUNOTHERAPY.md` (personal journey).
Delegates to `/design` (per plan's UI-detection step) to produce **2 layout variants**
for the tabs (per user's A/B request) — user picks the winner, or both ship behind a
simple query-param/flag. Image placeholders (`[drop pic here: ...]`) render as visible
placeholder blocks, not silently dropped.

### Slice 9 — Full E2E hardening + CI
Complete Playwright suite: load author preset → assert fill colors match the full oracle
table's bands; per-allergen toggle assertions; timeframe assertions; click-through content
assertions (no ragweed/cedar/mold listed as "your hits" for the author's negative
allergens). Guardrail tests: zero network requests off-origin on the core map path;
`secret_scan` grep across the built client bundle. GitHub Actions workflow running
`pnpm test` + `pnpm test:e2e` on every push, matching `docs/E2E-TESTING.md`'s stated plan.

## Part 3 — File manifest (proposed)

```
allergy-locator/
├── app/
│   ├── page.tsx                    # main map view (Slices 2-7)
│   ├── about/page.tsx               # Slice 8
│   └── api/pollen/route.ts          # optional live toggle (pre-existing scope, untouched by this epic unless requested)
├── components/
│   ├── UsMap.tsx                    # Slice 2, extended through 4/5
│   ├── AllergenPicker.tsx           # Slice 3
│   ├── AllergenToggle.tsx           # Slice 4
│   ├── TimeframeControl.tsx         # Slice 5
│   ├── StateDetailPanel.tsx         # Slice 2 (click-through)
│   └── DisclaimerFooter.tsx         # Slice 1
├── lib/
│   ├── severity/
│   │   ├── gate.ts                  # Slice 2
│   │   ├── score.ts                 # Slice 2 → 4 → 5 → 6
│   │   └── palette.ts               # Slice 6 (colorblind-safe, multi-series)
│   ├── panel-schema.ts              # Slice 3 (also v2's future target schema)
│   ├── panel-import.ts              # Slice 3
│   ├── app-state.ts                 # Slice 3
│   └── url-state.ts                 # Slice 7
├── scripts/
│   └── build-data.ts                # Slice 2, extended in Slice 6
├── data/
│   ├── severity-model.json          # generated, Slice 2 + 6
│   └── presets/author.json          # Slice 2 (derived panel, no raw medical docs)
├── tests/
│   ├── severity.test.ts             # Slices 2, 4, 5, 6
│   ├── data-integrity.test.ts       # Slice 1 skeleton, filled Slice 2+
│   └── e2e/*.spec.ts                # Slice 9
└── .github/workflows/ci.yml         # Slice 1 skeleton, completed Slice 9
```

Existing, untouched-by-this-epic files: `REQUIREMENTS.md`, `README.md`,
`.pHive/planning/*.md`, `docs/*.md`, `data/species-ranges.json`,
`data/allergen-map-data.md`, `data/us_states.svg`, `data/us_state_paths.json`,
`data/dataset2_tilegrid.json`, `LICENSE`.

## Part 4 — Risk Registry

| # | Risk | Severity | Likelihood | Mitigation | Story/slice |
|---|---|---|---|---|---|
| R1 | Severity formula is unvalidated, novel logic | High | High | Table-driven unit tests from the E2E oracle, built alongside (not after) the engine | Slice 2, 4, 5, 6 |
| R2 | Scope creep across a 3-phase roadmap | Medium | Medium | v1/v2/v3 split restated in every artifact; v2/v3 kept out of this epic's stories | All (process) |
| R3 | Turf/irrigation/arid-weed data may not exist in an open, embeddable form | Medium | Medium | Dedicated research step in Slice 6; explicit fallback to a documented approximation if no dataset is found | Slice 6 |
| R4 | Colorblind-safe, multi-series (per-allergen) palette is harder than a single scale | Medium | Low | Use `dataviz` skill's validated palette method, finalized once toggle views exist | Slice 6 |
| R5 | No CI until late would let regressions accumulate silently | Medium | Low (mitigated by sequencing) | CI skeleton lands in Slice 1, completed in Slice 9 — not built from scratch at the end | Slice 1, 9 |
| R6 | Climatological-outlook interpretation of "forecast" may not match user's mental model once they see it | Medium | Medium | Explicitly flagged as iterative in design-discussion §6 item 3; user has already accepted "we'll have to play with this" | Slice 5 |
| R7 | Panel schema (Slice 3) becomes a de facto contract for v2's agentic parsing | Medium | Medium | Document the schema explicitly and treat changes to it as breaking, even though v2 doesn't exist yet | Slice 3 |
| R8 | Tooling readiness (Slice 0) picks skills that turn out unnecessary or redundant with existing Playwright MCP | Low | Medium | Smoke-test each enabled skill before relying on it; explicitly compare `webapp-testing` skill vs. existing Playwright MCP before adopting both | Slice 0 |
| R9 | `/design`'s two-variant A/B request for the about page doubles that story's effort | Low | High (by design) | Accepted tradeoff — user explicitly asked for 2 variants; scope the story for it up front rather than treating it as scope creep later | Slice 8 |
| R10 | Community (skills.sh) skill install mechanism/maintenance status may have changed since this plan's research pass | Low | Medium | Verify live at Slice 0 execution time rather than trusting this plan's point-in-time summary | Slice 0 |

## Part 5 — Elicitation (team stress-test)

**Q1: Is Slice 2 (static map, hardcoded profile) actually deployable/demoable, or is it
"fake done"?**
A: Deployable. It's a real Next.js page reading real baked data through a real scoring
function — the only simplification is a hardcoded panel instead of user input, which
Slice 3 removes. This satisfies the vertical-slice invariant.

**Q2: Does sequencing turf/arid-weed data (Slice 6) after toggle/timeframe (Slices 4-5)
risk having to redo those slices once the fuller model lands?**
A: Low risk — `lib/severity/score` is designed from Slice 2 as a function of
`(panel, state, timeframe) -> per-allergen scores`; Slice 6 adds new *inputs* to that
function's internals, not a new signature. Toggle/timeframe UI (Slices 4-5) consume the
function's output shape, which doesn't change.

**Q3: Is it safe to build Slice 7 (URL state) before Slice 6 (full data model) lands?**
A: Yes — Slice 7 depends on Slice 5 (full state shape: panel + toggles + timeframe), not
on Slice 6's data completeness. Serializing "what's selected" doesn't require the
severity numbers themselves to be final.

**Q4: What happens if the Slice 6 research step finds no usable open dataset for turf/
irrigation?**
A: Design-discussion §4 Risk #4 already authorizes a fallback: a documented, explicitly-
labeled approximation derived from data already on hand (e.g., a coarse climate-zone
proxy). This is a real, planned outcome, not a blocker — the story's acceptance criteria
should accept either resolution.

**Q5: Does the "two design variants" request for Slice 8 conflict with `/design`'s
normal one-variant handoff contract?**
A: No — `/design` can be asked to produce multiple variants in one delegation; this is
recorded as an explicit instruction on that story (R9), not a deviation from the atomic
`/design` boundary.

**Q6: Is there a risk the E2E oracle table itself is wrong (i.e., the "answer key" has an
error), and the team just builds to match a bug?**
A: Real risk, but mitigated by construction: the oracle table comes from the project
owner's own lived, dated reactions (`docs/E2E-TESTING.md`), not a derived or guessed
source — it's ground truth by definition for this project's stated purpose. If a
computed score doesn't match, the fix is almost always the model, not the oracle;
this should still be sanity-checked case-by-case, not assumed automatically in either
direction.

**Q7: Does Slice 0's tooling work risk becoming its own mini-epic (evaluating dozens of
skills.sh candidates)?**
A: Scoped down deliberately — the vertical-plan and this outline name a short, specific
candidate list (frontend-design, webapp-testing, dataviz already-available, shadcn,
vercel-react-best-practices) rather than "survey the whole ecosystem." The story should
timebox evaluation, not exhaustively try every candidate on skills.sh.

## Part 6 — Decisions for sign-off
1. **Slice order** (0 tooling → 1 scaffold → 2 static map → 3 profile input → 4 toggle →
   5 timeframe → 6 turf/arid-weed → 7 URL state → 8 about pages → 9 E2E hardening) —
   affirm or reorder?
2. **Slice 8 parallelizable** alongside Slices 2-7 at execution time — affirm?
3. **Risk Registry** (Part 4) — any risk under- or over-stated?
4. **Elicitation answers** (Part 5) — any answer you'd push back on?
5. Ready to proceed to story decomposition (Phase C) on this basis?
