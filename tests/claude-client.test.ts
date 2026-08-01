import { describe, expect, it, vi, afterEach } from "vitest";
import { extractPanelFromFile, verifyExtraction } from "@/lib/panel-import/claude-client";

/**
 * These tests mock `fetch` entirely -- claude-client.ts makes real network
 * calls to Anthropic's API using the user's own key, which must never run
 * in CI (no key available, would cost money, and would be non-deterministic).
 * See the module's own docstring.
 */
function mockClaudeResponse(rows: Array<{ name: string; value: number }>) {
  return {
    ok: true,
    json: async () => ({
      content: [{ type: "tool_use", name: "record_allergy_panel", input: { rows } }],
    }),
  } as Response;
}

describe("claude-client (mocked -- no real network calls)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extractPanelFromFile sends the file + prompt, and maps the tool response into ParsedRows", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockClaudeResponse([
        { name: "Bermuda Grass", value: 4 },
        { name: "Dust Mite", value: 2 },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["fake pdf bytes"], "test.pdf", { type: "application/pdf" });
    const rows = await extractPanelFromFile(file, "sk-ant-fake-key");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(options.headers["x-api-key"]).toBe("sk-ant-fake-key");
    expect(options.headers["anthropic-dangerous-direct-browser-access"]).toBe("true");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ rawName: "Bermuda Grass", allergenId: "grass", sensitivity: 60 });
    expect(rows[1]).toMatchObject({ rawName: "Dust Mite", allergenId: null }); // real gap, not modeled
  });

  it("sends an image content block (not a document block) for a photo upload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockClaudeResponse([{ name: "Ragweed", value: 3 }]));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["fake image bytes"], "test.jpg", { type: "image/jpeg" });
    await extractPanelFromFile(file, "sk-ant-fake-key");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const fileBlock = body.messages[0].content[0];
    expect(fileBlock.type).toBe("image");
    expect(fileBlock.source.media_type).toBe("image/jpeg");
  });

  it("verifyExtraction sends the file again alongside the draft, as a genuinely separate call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockClaudeResponse([{ name: "Bermuda Grass", value: 5 }]), // corrected from 4 -> 5
    );
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["fake pdf bytes"], "test.pdf", { type: "application/pdf" });
    const draft = [
      { rawName: "Bermuda Grass", rawValue: "4", allergenId: "grass", confidence: "alias" as const, sensitivity: 60 },
    ];
    const verified = await verifyExtraction(file, "sk-ant-fake-key", draft);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const promptBlock = body.messages[0].content.find((b: { type: string }) => b.type === "text");
    expect(promptBlock.text).toContain("Bermuda Grass: 4"); // the draft is included for the model to check
    expect(verified[0].sensitivity).toBe(80); // class 5 -> 80, the verify pass's correction
  });

  it("throws a real error (not a silent empty result) when Anthropic returns a non-OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "invalid x-api-key",
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["fake pdf bytes"], "test.pdf", { type: "application/pdf" });
    await expect(extractPanelFromFile(file, "sk-ant-bad-key")).rejects.toThrow(/401/);
  });

  it("throws when Claude's response has no tool_use block, instead of returning garbage", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "I couldn't read that file." }] }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["fake pdf bytes"], "test.pdf", { type: "application/pdf" });
    await expect(extractPanelFromFile(file, "sk-ant-fake-key")).rejects.toThrow(/structured extraction/);
  });
});
