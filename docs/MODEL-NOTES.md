# Model Notes — how the map colors "good vs bad"

## ⚠ The core insight: PRESENCE ≠ SEVERITY
USDA ranges tell us WHERE a species *can* occur. For grass (the priority allergen), that's ~everywhere:
**Timothy / Kentucky bluegrass / perennial ryegrass are in all 51 states; Bermuda in 42; Johnsongrass in 48;** the weeds are near-ubiquitous. So **"color the states where your species grow" turns the whole map red and tells you nothing.**

## What actually differentiates good vs bad (for a grass-dominant profile)
Color by **SEVERITY**, not presence:
1. **Grass-pollen SEASON LENGTH** — long warm-humid (South) vs short cold-winter (North) vs short dry-high (Mountain West). Source: Anderegg 2021 (PNAS), Zhang-Steiner 2022 (Nat. Comms.).
2. **Climate suitability / load** — warm + humid = heavy grass load; cold-winter reset + arid/high = light.
3. **⭐ Planted / irrigated / maintained turf** — real-world exposure comes from lawns, parks, and irrigated desert suburbs even where *native* grass is sparse. (Being validated against Mathew's actual road-trip reactions.) Weight developed/irrigated turf, not just native range.

**So: presence = the GATE** (does the allergen occur at all → list it on a state's click-through). **Severity = the COLOR** (season × load × climate for the selected allergens). A grass person's map should be **green in the dry-high West + cold North, red across the warm-humid grass South** — matching lived reality, not a uniform red rectangle.

## Coloring algorithm (per selected profile)
- **Gate:** for the user's selected allergens, which occur in each state (USDA `species-ranges.json`).
- **Score:** weight each present category by its season-length × intensity in that state's climate → green→red scale.
- **Click a state →** list the user's allergens present there + season window + a plain-English "why."

## ⭐ Second severity axis: the arid-Southwest weed+dust layer
Validated against real road-trip reactions (see `/Users/mdostal/Documents/work/compound-content/random/allergy-map/roadtrip-validation.md`). A grass-only model is **right** for Mesa (irrigated Bermuda/rye = rough), Coconino (clean high pine = great), and Kalispell (turf spike in an okay valley) — but it gets **Carlsbad, NM wrong**, calling it "fine" when it was miserable.

The Carlsbad driver isn't grass — it's the **desert chenopod/amaranth weed complex** (saltbush, pigweed/amaranth, Russian thistle/kochia, greasewood) delivered at wind-blown, saturating concentration, plus **dust + bone-dry air** as non-pollen irritants. So the model needs a second layer beyond grass:
1. **Desert weed (chenopod/amaranth) load** for the arid Southwest / high plains — weight it up even for a "moderate" weed panel, because concentration is the multiplier.
2. **Dust / low-humidity irritant multiplier** — a non-pollen bump for arid, windy, dusty regions.

Without this, the map mislabels the exact places a grass-dominant desert traveler actually suffers.

**External confirmation (AAFA 2026 city rankings):** the worst grass cities are *irrigated grass-ag / grass-seed-farm valleys* — Boise #1, Provo #4, Ogden #8, Spokane #9, SLC #13, Colorado Springs #15 — NOT the humid South alone and NOT native-grass density. This is hard proof the dominant severity driver is **planted/irrigated/farmed turf + grass-seed agriculture**, so weight cultivated/irrigated land and grass-seed-farming regions heavily. (See `/Users/mdostal/Documents/work/compound-content/random/allergy-map/region-scout.md`.)

## ⚠ Always score off HIS panel, not the local pollen index
Coconino reads "HIGH" on generic pollen apps (juniper + ragweed) — both **NEGATIVE** for him, so he feels great there. The coloring must be driven by the **user's selected allergens**, and must **suppress the noise** (juniper/ragweed/mold) that dominates public indices but is off a given person's panel. This is the whole point of the tool.

## Coastal moderation (confirmed sub-factor — weight it up)
Ocean proximity is a **reliable reliever, stronger than first modeled** — confirmed across multiple
lived data points: the Mediterranean coasts/islands (Greek Isles, Sicily, Athens), Hawaii (fine at
the beach, sneezed inland), and the Thai islands all ran noticeably kinder near water than raw
climate predicts. Mechanism: onshore breeze disperses/dilutes pollen; salt air + swimming physically
rinse it. Apply a downward nudge within a few miles of coast — larger on islands/exposed coast,
smaller for bays/inland-coastal. **Caveat (keeps it honest):** it does NOT rescue year-round-grass
subtropics — coastal Florida is still brutal because the grass load overwhelms the breeze. It's a
modifier, not an override. Also pairs with the Med's **dry-summer** effect (grass spent by peak
travel season), which compounds the relief.

## Data flags
- **Live oak "UT"** (USDA planted-record anomaly, off its Gulf/Atlantic range) — **dropped** from `species-ranges.json`.
- Weeds are near-ubiquitous → same presence≠severity rule; weight by disturbed-ground + season, and apply the arid-Southwest concentration bump above.

The difference between a useful tool and a red rectangle is right here: **build the coloring on severity — grass-season load + the arid weed/dust layer — scored against the user's own panel.**
