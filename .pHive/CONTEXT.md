# CONTEXT.md — Allergy Locator domain glossary

*Populate as the project's vocabulary stabilizes.*

## Terminology
- **Presence gate** — whether an allergen occurs in a state at all (USDA PLANTS). Decides
  what shows on a state's click-through, NOT the color.
- **Severity score** — what drives the color: grass-season length × intensity × climate +
  planted/irrigated turf, plus the arid-Southwest weed/dust layer. See `docs/MODEL-NOTES.md`.
- **Panel** — a person's allergy test result; the tool colors the map against the user's
  selected panel, suppressing allergens they don't react to.
- **Arid-weed layer** — desert chenopod/amaranth (saltbush, pigweed, Russian thistle,
  greasewood) + dust/low-humidity irritant multiplier; the fix so Carlsbad-type zones aren't
  mislabeled "fine."

## Key paths
- `data/species-ranges.json` — USDA species→state presence (Live-oak-UT dropped).
- `data/us_states.svg`, `data/us_state_paths.json` — inlined US map geometry.
- `docs/MODEL-NOTES.md` — the coloring model (the heart of the project).
- `REQUIREMENTS.md`, `.pHive/planning/architecture.md` — reqs + architecture.

## Conventions
- No secrets in repo or client bundle, ever. Static-first; zero runtime fetch for the core.
- Directional, not medical advice.

## Canonical references
USDA PLANTS · GBIF · us-atlas/Census · Anderegg 2021 · Zhang-Steiner 2022.
