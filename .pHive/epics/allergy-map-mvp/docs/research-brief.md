# Research Brief — Allergy Locator: Interactive Map MVP

## Scope of this research
Codebase-only pass. `.pHive/project-profile.yaml` and the existing `REQUIREMENTS.md` /
`.pHive/planning/architecture.md` / `docs/MODEL-NOTES.md` already represent a substantial
prior research + validation effort (data sourcing, coloring model, real-world road-trip
QA). This brief synthesizes that existing work against the current, expanded ask rather
than re-deriving it.

**Context7 / web validation:** not run this pass. No new third-party library or SDK is
being introduced beyond what's already decided in `architecture.md` (Next.js, TypeScript,
d3-geo, pnpm, optional Google Pollen API). If a story later needs an unfamiliar library
(e.g., a specific PDF-parsing package for panel upload), that story's `research` step
should validate it directly — flagged as an open risk below.

## Current repo state (verified by direct read, 2026-07-30)
- **No application code exists yet.** No `package.json`, no `app/`/`src/`, no `scripts/`.
  This is a from-zero build on top of already-verified data and docs. `node v22.9.0` and
  `pnpm 8.15.5` are available locally.
- **Data already committed and verified** under `data/`:
  - `species-ranges.json` — USDA PLANTS species→state presence, keyed by common species
    name (e.g. `"Bermuda grass"`) → array of 2-letter state codes (DC included). Header
    metadata documents source + the dropped Live-oak-UT anomaly. Presence-only; this is
    explicitly the **gate**, not the color, per `MODEL-NOTES.md`.
  - `us_state_paths.json` — per-state SVG path data, `viewBox "0 0 960 600"`,
    `d3.geoAlbersUsa` composite projection (AK/HI inset, PR excluded). This is the
    interactive map's native geometry format.
  - `us_states.svg` — the same geometry as a standalone inlined SVG file.
  - `dataset2_tilegrid.json` — a `{state: [col, row]}` grid-position map, described in
    architecture.md as a "tile-grid fallback layout" (alternate/cartogram-style
    rendering, not yet decided whether it ships).
  - `allergen-map-data.md` — large (737-line) raw reference dump: species→state presence
    JSON blocks plus supporting notes, the source material `species-ranges.json` was
    distilled from.
- **Coloring model is fully specified, not yet implemented** (`docs/MODEL-NOTES.md`):
  presence (gate) vs. severity (color) split; severity = grass-season length × intensity
  × climate + planted/irrigated turf weighting + an arid-Southwest chenopod/amaranth
  weed+dust layer. No `severity-model.json` or scoring function exists yet — this is
  pure spec, the single highest-risk/highest-value piece of new logic in the epic.
  Architecture.md flags **"exact severity-scoring formula + weights"** as an explicitly
  open decision for `/plan`.
- **E2E test oracle is fully specified, not yet implemented** (`docs/E2E-TESTING.md`):
  a named fixture (`data/presets/author.json`, not yet created) plus a table of 8
  place→expected-band assertions (Coconino green, Carlsbad not-green, Mesa
  moderate/elevated, etc.) meant to be the literal test data. This directly answers the
  user's ask to "get my allergy tests in there and use them for e2e testing... verifying,
  and telling the story."
- **Story/narrative content already drafted** under `docs/story/`: `ABOUT.md`,
  `WHY-THIS-EXISTS.md`, `MY-STORY.md`, `IMMUNOTHERAPY.md`, plus an `assets/` folder with a
  placeholder README for images not yet supplied. These are markdown source, not yet
  wired into any UI page — the user's ask to "tell the story from the about and such"
  means these need an actual `/about` (and likely `/story`) route, not just files in
  `docs/`.
- **No upload/manual-panel-entry code exists.** `product-brief.md` currently scopes
  "select allergens from the known set" as P0 and "upload/parse a panel PDF" as P2. The
  user's new request explicitly asks for upload of "allergy reports and their own
  allergy maps" as part of this pass — this pulls a P2 item forward and is called out as
  a scale/scope question for the design discussion.
