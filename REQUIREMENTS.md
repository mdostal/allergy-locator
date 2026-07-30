# Allergy Locator — Requirements & Architecture

## What it is
An open-source, interactive US map. You pick your allergens (or load an allergy-panel profile), and the map colors the country **good → bad for you** based on where your specific allergen species actually grow (and their pollen-season severity). Click any state/region to see what's in its air. Fills the gap nothing else does: *"given MY sensitivities, where in the US is best/worst for me?"* (Verified: no existing tool does this — everything else is "current pollen near you," the reverse.)

## Principles / hard constraints
- **Fully open source (MIT), public repo `github.com/mdostal/allergy-locator`.** Assume every file is public — **no secrets, ever.**
- **Cost ≈ $0.** Vercel **hobby** plan; static-first; open data baked at build time; any runtime function cached + within free tier.
- **Publicly available**, no login for the core tool. Directional, **not medical advice** (disclaim throughout).

## Data (all open; nothing proprietary in the client)
- **Core (ZERO keys): USDA PLANTS** species→US-state ranges + **GBIF** occurrence — **pre-baked to static JSON at build time**, committed to `data/`. No runtime API call, no key, for the core map. (USDA = public domain; GBIF = CC-BY, attribute.)
- **Severity / season shading:** Anderegg 2021 (PNAS) + Zhang-Steiner 2022 (Nat. Comms.) — static, open-access, attribute.
- **⭐ Urban/planted-grass weighting (from real-world validation):** native range isn't enough — Mathew reacts to **irrigated / maintained / planted grass** (lawns, parks, desert suburbs) even in "low-allergen" regions. The model must flag developed/irrigated turf, not just native species ranges.
- **Reference/QA only — NOT embedded (reuse restricted):** AAAAI/NAB, BONAP. Link, don't ship.
- **Optional "live current conditions" toggle:** Google Pollen API — see Key Safety. **Off by default;** the core tool works fully without it.

## 🔑 Key safety (the open-source non-negotiable)
- Core needs **no keys** (static open data).
- The **only** key (Google Pollen, optional) lives **exclusively in a Vercel Environment Variable**, read **only** by a **serverless function** (`/api/pollen`) that proxies + caches. The key is **never** shipped to the browser and **never** committed.
- `.env*` gitignored; `.env.example` documents variable names with **no values**. No key in client code, no key in the repo, ever. All third-party listening/pulling happens **server-side on Vercel only.**

## Map
- US overlay — state-level (inlined SVG states or tile-grid — decide in kickoff), color-scaled good→bad for the selected profile. Click a state → its allergen species + season + your-hits.
- Self-contained geometry (inlined, no external map CDN — respects CSP + works offline).

## Stack / deploy
- **Next.js** (Vercel-native): SSG for the static map/data; one optional serverless route (`/api/pollen`) for the live toggle.
- **Deploy:** Vercel, mdostal **hobby** plan, auto-deploy on push to `main`.
- **Cost:** static SSG = free; serverless only on the optional toggle, daily-cached to stay in free tier.

## Build pipeline
- Build-time script pulls/normalizes USDA + GBIF → `data/*.json` (committed) → app has **zero runtime data-fetch** for the core.
- Kicked off + planned + executed via **plugin-hive** (firefly-events.github.io/plugin-hive): kickoff → plan (epics/stories) → execute.

## OSS hygiene
LICENSE (MIT) · README (what it is + attribution + "not medical advice") · CONTRIBUTING · `.env.example` · data-source attribution + disclaimers throughout.
