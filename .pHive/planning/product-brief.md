# Product Brief — Allergy Locator

## Problem
Every allergen tool answers *"what's the pollen near me right now?"* Nobody answers the
reverse — *"given MY specific allergens, where in the US should I live?"* People price a
move on schools, cost, and commute, but never on the air, even though most of us are
carrying a personalized allergy panel we glanced at once and filed. Allergy Locator turns
that panel into a real relocation filter.

## Target users
- Anyone with an allergy panel (or a rough sense of their triggers) weighing where to live.
- Worked example / first user: the author — a **grass-dominant** profile (grass reacts hard;
  ragweed/cedar/oak/elm/mold negative).
- Public, no login, directional (not medical advice).

## Core features
**P0 (MVP — ship this):**
1. Interactive state-level US map (real geography, inlined SVG, no map CDN).
2. Allergen picker — select your triggers (grasses, weeds, trees) from the known set.
3. **Severity-based coloring** green→red *for your selection* — NOT presence. Grass-season
   length × intensity × climate + planted/irrigated turf, plus the arid-Southwest weed/dust
   layer. (See `docs/MODEL-NOTES.md`.)
4. Click a state → its allergens present + season window + plain-English "why."
5. "Not medical advice" disclaimer throughout.

**P1:**
6. Load-a-profile shortcut (e.g. the author's grass-dominant panel) as a preset.
7. Optional "live current conditions" toggle via a Vercel-server-side Google Pollen proxy.

**P2:**
8. Shareable permalink encoding a selected profile.
9. Upload/parse a panel PDF.

## Success metrics
- A public URL where picking allergens recolors the map and per-state click-through works.
- $0 hosting cost. Zero secrets in repo or client bundle. Fully open (MIT).
- The map matches lived reality: green in the dry high West + cold North for a grass profile,
  red across the warm-humid grass South — and it does NOT color Carlsbad-type arid-weed zones
  as "fine."

## Scope boundaries (out of scope for MVP)
- No accounts, tracking, or backend database.
- No county/ZIP resolution — state-level only.
- No real-time data for the core map (static, build-time-baked).
- No medical claims or personalized medical advice.
