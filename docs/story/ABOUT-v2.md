# About Allergy Locator — draft 2

*(Second draft. Same thesis as `ABOUT.md`, but led by the lived-places validation — the "I tested
it against my own life" hook. Pick whichever opening runs better in the content.)*

**Pick your allergens. See where in the US you can actually breathe — scored against your real
panel, not a generic pollen index.**

I built this, and then I did the honest thing: I scored every place I've ever lived against it and
checked it against what my body remembered. It matched.

The cities that wrecked me came back red for the exact reasons I *felt* them — East Texas and its
long Bermuda summers, Yuma's irrigated desert, Florida's grass that never stops because winter
never comes. The places I breathed easy came back green — the high dry West, the cold North. Austin's
famous cedar? Negative on my panel. The map correctly blamed the **grass**, quietly, the whole time.
Salt Lake *looked* dry — but its irrigated lawns lit up, and so did my sinuses, in hindsight.

That's the whole pitch: **a map that agrees with your body — before you sign a mortgage.**

## The thesis: no place cures you
This tool will never tell you a city fixes your allergies, because that's a lie and I have the chart
to prove it (see [`MY-STORY.md`](./MY-STORY.md)): ~13 years of shots knocked almost everything down,
and grass still held on. So the honest promise is:

> **No place cures you. Places only tax you more or less — and there are real levers you control.**

The map ranks places by how much they'll personally cost you; the click-through turns that into a
plan — season windows, landscaping you control, micro-siting, and immunotherapy as a real (not
magic) option.

## Why the coloring is honest
Your grass allergens grow in nearly every state, so a "where does it grow" map is a useless red
rectangle. Allergy Locator colors by **severity, not presence** — season length × intensity ×
climate + planted/irrigated turf, plus an arid-Southwest weed/dust layer — scored against *your*
panel, suppressing the pollen-index noise (juniper, ragweed, mold) you don't react to.
See [`../MODEL-NOTES.md`](../MODEL-NOTES.md).

## Open, free, private
Fully open source (MIT). No login, no tracking, no accounts. The core map runs entirely on open
public data baked in at build time — **zero API keys, zero data leaving your browser.** Your profile
is yours.

---
*Directional, not medical advice. Get your own panel read by an allergist and treat the map as one
input among many.*
