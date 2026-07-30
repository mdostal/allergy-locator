# E2E Testing — the author's panel is the oracle

> **The side story:** our QA is one real person's actual allergy panel and a cross-country
> road trip used as the answer key. If the map can't reproduce that grass got much better but
> never went away — that a high dry pine forest felt like heaven and a desert town felt like
> hell — it ships broken. We dogfood the tool with the exact data it's meant to serve. That's
> both the honesty of the project and its test harness.

## Why this works as a test oracle
Most map tools can only be eyeballed ("looks plausible"). This one has **ground truth**: a
verified panel + a set of lived, dated reactions from real places. That turns "does the
coloring look right?" into concrete, falsifiable assertions. The map is correct **iff** it
reproduces the author's lived experience — scored off *his* panel, not the public pollen index.

## The fixture — `data/presets/author.json` (the golden profile)
Selected allergens (from the real 2023 panel; see the story in
`/Users/mdostal/Documents/work/compound-content/random/allergy-map/immunotherapy-my-story.md`):
- **Grass — hard:** Bermuda, Bahia, Johnson, perennial rye, cool-season mix. *The dominant axis.*
- **Weeds — moderate:** pigweed/amaranth, lambsquarters, English plantain.
- **Trees — quiet:** faint boxelder only.
- **NEGATIVE (must be suppressible / not penalize him):** ragweed, cedar/juniper, oak, elm, mold.

> Privacy: the preset is a *derived* profile (allergen selections + notes). Raw test PDFs /
> medical records stay OUT of the repo. The preset is all the tool needs.

## Ground-truth assertions (the answer key)
Load the author preset, then assert the rendered map + click-throughs match lived reality:

| Place | Lived reaction | Map MUST show | What it tests |
|---|---|---|---|
| **Coconino / Flagstaff AZ** (~7,000 ft pine) | Amazing, felt great | **GREEN / low** — even though public indices read HIGH (juniper+ragweed, both negative for him) | Scores off HIS panel, suppresses index noise. **Key negative test.** |
| **Carlsbad NM** (SE desert) | Horrible | **NOT green** (elevated) despite light grass | The **arid-Southwest weed/dust layer**. A grass-only model gets this wrong. |
| **Mesa AZ** (Phoenix metro) | Rough | **Moderate/elevated** | **Planted/irrigated turf** axis (overseeded Bermuda/rye). |
| **Kalispell / Flathead MT** | Okay; local spike near maintained turf | **Low–moderate** | Short northern season + micro-siting near managed grass. |
| **Austin TX** (leaving) | Grass-taxed year-round — NOT cedar | Moderate–high from **grass**, and cedar shows negative on click-through | Corrects the local narrative; negative-allergen handling. |
| **Omaha NE** (bridge) | Better than the generic map implies | Better-than-index (ragweed negative removes the big local knock) | Season-length + negative-ragweed. |
| **WY Black Hills / Sundance** (endgame) | Cleanest air | **Greenest tier** | High-dry-West = his easiest air. |
| **Little Rock / Tulsa / AR grass belt** | (Modeled worst-tier) | **RED** | Long warm-humid Bermuda season = worst for a grass panel. |

Click-through assertions: clicking a state lists **his selected allergens present + season
window + a plain-English "why"**, and does **NOT** list ragweed/cedar/mold as "your hits."

## Test tiers
1. **Unit — severity scoring fn.** Given the author panel + a state's season/climate/turf
   inputs → expected score *band*. Table-driven from the answer key above. Fast, no browser.
2. **Data-integrity.** `species-ranges.json` gate matches USDA; Live-oak has no `UT`; every
   selected allergen resolves; no orphan state codes. Runs in CI on every push.
3. **E2E — Playwright.** Against the rendered site:
   - Select the author preset → assert state fill colors fall in the expected bands per the
     table (green-band: WY, high-CO/AZ-pine; red-band: AR, Deep South; NM-not-green).
   - Click Coconino-region + Carlsbad-region states → assert correct allergen lists + "why."
   - **Guardrail tests (the open-source non-negotiables):**
     - **Zero external calls** on the core map — assert no network request leaves the origin
       (CSP / static-only). If the core map phones home, fail.
     - **No secrets in the bundle** — grep the built client output for key/token patterns;
       any hit fails the build. (Mirrors the `secret_scan` gate in `hive.config.yaml`.)

## How to run (once the app exists)
```bash
pnpm test           # unit + data-integrity
pnpm test:e2e       # Playwright against a local build
```
Wire both into CI (GitHub Actions) so every push re-checks the answer key and the
no-secrets / no-external-calls guardrails.

## The "improves, never gone" invariant
The map must **never** color a place pure "safe/cured" green for a grass profile — because the
author's own history says grass got much better on immunotherapy but never fully went away.
Best-case is "low tax," not "zero." The color scale and copy should reflect that: no city is a
cure. This is a *content* invariant as much as a visual one — assert the legend/copy never
promises elimination.
