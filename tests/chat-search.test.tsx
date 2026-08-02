import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockInterpret = vi.fn();
vi.mock("@/lib/chat/allergy-chat", () => ({
  interpretAllergyQuery: (...args: unknown[]) => mockInterpret(...args),
}));

const mockGetStoredApiKey = vi.fn();
vi.mock("@/lib/byo-key", () => ({
  getStoredApiKey: () => mockGetStoredApiKey(),
}));

const { ChatSearch } = await import("@/components/ChatSearch");

describe("ChatSearch", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks with a clear message when no API key is saved, without calling the LLM", async () => {
    mockGetStoredApiKey.mockReturnValue(null);
    render(<ChatSearch onApply={() => {}} />);

    fireEvent.change(screen.getByLabelText(/describe your allergies/i), { target: { value: "grass and ragweed" } });
    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    expect(await screen.findByText(/your own anthropic api key/i)).toBeInTheDocument();
    expect(mockInterpret).not.toHaveBeenCalled();
  });

  it("applies the returned state and shows the reply on success", async () => {
    mockGetStoredApiKey.mockReturnValue("sk-ant-fake-key");
    const state = { mode: "composite" as const, active: new Set<string>(), sensitivities: { grass: 90 }, month: 6 };
    mockInterpret.mockResolvedValue({ state, reply: "Set your profile to grass 90, showing June." });

    const onApply = vi.fn();
    render(<ChatSearch onApply={onApply} />);

    fireEvent.change(screen.getByLabelText(/describe your allergies/i), {
      target: { value: "badly allergic to grass, show June" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    await waitFor(() => expect(onApply).toHaveBeenCalledWith(state));
    expect(await screen.findByText(/showing June/)).toBeInTheDocument();
    expect(mockInterpret).toHaveBeenCalledWith("badly allergic to grass, show June", "sk-ant-fake-key");
  });

  it("surfaces a real error message instead of failing silently", async () => {
    mockGetStoredApiKey.mockReturnValue("sk-ant-fake-key");
    mockInterpret.mockRejectedValue(new Error("Anthropic API error (401): invalid x-api-key"));

    render(<ChatSearch onApply={() => {}} />);
    fireEvent.change(screen.getByLabelText(/describe your allergies/i), { target: { value: "test" } });
    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    expect(await screen.findByText(/401/)).toBeInTheDocument();
  });

  it("does nothing on an empty query", () => {
    mockGetStoredApiKey.mockReturnValue("sk-ant-fake-key");
    render(<ChatSearch onApply={() => {}} />);
    expect(screen.getByRole("button", { name: /ask/i })).toBeDisabled();
  });
});
