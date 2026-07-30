# Structured Outline v2 — Allergy Locator (re-plan, round 3, comprehensive-allergen scope)

Supersedes the v1 structured outline. Builds on `design-discussion.md` v3,
`horizontal-plan.md` v2, `vertical-plan.md` v3 (12 slices, 0-11).

## Part 1 — Scope recap
Comprehensive, data-driven, general-purpose allergy map. Two modes (raw overlay,
personalized composite), full time dimension (season scoring, year playback, reports).
Grass is the flagship validated example; every other sourced allergen (including mold)
is modeled, honestly labeled. Allergen list is always data-driven, never hardcoded.

## Part 2 — Detailed approach per slice

**Slice 0 (tooling), Slice 1 (scaffold):** unchanged from prior rounds — see prior
story files' detail; re-run as-is (Slice 0's teammate previously failed mid-run).

**Slice 2 — Mode 1, grass-only, data-driven loop.** `lib/allergens/registry.ts` defines
a typed but data-populated structure (e.g. an array/map loaded from a JSON file, not
inline enum literals) with exactly one entry (grass) to start. `components/
AllergenToggleList.tsx` renders by mapping over the registry — never a hardcoded
`<Toggle label="Grass">`. `lib/severity/gate.ts` + `score.ts` reuse `allergy-scores.json`
directly for this one entry. `components/UsMap.tsx` renders the 168-city point map,
color bound to the active toggle's values. This slice's real deliverable is proving the
loop-based pattern holds end to end, not the grass feature itself (already done in
`allergy-scores.json`).

**Slice 3 — Comprehensive allergen + mold data sourcing.** Own `research` step:
survey open sources for (a) expanded grass/weed/tree species beyond the current 15
(USDA PLANTS covers this — same source as `species-ranges.json`, just query more
species), and (b) mold — spore/humidity data. Candidates to validate, not assume:
NOAA/EPA humidity and climate normals as a modeled-proxy input (mold growth correlates
with humidity + temperature + precipitation), academic mold-aerobiology literature for
a general model shape, university extension service spore-count publications (check
license before treating as embeddable — many mirror NAB restrictions). If no open
mold-count dataset is embeddable, build a documented, labeled proxy model from
humidity/climate data rather than leaving mold out. Output: an extended
`data/allergens.json` (or extension of `species-ranges.json`) with every sourced
allergen, each carrying a `confidence: validated | modeled` field and a `category:
grass | weed | tree | mold` field.

