# Allergy Locator

Open-source interactive US map: **pick your allergens → see where in the US is best or worst *for you*.** Click a state to see what's in its air and why. Built on open USDA PLANTS + GBIF data.

> ⚠️ **Directional, not medical advice.** Get your own panel read by an allergist.

Fills a real gap: every existing tool shows *"pollen near you right now."* This runs the reverse — *"given MY sensitivities, where should I live?"* — a genuine, underused relocation filter.

## Principles

- **Fully open source (MIT).** Assume every file is public — **no secrets, ever.**
- **No tracking, no login, no keys** for the core map — it runs entirely on static open data baked at build time.
- **Cost ≈ $0** — static SSG on Vercel hobby.
- The **only** optional key (Google Pollen, for a live-conditions toggle) lives **exclusively as a Vercel env var**, read only by a serverless proxy — never shipped to the browser, never committed.

## How the coloring works

Presence ≠ severity. Your grass allergens grow in nearly every state, so a presence map is a useless red rectangle. Instead the map colors by **pollen-season length × intensity × climate + planted/irrigated turf** for *your* selected allergens. See [`docs/MODEL-NOTES.md`](docs/MODEL-NOTES.md).

## Driving the map programmatically

The whole app's view state lives in the URL, and the app hydrates from it — no
account, no server session. Sharing a link from the UI produces a compact
`?s=<encoded>` param (a byte-packed encoding, not meant to be hand-written).

For an external agent (Claude, a script, a person typing a URL) that wants to
construct a link directly, plain query params work too:

```
?mode=overlay&allergens=grass,ragweed&month=6
?mode=composite&allergens=grass:80,ragweed:40
```

- `mode` — `overlay` (toggle allergens on/off) or `composite` (your personal
  sensitivity profile). Defaults to `overlay`.
- `allergens` — comma-separated. In overlay mode, just ids (`grass,ragweed`).
  In composite mode, `id:sensitivity` pairs, 0-100 (`grass:80`); an id with no
  value defaults to a moderate `50`. Unknown ids are silently skipped.
- `month` — `1`-`12` for that month's severity, omitted for current/annual.

Allergen ids are whatever's in `data/allergens.json` (e.g. `grass`, `ragweed`,
`red-oak`) — `grass` plus every entry's own `id` field. These params are only
read when the compact `s` param is absent, so a shared link always wins.

If you've saved 2+ named profiles and compared them on the map ("My map" →
Compare profiles), that view also round-trips through `compare=<id1>,<id2>`
and `view=max|noisy-or|side-by-side`. Note this is a **bookmark/reload**
feature, not a cross-device share — a saved profile's id only means anything
in the browser that saved it, so opening that link on a different device or
after clearing storage just shows an empty comparison, not an error.

### MCP server

For a tighter agent integration than URL construction, [`mcp-server/`](mcp-server/)
exposes the real scoring engine (not a summary of it) as callable tools —
`get_allergy_severity`, `get_composite_score`, `generate_report`, `build_shareable_url`,
and more. See [`mcp-server/README.md`](mcp-server/README.md) for setup.

## Data & attribution

- **USDA PLANTS** — species→state ranges (US Gov, public domain)
- **GBIF** — taxonomy/occurrence (CC-BY)
- **Season severity** — Anderegg 2021 (PNAS), Zhang-Steiner 2022 (Nat. Comms.)
- Geographic base: us-atlas / US Census (public domain)
- **[AAAAI National Allergy Bureau](https://www.aaaai.org/tools-for-the-public/conditions-library/allergies/hay-fever-and-pollen-counts)** ([pollen.aaaai.org](https://pollen.aaaai.org/nab/)) — the real, measured, station-by-station current pollen/mold counts. Full credit to AAAAI and every certified NAB counting station. Referenced for QA only, **not embedded** — their data requires a formal research-data-release agreement (PI, institutional affiliation, department-head approval) this project doesn't qualify for as an independent open-source tool. Go there directly for today's actual count; this map models *seasonal patterns*, not live measurements.
- BONAP referenced for QA only, not embedded (reuse restricted)

## Stack

Next.js (SSG) on Vercel hobby. One optional serverless route (`/api/pollen`) for the live toggle. Build-time script normalizes USDA/GBIF → committed `data/*.json` → zero runtime data-fetch for the core.

## Status

Greenfield. See [`REQUIREMENTS.md`](REQUIREMENTS.md) and [`docs/MODEL-NOTES.md`](docs/MODEL-NOTES.md).

## License

MIT — see [`LICENSE`](LICENSE).
