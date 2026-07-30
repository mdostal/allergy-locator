# Architecture — Allergy Locator

## Decision summary
Static-first Next.js app on Vercel hobby. The core map is 100% static (SSG) — all open
data is normalized and committed at build time, so the browser fetches **no** live data and
needs **no** keys. One optional serverless route proxies the Google Pollen API for a "live
conditions" toggle, with the key held only as a Vercel env var. Everything is public and MIT.

## Stack
- **Framework:** Next.js (App Router), TypeScript, React.
- **Map rendering:** inlined US-states SVG (`data/us_states.svg`, viewBox `0 0 960 600`, 51
  d3-geo `geoAlbersUsa` paths incl. DC). No external map/tile CDN → respects CSP, works
  offline. `data/us_state_paths.json` gives per-state path data for interactivity;
  `data/dataset2_tilegrid.json` is a tile-grid fallback layout.
- **Styling:** lightweight (CSS modules or Tailwind — decide at scaffold). Color scale
  green→red, colorblind-safe.
- **Package manager:** pnpm. **Deploy:** Vercel hobby, auto-deploy on push to `main`.

## Data pipeline (build-time, zero runtime fetch for core)
1. Source data already verified and committed under `data/`:
   - `species-ranges.json` — USDA PLANTS species→state presence (public domain; Live-oak-UT
     anomaly already dropped).
   - `allergen-map-data.md` — reference notes / season + climate inputs.
2. A build-time script (`scripts/build-data.ts`) normalizes these into a single
   `data/severity-model.json` the app imports directly: for each state, a per-allergen
   presence gate + a severity score input (season length × intensity × climate, plus the
   arid-Southwest weed/dust layer).
3. App imports the baked JSON at build → SSG. **No runtime data-fetch, no key, for the core.**

## Coloring model (the heart of it — see `docs/MODEL-NOTES.md`)
- **Gate (presence):** which of the user's selected allergens occur in each state (USDA).
- **Color (severity):** sum/weight each present allergen's season-length × intensity in that
  state's climate. Grass = the dominant axis. **Add the arid-Southwest chenopod/amaranth weed
  load + a dust/low-humidity irritant multiplier** so desert-weed zones (Carlsbad-type) aren't
  mislabeled "fine."
- **Score off the USER's panel, not the public pollen index** — suppress juniper/ragweed/mold
  noise when they're not selected. (Validated: Coconino reads "high" publicly but is clean for
  a grass profile.)
- **Click a state →** user's allergens present + season window + a plain-English "why."

## 🔑 Key safety (open-source non-negotiable)
- Core needs **no keys**. The only key (Google Pollen, optional) lives **exclusively** as a
  Vercel Environment Variable, read **only** by the serverless function `/api/pollen`, which
  proxies + daily-caches. Key is **never** shipped to the browser, **never** committed.
- `.env*` gitignored; `.env.example` documents variable names with no values.
- A `secret_scan` quality gate blocks any key/token from landing in the repo or client bundle.

## Cost model
Static SSG = free on hobby. The serverless proxy runs only when a user flips the live toggle,
daily-cached to stay inside the free tier. Target ≈ $0.

## Attribution / compliance
USDA PLANTS (public domain), GBIF (CC-BY), us-atlas/Census (public domain), Anderegg 2021 +
Zhang-Steiner 2022 (season severity). AAAAI/NAB + BONAP are reference/QA only — linked, not
embedded (reuse restricted). "Not medical advice" throughout.

## Open decisions for /plan
- Styling choice (Tailwind vs CSS modules).
- Exact severity-scoring formula + weights (needs the region-scout agent's output + season data).
- Whether P1 live-toggle ships in v1 or is stubbed behind a flag.
