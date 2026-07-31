# Tooling — Claude Code skills/plugins enabled for this repo

Written directly by the orchestrator for story `s0-tooling-skill-readiness`, after four
prior background-teammate attempts failed to complete (session interruptions, not task
failures — see `.pHive/agent-complete/*/complete.json`, all `verdict: failure` /
`verdict_source: missing_marker`, and the 20 `.pHive/interrupts/*.yaml` forced-stop
records spanning this session). Done inline to guarantee completion.

## Enabled and confirmed useful

- **`dataviz`** (bundled, already available) — palette/chart-design method. Directly
  needed for this epic's scalable, colorblind-safe, multi-allergen gradient palette
  (stories s4 onward) — this is the single most load-bearing tool on this list.
- **Playwright MCP** (`mcp__plugin_playwright_playwright__*`, already connected via the
  `playwright@claude-plugins-official` plugin) — browser automation for the E2E suite
  (story s11: both modes, playback, reports, guardrails).
- **`run`** (bundled) — launch/verify the Next.js dev server once scaffolded (story s1
  onward).
- **`review`** / **`security-review`** (bundled) — code review and the `secret_scan` /
  zero-external-calls guardrail work (story s11).

## Evaluated, not installed — operator action items

These require a `/plugin install` or similar action this session can't take on its own
behalf (per this story's own scope: "produce the recommendation, don't force-install"):

- **`frontend-design`** (official `anthropics/skills` marketplace) — recommended for the
  polished multi-mode map UI (toggle lists, sliders, playback controls) across stories
  s2-s10. Install: `/plugin marketplace add anthropics/claude-plugins-official` (if not
  already added) then `/plugin install frontend-design@claude-plugins-official`, then
  `/reload-plugins`.
- **`webapp-testing`** (official marketplace) — **recommendation: skip, don't install.**
  Playwright MCP is already connected and already covers this epic's E2E needs (browser
  navigation, evaluation, screenshots — confirmed via this session's own tool list).
  Installing `webapp-testing` on top would be redundant per this story's own acceptance
  criteria ("never adopt both without a stated reason") — no reason found.
- **`skill-creator`** (official marketplace, optional) — only useful if this repo ends
  up wanting a custom recorded skill (e.g., a `/run` launch recipe once the dev server
  has real setup steps). Not needed yet; revisit after story s1 if `run`/`verify`
  struggle to infer the launch command.
- **`mcp-builder`** (official marketplace) — explicitly reserved for **v2**
  (`.pHive/planning/roadmap.md`'s agent-API surface). Confirmed it exists as a
  marketplace option; do not install or use it in this epic.
- **`vercel-react-best-practices`** (community, skills.sh) — recommended for the
  Next.js/Vercel-specific patterns this build will lean on throughout. Install
  mechanism not independently re-verified this pass (prior research summary said
  `npx skills add <owner/repo>`-style; confirm the exact current command against
  skills.sh's own docs at install time rather than trusting this note).
- **`shadcn`** (community, skills.sh) — recommended for accessible component
  primitives pairing with Tailwind (toggle lists, sliders, tabs). Same install-caveat
  as above.

## Smoke-test notes

- `dataviz`, `run`, `review`, `security-review`: confirmed present in this session's
  available-skills listing — real invocation smoke test deferred to the stories that
  actually use them (s4's palette work, s1's dev-server launch, s11's review/guardrail
  work), since a standalone smoke test here would just be "is it in the list," which is
  already confirmed.
- Playwright MCP: confirmed connected and already exercised earlier this session
  (browser_navigate/evaluate calls recorded in transcript history during unrelated
  work) — real usage, not just presence.
