# Grill Record — allergy-map-mvp

**Source draft:** `.pHive/epics/allergy-map-mvp/docs/design-discussion.md`
**CONTEXT.md substrate:** present
**inconsistency_risk_signals:** absent (research brief does not carry this field — heuristic pass against draft + CONTEXT.md + existing repo docs)
**round_number:** 1
**unresolved_count:** 3
**Generated:** 2026-07-30T00:00:00Z

## Summary

- Vocabulary mismatches: 1 finding
- Hidden assumptions: 1 finding
- Unresolved tensions: 1 finding
- Convention violations: clean
- Posture mismatches: not applicable (planning document, no skill/execution architecture proposed)

## Vocabulary mismatches

- **V1** — Draft uses "profile" throughout (§2 item 5, §6 Q1/Q2) but `.pHive/CONTEXT.md`'s
  canonical glossary term is **"Panel"** ("a person's allergy test result; the tool colors
  the map against the user's selected panel"). `product-brief.md` also uses "profile."
  Both terms are pre-existing in repo docs, but the draft doesn't pick one as canonical
  going forward into story-writing, where inconsistent terminology across story YAMLs
  (`panel` vs `profile` vs the new "multiple named profiles/maps") will make the
  self-containment rule harder to satisfy cleanly.
  - Draft location: §2 item 5 ("Profile input"), §6 Q1/Q2
  - Reference: `.pHive/CONTEXT.md` §Terminology → "Panel"
  - Question for planner: pick one canonical term (recommend keeping CONTEXT.md's
    "panel" as the data concept, and using "profile" only for the saved/named UI
    construct that wraps one or more panels) and state it explicitly so stories inherit
    consistent vocabulary.

## Hidden assumptions

- **H1** — §2 item 1 recommends Tailwind "fast to get a polished, colorblind-safe UI"
  without grounding — colorblind-safety is a property of the chosen color **palette**,
  not of the CSS tooling (Tailwind vs. CSS modules produce identical accessibility
  outcomes; the palette choice is orthogonal and already separately risk-flagged in §4
  Risk #5). Bundling them implies Tailwind itself buys accessibility, which it doesn't.
  - Draft location: §2 item 1
  - Why this matters: if the styling decision (§6 Q5) is made partly on this false
    premise, the actual accessibility work (palette selection) could get skipped as
    "already handled by Tailwind."
  - Question for planner: decouple the two — state the Tailwind-vs-CSS-modules
    recommendation on its own developer-ergonomics merits, and keep the colorblind-safe
    palette as its own explicit story/acceptance-criterion regardless of styling choice.

## Unresolved tensions

- **U1** — §2 item 2 (Data pipeline) states "Zero new external calls — everything needed
  for v1 severity scoring is already committed and verified in `data/`." §4 Risk #4
  states the opposite for two of the three severity sub-layers: "Turf/irrigation and
  arid-weed layers have no existing dataset baked in yet... may require additional open-
  data sourcing... beyond what's currently in `data/`." These two statements directly
  contradict each other on whether the data pipeline is a pure-normalization job or has
  an open sourcing dependency.
  - Draft location: §2 item 2 vs. §4 Risk #4
  - Tension: is the v1 severity model buildable entirely from already-committed data
    (grass/weed/tree species-range presence only), or does it require sourcing new
    open data (irrigated-land / cropland-data-layer, aridity index) before the turf and
    arid-weed axes described in `docs/MODEL-NOTES.md` can actually be implemented?
  - Question for planner: reconcile before story-writing — either (a) confirm a v1
    approximation of turf/arid-weed exists in already-committed data (e.g., derivable
    from state-level climate proxies without a new dataset) and narrow §4 Risk #4
    accordingly, or (b) accept that new data sourcing is required and correct §2 item 2's
    "zero new external calls" claim to scope it to the *presence* layer only, with the
    turf/arid-weed sourcing carved out as its own explicit research-bearing story.

## Convention violations

Clean — no findings. The draft's non-negotiables (§7) correctly restate the project's
existing hard constraints (zero cost, zero secrets, no login/accounts/tracking,
state-level only, severity-not-presence, "no place cures you," directional-not-medical)
without contradicting `hive.config.yaml` or `REQUIREMENTS.md`.

## Posture mismatches

Not applicable — this is a product design discussion, not a skill/architecture proposal;
no atomic-skill or composability posture is implicated.

## Notes

The draft is unusually well-grounded for a first-pass design discussion because most of
the underlying research (data sourcing, coloring model, E2E oracle) was already done and
verified in a prior session, before this epic existed. The three findings above are real
but narrow — none invalidate the overall approach or scale assessment (Large stands).

## Out of scope (this pass)

Grill does not propose solutions, score quality, gate work, or prioritize findings. Each
finding above ends with a question for the planner; resolving V1/H1/U1 is the technical
writer's job before this document is presented to the user.