**Slice 4 — Mode 1, all sourced allergens.** Extend `lib/allergens/registry.ts` to load
from Slice 3's full dataset. `AllergenToggleList` needs no changes (already loop-based
from Slice 2) — this is the pattern paying off. `lib/severity/score.ts` generalizes
`gen_spine.py`'s method per category (grass: reuse validated formula; weed/tree: same
presence×season×climate principle, modeled; mold: humidity/climate-driven formula from
Slice 3's research). Palette: one distinct hue per allergen via the `dataviz` skill,
scalable to however many allergens exist (don't hand-pick N colors for a fixed N).

**Slice 5 — Mode 2, personalized composite.** `components/SensitivitySliders.tsx`
loops over the same registry as Slice 4's toggles. `lib/severity/composite.ts`:
`compositeFor(sensitivities: Record<AllergenId, number>, city, timeframe) -> number`,
weighting each active allergen's Slice-4 value. Author's-example loader populates the
sliders from a preset matching the original grass-dominant panel (now expressed as
slider values, not a hardcoded profile object).

**Slice 6 — Season-position scoring.** Own `research` step: operationalize
`MODEL-NOTES.md`'s cited season-length sources (Anderegg 2021, Zhang-Steiner 2022) plus
Köppen-zone seasonality into a month-indexed curve per category; mold's curve comes
from Slice 3's humidity-driven model instead. Extend `severityFor`/`compositeFor` with
a `timeframe: Month` parameter. `components/TimeframeControl.tsx`: a month selector.

**Slice 7 — Year playback.** `components/YearPlayback.tsx`: steps `TimeframeControl`
through all 12 months on an interval, re-rendering `UsMap` each step. Play/pause/speed
controls. No new scoring logic — pure UI animation over Slice 6's data.

**Slice 8 — Reports.** `lib/reports/generate.ts`: given the active composite
configuration, compute best month+city, worst month+city, and notable seasonal windows
across all 168 cities × 12 months. `components/ReportPanel.tsx` renders it.

**Slice 9 — Agent-controllable URL state.** `lib/url-state.ts`: serialize `{mode,
allergenState: Record<AllergenId, number|boolean>, timeframe}` — encode as a compact
string (not one query param per allergen) since the allergen count is now open-ended.
Parallel-eligible against Slices 7-8 (bounded-slice: `lib/url-state.ts` +
control-wiring only).

**Slice 10 — About/story pages.** `/about` route, tabbed, both `ABOUT.md`/`ABOUT-v2.md`
behind an in-page toggle component. `/design` delegation for the layout pass (2
variants of the tab layout itself, per the original round-1 ask — separate from the
content-toggle, which is now a fixed requirement, not a design choice).

**Slice 11 — E2E hardening + CI.** Playwright: grass ground-truth (multi-timeframe) from
`MY-ANSWER.md`; presence/plausibility checks for every other allergen; playback smoke
test; report-generation smoke test; guardrails (zero external calls, `secret_scan`);
CI on every push.

## Part 3 — File manifest (proposed, additive to prior rounds' shape)

```
allergy-locator/
├── app/
│   ├── page.tsx                       # main map view (Slices 2-9)
│   ├── about/page.tsx                  # Slice 10
│   └── api/pollen/route.ts             # pre-existing optional scope, untouched
├── components/
│   ├── UsMap.tsx                       # Slice 2, extended through 9
│   ├── AllergenToggleList.tsx          # Slice 2 (data-driven loop), extended Slice 4
│   ├── SensitivitySliders.tsx          # Slice 5
│   ├── TimeframeControl.tsx            # Slice 6
│   ├── YearPlayback.tsx                # Slice 7
│   ├── ReportPanel.tsx                 # Slice 8
│   ├── StateDetailPanel.tsx            # Slice 2 (click-through)
│   └── DisclaimerFooter.tsx            # Slice 1
├── lib/
│   ├── allergens/
│   │   └── registry.ts                 # Slice 2 (one entry) → Slice 4 (all sourced)
│   ├── severity/
│   │   ├── gate.ts                     # Slice 2
│   │   ├── score.ts                    # Slice 2 → 4 → 6 (timeframe param)
│   │   ├── composite.ts                # Slice 5
│   │   └── palette.ts                  # Slice 4 (dataviz-driven, scalable)
│   ├── reports/generate.ts             # Slice 8
│   └── url-state.ts                    # Slice 9
├── scripts/
│   ├── gen_spine.py                    # existing, grass-only — untouched
│   └── source_allergens.py (or .ts)    # Slice 3, new — comprehensive sourcing
├── data/
│   ├── cities.json                     # existing — untouched
│   ├── allergy-scores.json             # existing grass scores — untouched
│   ├── allergens.json                  # Slice 3 — comprehensive dataset, new
│   └── presets/author.json             # Slice 5 — slider-based flagship preset
├── tests/
│   ├── severity.test.ts                # Slices 2, 4, 5, 6
│   ├── data-integrity.test.ts          # Slice 1 skeleton, filled Slice 3+
│   └── e2e/*.spec.ts                   # Slice 11
└── .github/workflows/ci.yml            # Slice 1 skeleton, completed Slice 11
```

## Part 4 — Risk Registry

| # | Risk | Severity | Likelihood | Mitigation | Slice |
|---|---|---|---|---|---|
| R1 | Non-grass severity formulas are new, unvalidated modeling work | High | High | `confidence: validated\|modeled` labeling; honest E2E scope (Slice 11) | 4, 6 |
| R2 | Mold has no open, embeddable count-data source (NAB restricted) | High | Medium | Dedicated research step (Slice 3); documented humidity-proxy fallback | 3 |
| R3 | "All allergens there's data for" scope could expand indefinitely | Medium | Medium | Bounded by real open-source availability, not planner curation (Slice 3 research step has a defined output, not an open-ended search) | 3 |
| R4 | Season-position modeling is new work, not free from existing data | High | High | Dedicated research step (Slice 6); don't assume it falls out of `allergy-scores.json` | 6 |
| R5 | Data-driven-loop architecture (§7) regresses if a later slice hardcodes a shortcut | Medium | Medium | Slice 2 proves the pattern first with one entry; code review checklist item across Slices 4-9 | 2, 4-9 |
| R6 | Comprehensive allergen × slider × timeframe state is large for URL serialization | Medium | Medium | Compact/encoded param scheme (Slice 9), not one param per allergen | 9 |
| R7 | "Play the year" + reports scope creep if built as one feature | Medium | Low | Three independent sub-slices (6, 7, 8), each shippable alone | 6-8 |
| R8 | Palette needs to scale to an unknown allergen count, not a fixed N | Low | Medium | `dataviz`-skill-driven scalable palette generation (Slice 4), not N hand-picked colors | 4 |
| R9 | 168-city granularity reads as "thin" to users expecting their exact town | Low | Medium | Honest "nearest of 168 reference cities" framing (unchanged from prior rounds) | 4 |
| R10 | Tooling readiness (Slice 0) fails again the way it did before the restart | Medium | Low | Re-run with the same scoped candidate list; verify actual completion (TOOLING.md exists + committed) before marking done | 0 |

## Part 5 — Elicitation (team stress-test)

**Q1: Is Slice 2's "grass-only, but data-driven loop" actually worth a whole slice, or
is it padding?**
A: Worth it. The user's core correction this round was architectural (data-driven,
never hardcoded), not just "add more allergens." Proving the loop pattern holds at N=1
before Slice 3/4 add potentially dozens of entries is cheap insurance against having to
retrofit the UI later — exactly the mistake the user caught in round 3's toggle scoping.

