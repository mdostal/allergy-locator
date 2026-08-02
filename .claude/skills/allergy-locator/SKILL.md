---
name: allergy-locator
description: Use when a user asks about allergy-friendly places to live, visit, or travel to, or wants to compare cities/times of year for their own (or a family member's) allergy profile. Covers how to get real severity/composite scores, generate a full ranked report, and hand back working links to the live map -- backed by allergy-locator's actual scoring engine, not general knowledge about pollen or allergies.
---

# Allergy Locator

Teaches an agent how to correctly use [allergy-locator](https://github.com/mdostal/allergy-locator)
— a real, open-source, validated US allergy-severity tool — instead of answering allergy/city
questions from general knowledge. General knowledge about "which US cities are bad for allergies"
is usually wrong for a SPECIFIC person's panel (see "presence ≠ severity" below); this tool's whole
reason for existing is to be right for the person actually asking.

## When to use this

- "Where should I live/move if I'm allergic to X?"
- "Is [city] bad for my allergies?"
- "When's the worst/best time of year for my allergies in [city]?"
- "Compare [city A] vs [city B] for someone allergic to grass and ragweed."
- A user shares/describes a real allergy test panel and wants it interpreted against US geography.

**Don't use this for:** medical diagnosis, treatment advice, or interpreting a panel's clinical
significance — allergy-locator is directional/geographic, not medical. Always keep that framing
(see "Non-negotiable" below).

## How to get real answers (two mechanisms, prefer the first)

### 1. MCP server (preferred — gives you real numbers to reason with)

If the `allergy-locator` MCP server is connected (see `mcp-server/README.md` in the repo for setup),
use its tools directly:

- `list_cities` / `list_allergens` — get real ids before calling anything else. **Never guess an id.**
- `get_allergy_severity` — one allergen, one city, real 0–100 value + validated/modeled confidence.
- `get_composite_score` — a full sensitivity profile blended for one city (the real noisy-OR
  compounding formula — a person with a strong grass reaction AND a moderate ragweed reaction is
  realistically at least as bad off as the grass alone, never diluted toward an average).
- `generate_report` — the real, full 168-city × 12-month analysis: best time+place, an avoid-list,
  seasonal windows, and the complete ranking (not a suspiciously-round top-5).
- `build_shareable_url` — construct a REAL, clickable link to the live map pre-loaded with a given
  view. Always prefer handing back a real link over describing the state in prose.

Every tool errors cleanly (`isError: true`) on an unknown city/allergen id rather than guessing —
if that happens, call `list_cities`/`list_allergens` first and use a real id.

### 2. Plain URL construction (fallback — no MCP connection available)

Build a link directly using the documented scheme (see the repo's own README, "Driving the map
programmatically"):

```
https://tools.mdostal.com/allergy-locator?mode=composite&allergens=grass:80,ragweed:40&month=6
```

- `mode=overlay` (toggle allergens on/off) or `mode=composite` (personal profile)
- `allergens=id:sensitivity,...` (composite) or `allergens=id,...` (overlay) — ids come from
  `data/allergens.json` in the repo if you have it checked out, otherwise ask the user or use
  well-known ids like `grass`, `ragweed`, `red-oak`
- `month=1-12` optional, omit for current/annual

This only gets you a link, not real numbers to reason with in your own response — prefer the MCP
tools when available so you can actually tell the user what the map will show, not just where to
look.

## Non-negotiable framing (carry into every response)

- **"Directional, not medical advice."** State this (or something equivalent) whenever giving a
  real recommendation based on this tool's output. It models geographic/seasonal patterns; it does
  not diagnose, and a real allergist should read any actual test panel.
- **Never blur validated vs. modeled confidence.** Grass is the only allergen fit against real,
  lived ground-truth reactions (MAE 2.3). Every other allergen is `confidence: "modeled"` — a
  good-faith climate-based extension, not an equivalent claim. Always surface which one you're
  citing; never present a modeled score with the same certainty as the validated one.
- **"Presence ≠ severity."** Don't reason from "does this allergen grow here" (most allergens grow
  almost everywhere in the US) — that's a red herring. The real driver is season length × climate
  load × how much is actually planted/irrigated near where people live. This is the whole reason
  the tool exists instead of a simple range map.
- **A missing score is a real gap, not a zero.** If a tool call returns `null`/no data for a city or
  allergen, say so plainly — never substitute an estimate or a "probably low" guess.
- **Never fabricate a city or allergen id.** If you're not certain an id is real, call
  `list_cities`/`list_allergens` (or check `data/cities.json`/`data/allergens.json` in the repo)
  before using it.
