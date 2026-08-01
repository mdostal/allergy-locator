# Roadmap — Allergy Locator (post-MVP)

Captures what comes **after** epic `allergy-map-mvp` (v1) ships, so the vision isn't lost
in one epic's docs. This file lives at the project level (like `product-brief.md` and
`architecture.md`), not inside the epic's `docs/` folder, so it survives regardless of
that epic's sidecar-retention setting and reads as the standing "what's next" reference
for future `/plan` runs. Locked with the user 2026-07-30, alongside the v1 design
discussion (`.pHive/epics/allergy-map-mvp/docs/design-discussion.md`).

## v1 — this epic (`allergy-map-mvp`), for reference
Interactive severity map (per-allergen toggle + color-coding), climatological
current/timeframe control, manual picker + preset + JSON/CSV panel import (single active
profile), tabbed `/about` page, agent-controllable URL state (no LLM), full E2E harness
against the author's panel. See the epic's own docs for detail — this roadmap starts
where v1 ends.

## v2 — Agentic panel ingestion + verification
**Problem it solves:** JSON/CSV import (v1) still requires the user to manually transcribe
their allergy test results into the schema. Most people have a PDF or a photo of a lab
report, not a hand-filled JSON file.

**Approach:**
1. User pastes or uploads a raw report (text or image) directly in the browser.
2. An LLM call parses it into the **exact same panel schema v1's JSON import already
   uses** — this is why v1's schema needs to be clean and stable, not a throwaway.
3. A **second, independent LLM call verifies** the first pass's extraction against the
   source — checking for fabricated allergens, wrong severities, or misread values —
   before anything is shown to the user or rendered on the map. This is a deliberate
   two-agent generate→verify pattern specifically to catch hallucination in a domain
   (health data) where a wrong number is worse than a missing one.
4. Only a verified panel populates the map. The user sees what was extracted (and can
   correct it) before committing.

**Architecture constraint carried over from v1 (non-negotiable):** the project holds no
LLM API key and pays for no LLM calls — that would break the $0-cost, zero-secrets
posture that everything else in this app is built on. v2 must use a **bring-your-own-key**
model: the user supplies their own LLM provider API key, stored only in their own
browser (never sent to or logged by any project-controlled server), used either for
direct client→provider calls or through a stateless pass-through proxy that never
persists the key. This is the single most important architectural decision for v2 and
should be validated (e.g., against current provider CORS/browser-calling support) before
implementation starts.

**Also in v2:** a documented, agent-friendly control surface beyond v1's URL-state
(§ see below) — likely an MCP server or a small documented HTTP/JS API — so an external
agent (Claude Desktop, a script, a future chat feature) can drive the map
programmatically without needing the in-app parse/verify flow. The `mcp-builder` skill
(official `anthropics/skills`) is the natural tool for this when the time comes.

**Depends on:** v1 shipped and validated; v1's panel schema and URL-state model treated
as a stable contract, not something v2 redesigns from scratch.

## v3 — Multiple saved profiles, sharing, and family overlay
**Problem it solves:** v1 supports exactly one active profile at a time, entered fresh
each visit. Families and couples want to compare or overlay more than one person's map.

**Approach:**
1. Multiple **named, saved profiles**, stored client-side only (browser storage) —
   still no accounts, no backend database, consistent with every non-negotiable this
   project has carried since `REQUIREMENTS.md`.
2. **Save/share** beyond a single-view URL (v1 already gives a shareable URL for one
   configured view; v3 is about persisting and naming multiple such configurations).
3. **Overlay view** — show two or more profiles' severity on the same map at once (e.g.,
   a composite "best-for-everyone" score, or a split/toggle between individual family
   members) so a family can jointly evaluate a place instead of each running the tool
   separately.

**Depends on:** v1's app-state model (already clean/serializable from v1's agent-
controllable-surface work) extended to hold a collection of profiles instead of one.

## Superseded by later work (kept here for history, not current)
- **County/ZIP-level resolution** — was listed below as explicitly out of scope
  ("state-level only... stated scope boundary"). Superseded: a real ~3,143-county
  gradient-densification layer, built from Census/USGS/USDA data, shipped
  post-v1 (`data/county-grid-methodology.md`) as a secondary interpolation-only
  layer alongside the 168 authoritative cities.
- **Daily-resolution season curves** — v1 shipped a 4-climate-zone-group monthly
  model. Superseded post-v1 by a real per-city, day-by-day phenology model driven
  by NOAA 1991-2020 daily climate normals (`data/daily-season-curves-methodology.md`),
  plus a Trip Planner surfacing full day-level forecasting for a chosen date range.

## Explicitly not on this roadmap (revisit only if directly requested)
- Real-time meteorological pollen *forecasting* from a paid provider — cost-prohibitive
  at the project's $0 posture; the climatological daily-normals-driven forecast above
  and the existing optional Google-Pollen "current conditions" toggle are the intended
  ceiling unless the user decides the cost tradeoff is worth it later.
- Accounts, login, or a backend database at any version — every version above is
  explicitly designed to avoid this.

## Tooling readiness note
v1 includes a dedicated "tooling & skill readiness" slice (Slice 0) that enables the
Claude Code skills/plugins this build needs as they come up (frontend design, webapp
testing, dataviz palette work). v2's MCP/agent-API work should similarly pull in
`mcp-builder` when that slice starts, rather than improvising an MCP server from scratch.
