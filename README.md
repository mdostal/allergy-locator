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
