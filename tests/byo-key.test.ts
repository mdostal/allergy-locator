import { describe, expect, it, beforeEach } from "vitest";
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, looksLikeAnthropicKey } from "@/lib/byo-key";

describe("BYO-key storage (v2 kickoff -- storage only, no network calls)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no key is stored", () => {
    expect(getStoredApiKey()).toBeNull();
  });

  it("round-trips a stored key through localStorage", () => {
    setStoredApiKey("sk-ant-abc123abc123abc123abc123");
    expect(getStoredApiKey()).toBe("sk-ant-abc123abc123abc123abc123");
  });

  it("clears a stored key", () => {
    setStoredApiKey("sk-ant-abc123abc123abc123abc123");
    clearStoredApiKey();
    expect(getStoredApiKey()).toBeNull();
  });

  it("validates a plausible Anthropic key shape", () => {
    expect(looksLikeAnthropicKey("sk-ant-abc123abc123abc123abc123")).toBe(true);
  });

  it("rejects an obviously-wrong key shape (e.g. a different provider's key, or empty input)", () => {
    expect(looksLikeAnthropicKey("sk-openai-abc123")).toBe(false);
    expect(looksLikeAnthropicKey("")).toBe(false);
    expect(looksLikeAnthropicKey("   ")).toBe(false);
    expect(looksLikeAnthropicKey("not-a-key")).toBe(false);
  });
});
