import { describe, expect, it, beforeEach } from "vitest";
import { getSavedProfiles, saveProfile, deleteProfile, renameProfile } from "@/lib/profiles";

describe("saved profiles (v3 kickoff -- named, client-only)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty array when no profiles exist", () => {
    expect(getSavedProfiles()).toEqual([]);
  });

  it("saves a profile with a real id and timestamp", () => {
    const saved = saveProfile("Me", { grass: 80 });
    expect(saved.name).toBe("Me");
    expect(saved.sensitivities).toEqual({ grass: 80 });
    expect(saved.id).toBeTruthy();
    expect(new Date(saved.savedAt).toString()).not.toBe("Invalid Date");

    const all = getSavedProfiles();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(saved);
  });

  it("accumulates multiple distinct profiles", () => {
    saveProfile("Me", { grass: 80 });
    saveProfile("Partner", { ragweed: 40 });
    const all = getSavedProfiles();
    expect(all).toHaveLength(2);
    expect(all.map((p) => p.name)).toEqual(["Me", "Partner"]);
    expect(all[0].id).not.toBe(all[1].id);
  });

  it("deletes a profile by id, leaving the others untouched", () => {
    const a = saveProfile("Me", { grass: 80 });
    const b = saveProfile("Partner", { ragweed: 40 });
    deleteProfile(a.id);
    const all = getSavedProfiles();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(b.id);
  });

  it("renames a profile without touching its sensitivities or id", () => {
    const saved = saveProfile("Me", { grass: 80 });
    renameProfile(saved.id, "My allergies");
    const all = getSavedProfiles();
    expect(all[0].name).toBe("My allergies");
    expect(all[0].id).toBe(saved.id);
    expect(all[0].sensitivities).toEqual({ grass: 80 });
  });

  it("fails open to an empty list on corrupted localStorage data, rather than throwing", () => {
    window.localStorage.setItem("allergy-locator:saved-profiles", "not valid json{{{");
    expect(() => getSavedProfiles()).not.toThrow();
    expect(getSavedProfiles()).toEqual([]);
  });
});
