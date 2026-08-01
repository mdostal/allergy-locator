import { describe, expect, it } from "vitest";
import { ALLERGENS } from "@/lib/allergens/registry";
import { decodeState, encodeState, buildQueryString, parseHumanState, URL_STATE_PARAM } from "@/lib/url-state";

describe("URL state serialization (story s9)", () => {
  it("round-trips a no-op default state", () => {
    const state = { mode: "overlay" as const, active: new Set<string>(), sensitivities: {}, month: null };
    const decoded = decodeState(encodeState(state));
    expect(decoded.mode).toBe("overlay");
    expect(decoded.active.size).toBe(0);
    expect(decoded.month).toBeNull();
  });

  it("round-trips overlay mode with several active allergens and a specific month", () => {
    const state = {
      mode: "overlay" as const,
      active: new Set(["grass", "sagebrush", "cladosporium"]),
      sensitivities: {},
      month: 7,
    };
    const decoded = decodeState(encodeState(state));
    expect(decoded.mode).toBe("overlay");
    expect(decoded.active).toEqual(new Set(["grass", "sagebrush", "cladosporium"]));
    expect(decoded.month).toBe(7);
  });

  it("round-trips composite mode with the full author sensitivity profile", () => {
    const sensitivities = { grass: 85, pigweed: 45, lambsquarters: 45, plantain: 40, boxelder: 15 };
    const state = { mode: "composite" as const, active: new Set<string>(), sensitivities, month: null };
    const decoded = decodeState(encodeState(state));
    expect(decoded.mode).toBe("composite");
    expect(decoded.sensitivities).toEqual(sensitivities);
  });

  it("round-trips EVERY allergen active at once (the scale case, not just a small subset)", () => {
    const active = new Set(ALLERGENS.map((a) => a.id));
    const state = { mode: "overlay" as const, active, sensitivities: {}, month: null };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded.active).toEqual(active);
    // Compact: nowhere near "one query param per allergen" length even at max scale.
    expect(encoded.length).toBeLessThan(200);
  });

  it("falls back to defaults for a missing param, without crashing", () => {
    const decoded = decodeState(null);
    expect(decoded.mode).toBe("overlay");
    expect(decoded.active.size).toBe(0);
    expect(decoded.month).toBeNull();
  });

  it("falls back to defaults for garbage/malformed input, without crashing", () => {
    for (const garbage of ["not-base64!!!", "", "a", "%%%", "====", "12345"]) {
      expect(() => decodeState(garbage)).not.toThrow();
      const decoded = decodeState(garbage);
      expect(decoded.mode === "overlay" || decoded.mode === "composite").toBe(true);
    }
  });

  it("buildQueryString produces a URLSearchParams-parseable query string keyed on the compact param", () => {
    const state = { mode: "overlay" as const, active: new Set(["grass"]), sensitivities: {}, month: 3 };
    const query = buildQueryString(state);
    const params = new URLSearchParams(query);
    expect(params.has(URL_STATE_PARAM)).toBe(true);
    const decoded = decodeState(params.get(URL_STATE_PARAM));
    expect(decoded.active.has("grass")).toBe(true);
    expect(decoded.month).toBe(3);
  });
});

describe("parseHumanState (plain, hand-writable params for external agents)", () => {
  it("returns null when none of the human params are present, so it never overrides defaults", () => {
    expect(parseHumanState(new URLSearchParams(""))).toBeNull();
    expect(parseHumanState(new URLSearchParams("foo=bar"))).toBeNull();
  });

  it("parses overlay mode from a plain comma-separated allergen list", () => {
    const state = parseHumanState(new URLSearchParams("mode=overlay&allergens=grass,ragweed&month=6"));
    expect(state).toEqual({
      mode: "overlay",
      active: new Set(["grass", "ragweed"]),
      sensitivities: {},
      month: 6,
    });
  });

  it("parses composite mode from id:value pairs", () => {
    const state = parseHumanState(new URLSearchParams("mode=composite&allergens=grass:80,ragweed:40"));
    expect(state?.mode).toBe("composite");
    expect(state?.sensitivities).toEqual({ grass: 80, ragweed: 40 });
    expect(state?.active.size).toBe(0);
  });

  it("defaults a composite id with no value to a moderate 50, rather than erroring", () => {
    const state = parseHumanState(new URLSearchParams("mode=composite&allergens=grass"));
    expect(state?.sensitivities).toEqual({ grass: 50 });
  });

  it("silently skips unknown allergen ids as a real gap, not a crash", () => {
    const state = parseHumanState(new URLSearchParams("allergens=grass,not-a-real-allergen"));
    expect(state?.active).toEqual(new Set(["grass"]));
  });

  it("treats an out-of-range or missing month as annual/current (null)", () => {
    expect(parseHumanState(new URLSearchParams("mode=overlay"))?.month).toBeNull();
    expect(parseHumanState(new URLSearchParams("mode=overlay&month=13"))?.month).toBeNull();
    expect(parseHumanState(new URLSearchParams("mode=overlay&month=0"))?.month).toBeNull();
  });

  it("clamps out-of-range composite sensitivity values instead of accepting garbage", () => {
    const state = parseHumanState(new URLSearchParams("mode=composite&allergens=grass:500,ragweed:-20"));
    expect(state?.sensitivities).toEqual({ grass: 100, ragweed: 0 });
  });
});