**Q2: What happens if Slice 3's research finds NO viable open mold data and no
reasonable humidity-proxy either?**
A: Not currently authorized as an acceptable outcome to silently drop mold — the design
discussion treats finding *a* path (real source or documented proxy) as the
expectation. If Slice 3 genuinely exhausts both options, that's a finding to bring back
to the user, not a silent scope cut.

**Q3: Does Slice 6 (season-position) risk being harder than estimated, given Risk #4
rates it high-severity/high-likelihood?**
A: Real risk, appropriately flagged, not resolved by wishful thinking. The mitigation
(own research step, don't assume free) is the correct response at planning time; if the
research step comes back saying the literature doesn't support a numeric monthly curve
at the needed precision, that's a legitimate mid-execution escalation back to the user,
same as Q2.

**Q4: Is 12 slices (vs. the original 10) still "simplest first" as the user asked?**
A: Yes — slice *count* isn't the measure of simplicity; each slice is still a thin,
independently-working increment, and the two new/split slices (comprehensive data
sourcing; the mold-aware season model) exist specifically *because* folding them into
larger slices would have hidden real risk rather than surfacing it early.

## Part 6 — Decisions for sign-off
1. **Slice order** (0 tooling → 1 scaffold → 2 grass/loop-proof → 3 data sourcing → 4
   all-allergens → 5 composite/sliders → 6 season → 7 playback → 8 reports → 9 URL
   state → 10 about → 11 E2E) — affirm?
2. **Mold fallback policy** (Q2): if no open data exists, build and clearly label a
   humidity-proxy model rather than dropping mold — affirm?
3. **Risk registry** — anything under/overstated?
4. Ready to proceed to story decomposition?
