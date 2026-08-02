import { describe, expect, it, vi, afterEach } from "vitest";
import { interpretAllergyQuery } from "@/lib/chat/allergy-chat";

/**
 * These tests mock `fetch` entirely -- allergy-chat.ts makes real network
 * calls to Anthropic's API using the user's own key, which must never run
 * in CI. See claude-client.test.ts for the same convention.
 */
function mockChatResponse(input: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => ({
      content: [{ type: "tool_use", name: "set_allergy_view", input }],
    }),
  } as Response;
}

describe("allergy-chat (mocked -- no real network calls)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("turns a composite-style tool response into a composite UrlState via parseHumanState", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockChatResponse({
        mode: "composite",
        allergens: [
          { id: "grass", sensitivity: 90 },
          { id: "ragweed", sensitivity: 40 },
        ],
        month: 6,
        reply: "Set your profile to grass 90, ragweed 40, showing June.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { state, reply } = await interpretAllergyQuery("I'm badly allergic to grass and ragweed", "sk-ant-fake-key");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(options.headers["x-api-key"]).toBe("sk-ant-fake-key");

    expect(state.mode).toBe("composite");
    expect(state.sensitivities).toEqual({ grass: 90, ragweed: 40 });
    expect(state.month).toBe(6);
    expect(reply).toContain("June");
  });

  it("turns an overlay-style tool response into an overlay UrlState", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockChatResponse({
        mode: "overlay",
        allergens: [{ id: "grass" }],
        reply: "Showing grass severity.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { state } = await interpretAllergyQuery("where is grass pollen bad", "sk-ant-fake-key");

    expect(state.mode).toBe("overlay");
    expect(state.active.has("grass")).toBe(true);
    expect(state.month).toBeNull();
  });

  it("drops any allergen id the model invents, rather than trusting it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockChatResponse({
        mode: "composite",
        allergens: [
          { id: "grass", sensitivity: 70 },
          { id: "totally-made-up", sensitivity: 99 },
        ],
        reply: "Set your profile.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { state } = await interpretAllergyQuery("test", "sk-ant-fake-key");

    expect(state.sensitivities).toEqual({ grass: 70 });
    expect(state.sensitivities["totally-made-up"]).toBeUndefined();
  });

  it("falls back to a generic reply and defaults when the model omits fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockChatResponse({ mode: "overlay", allergens: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const { state, reply } = await interpretAllergyQuery("test", "sk-ant-fake-key");

    expect(reply).toBe("Updated your map.");
    expect(state.active.size).toBe(0);
  });

  it("throws a real error when Anthropic returns a non-OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "invalid x-api-key",
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(interpretAllergyQuery("test", "sk-ant-bad-key")).rejects.toThrow(/401/);
  });
});
