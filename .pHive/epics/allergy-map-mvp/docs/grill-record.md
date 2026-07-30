# Grill Record — allergy-map-mvp (re-plan, round 2 supersedes round 1 below)

**Round 2 pass (against design-discussion v3, post user round-3 direction):**
- **round_number:** 2
- **unresolved_count:** 1
- **Finding (Hidden assumption, H2):** §2 item 2 states season-position modeling uses
  "season-length/timing data already implicit in `MODEL-NOTES.md`'s cited sources" —
  but `MODEL-NOTES.md` discusses season length *qualitatively* (long warm-humid vs.
  short cold-winter), not as numeric month-by-month curves. Framing this as data
  "already on hand" risks underestimating the modeling task.
  - **Resolution:** Risk #2 in the design discussion already treats this as unbuilt work
    requiring its own `research` step (not "falls out for free") — this softens the
    finding to acceptable-as-flagged rather than requiring a rewrite. Carried forward
    as an explicit research-step requirement in the structured outline rather than a
    design-discussion rewrite.

---

# Grill Record — allergy-map-mvp (re-plan, round 1, superseded)

**Source draft:** `.pHive/epics/allergy-map-mvp/docs/design-discussion.md` (v2)
**CONTEXT.md substrate:** present
**inconsistency_risk_signals:** absent (research brief v2 doesn't carry this field — heuristic pass)
**round_number:** 1
**unresolved_count:** 2
**Generated:** 2026-07-30T00:00:00Z

## Summary

- Vocabulary mismatches: clean
- Hidden assumptions: 1 finding
- Unresolved tensions: 1 finding
- Convention violations: clean
- Posture mismatches: not applicable

## Vocabulary mismatches

Clean — no findings. "Panel" (CONTEXT.md's term) is used correctly for the author's real
data; the new "grass sensitivity" control is introduced as a distinct, new concept rather
than redefining "panel," so no drift.

## Hidden assumptions

- **H1** — §2 item 2 claims "confidence is trivially 'measured' for all 168 (hand-
  curated, not interpolated) today." `allergy-scoring.md`'s own "Honest limitations"
  section (cited in the research brief) states the `turf` flag feeding these scores is
  "a hand-set estimate of cultivated-grass intensity, **not a measured land-cover
  figure**." The draft conflates "not spatially interpolated between cities" (true —
  each city gets its own value) with "measured" (overstated — key inputs are curated
  estimates, not measurements).
  - Draft location: §2 item 2
  - Why this matters: if a future confidence-surface UI (per `docs/ROADMAP.md`) reads
    this epic's data model as "high confidence, measured," it will misrepresent the
    honest limitation the scoring doc itself already discloses — undermining the
    project's own "transparent, decomposable, honest about limitations" principle
    (`docs/ROADMAP.md` §Principles) at the exact layer meant to carry it.
  - Question for planner: should the per-city confidence value be something more honest
    than a flat "measured" (e.g., "curated" or a two-tier measured-vs-estimated split
    reflecting which components are hand-set vs. derived from real climate data), even
    while the confidence *surface itself* isn't rendered in v1?

## Unresolved tensions

- **U1** — §0/§1 still cite the project's north star verbatim: "given MY allergens,
  where in the US is best/worst for me" (general, any allergen) as the unchanged
  success bar. §2 item 1 then recommends narrowing v1 to grass-primary scoring, with
  weed/tree as presence-only and explicitly "not blended into the color score." The
  draft doesn't state whether this narrowing is understood to **temporarily** serve the
  general north star (grass now, other categories later, same tool) or represents a
  **permanent** re-scope of what "the tool" means. Both are defensible, but the
  document asserts the north star is unchanged while measurably shrinking what v1
  delivers against it, without saying which framing is intended.
  - Draft location: §0 NORTH STAR vs. §2 item 1
  - Tension: is grass-primary a *phase* of the general-panel vision, or a *redefinition*
    of the vision's near-term scope?
  - Question for planner: state explicitly in the revision — e.g., "grass-primary is
    v1's phase-1-of-the-tool, not a reduced final vision" — so a future reader (or a
    future epic) doesn't have to infer it.

## Convention violations

Clean — no findings. The draft's non-negotiables (§7) correctly carry forward the
project's existing hard constraints without contradicting `hive.config.yaml` or
`REQUIREMENTS.md`.

## Posture mismatches

Not applicable — planning document, no skill/architecture posture implicated.

## Notes

This re-plan draft is unusually well-grounded because it's reconciling against already-
validated, already-documented parallel research rather than greenfield speculation. Both
findings are real but narrow, consistent with a second-pass draft rather than a first
one — neither invalidates the overall approach.

## Out of scope (this pass)

Grill does not propose solutions, score quality, gate work, or prioritize findings. Each
finding above ends with a question for the planner; resolving H1/U1 is the technical
writer's job before this document is presented to the user.
