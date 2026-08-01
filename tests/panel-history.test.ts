import { describe, expect, it, beforeEach } from "vitest";
import { getPanelHistory, addPanelSnapshot, clearPanelHistory } from "@/lib/panel-history";

describe("panel history (v2 kickoff slice 4 -- tracks upload events, client-only)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty array when no history exists", () => {
    expect(getPanelHistory()).toEqual([]);
  });

  it("appends a snapshot with a real timestamp", () => {
    addPanelSnapshot({ grass: 60 });
    const history = getPanelHistory();
    expect(history).toHaveLength(1);
    expect(history[0].sensitivities).toEqual({ grass: 60 });
    expect(new Date(history[0].date).toString()).not.toBe("Invalid Date");
  });

  it("accumulates multiple snapshots in order, one per upload", () => {
    addPanelSnapshot({ grass: 40 });
    addPanelSnapshot({ grass: 70, ragweed: 20 });
    const history = getPanelHistory();
    expect(history).toHaveLength(2);
    expect(history[0].sensitivities.grass).toBe(40);
    expect(history[1].sensitivities.grass).toBe(70);
  });

  it("clears history", () => {
    addPanelSnapshot({ grass: 40 });
    clearPanelHistory();
    expect(getPanelHistory()).toEqual([]);
  });

  it("fails open to an empty history on corrupted localStorage data, rather than throwing", () => {
    window.localStorage.setItem("allergy-locator:panel-history", "not valid json{{{");
    expect(() => getPanelHistory()).not.toThrow();
    expect(getPanelHistory()).toEqual([]);
  });
});
