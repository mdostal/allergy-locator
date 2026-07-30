# About Allergy Locator

**Pick your allergens. See where in the US is best — or worst — *for you*. Click a state to see what's in its air and why.**

Every allergen tool answers the same question: *what's the pollen near me right now?* Allergy
Locator answers the reverse, and the more useful one: **given my specific allergens, where
should I live?** You price a move on schools, cost, and commute — never on the air, even though
most of us are carrying a personalized allergy panel we glanced at once and filed.

## The thesis: no place cures you
This tool will never tell you a city will fix your allergies — because that's a lie, and the
person who built it has the chart to prove it (see [`MY-STORY.md`](./MY-STORY.md)). Years of
immunotherapy knocked almost everything down but grass held on. So the honest promise is:

> **No place cures you. Places only tax you more or less — and there are real levers you control.**

The map ranks places by how much they'll personally cost you. The click-through turns that
verdict into a plan: season windows to plan around, landscaping/turf choices you control,
micro-siting (the valley was fine; the maintained lawn wasn't), and immunotherapy as a real,
evidence-based option — not magic.

## What makes the coloring honest
Your grass allergens grow in nearly every state, so a naive "where does it grow" map is a
useless red rectangle. Allergy Locator colors by **severity, not presence** — pollen-season
length × intensity × climate + planted/irrigated turf, plus an arid-Southwest weed/dust layer —
and it scores against *your* panel, suppressing the pollen-index noise (juniper, ragweed, mold)
you don't react to. Details in [`../MODEL-NOTES.md`](../MODEL-NOTES.md).

## Open, free, private
Fully open source (MIT). No login, no tracking, no accounts. The core map runs entirely on open
public data (USDA, Census) baked in at build time — **zero API keys, zero data leaving your
browser.** Your allergy profile is yours; nothing about it is uploaded.

---
*Directional, not medical advice. Get your own panel read by an allergist and treat the map as
one input among many.*