- **Hive config already tuned for this project**: `hive.config.yaml` sets
  `planning.collaborative_review: false` (solo review — the user is the sole gate) and a
  `secret_scan: required` quality gate (the one hard gate: no key/token may land in the
  repo or client bundle). No `task_tracking` adapter is configured, so Phase D (tracker
  publishing) will be a no-op for this epic — story YAMLs on disk are the source of
  truth. No `.pHive/cross-cutting-concerns.yaml` exists yet.
- **`.gitignore` does not currently ignore `.pHive/`** at all — the whole directory,
  including future epic docs, is tracked normally. The plan skill's default `.gitignore`
  allowlist maneuver (step 0b) is a no-op here; nothing needs allowlisting.
- **Repo is a public GitHub remote** (`git@github.com:mdostal/allergy-locator.git`) with
  two prior commits (initial scaffold + story/backstory docs). No CI configured yet
  (`docs/E2E-TESTING.md` calls for GitHub Actions wiring `pnpm test` + `pnpm test:e2e`,
  not yet present).

## Key constraints carried forward (non-negotiable, from REQUIREMENTS.md / architecture.md)
1. **Zero cost.** Vercel hobby, static-first, no runtime data-fetch for the core map.
2. **Zero secrets in repo or client bundle.** The one optional key (Google Pollen) lives
   only as a Vercel env var read by a serverless proxy — never shipped to the browser.
3. **No login, no accounts, no tracking, no backend database** for the core tool. Any
   upload/manual-panel feature must stay client-side (browser storage / URL-encoded
   permalink), not a server-persisted account system — this directly shapes how the
   "upload your own allergy maps" ask should be scoped.
4. **State-level resolution only** for MVP (no county/ZIP).
5. **Severity, not presence, drives color** — this is the single most important
   correctness invariant in the whole project (see MODEL-NOTES.md's "presence ≠
   severity" framing) and the thing the E2E oracle exists to verify.
6. **"No place cures you"** is a content invariant, not just a visual one — the legend,
   copy, and about/story pages must never imply a location fully eliminates symptoms
   (`docs/E2E-TESTING.md`, `docs/story/MY-STORY.md`).
7. **Directional, not medical advice** — disclaimer required throughout, including any
   upload/report-reading feature (must not be framed as diagnostic).

## Gaps / open questions surfaced for design discussion
- **Upload scope.** Is "upload your allergy report" MVP-in-scope now (parse a PDF/image),
  or should MVP ship with manual allergen selection + a structured JSON/CSV import
  (much lower risk, no PDF/OCR dependency), with PDF parsing deferred? This is a real
  scale driver — PDF/report parsing pulls in new untrusted-input handling and a new
  dependency surface that doesn't exist anywhere in the current spec.
- **"Their own allergy maps" upload** — the user's ask includes uploading not just a
  panel but "their own allergy maps." Needs a definition: is this a second saved
  profile, a shareable permalink (already P2 in product-brief), or literally re-uploading
  a previously-exported map state? Flagged as an open question for the user.
  Interpretation used going into design discussion: users can create/save more than one
  named profile client-side (e.g., "mine" vs. "partner's") and switch between them —
  distinct from generating a shareable permalink, which is a separate, already-scoped P2
  item.
- **Live "impact by time" (seasonality).** The user's ask says "figure out areas of
  impact **and times**." The severity model already carries season-length/window data
  per state; the gap is surfacing a time dimension in the UI (e.g., a month selector or
  season-window display on click-through) rather than just a single static score. This
  is new UI surface not explicit in product-brief.md P0 and needs a design-discussion
  answer.
- **Data pipeline automation.** `scripts/build-data.ts` is named in architecture.md but
  doesn't exist. Given the user's "the data is all live and free from a ton of US
  resources" framing, confirm whether additional live sources beyond USDA+GBIF+Anderegg/
  Zhang-Steiner are wanted for v1, or whether the already-verified, already-committed
  dataset is sufficient and "live" refers to the optional Google Pollen toggle only.
- **Styling decision** (Tailwind vs. CSS modules) is still explicitly open per
  architecture.md — needs to be settled in this plan.
- **`data/presets/author.json` privacy boundary.** `docs/E2E-TESTING.md` is explicit that
  the derived preset (allergen selections + notes) ships in the repo but raw test PDFs/
  medical records must not. This must be enforced as a concrete acceptance criterion, not
  just documentation, given the "assume every file is public" hard constraint.
