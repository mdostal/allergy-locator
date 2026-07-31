import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Proves story s2's binding architectural requirement: AllergenToggleList renders
 * by looping over the registry. Mocking the registry to have TWO entries (instead
 * of the real one, grass) must produce two toggles with zero changes to
 * AllergenToggleList.tsx itself. If this test ever needs a code change to
 * AllergenToggleList.tsx to pass, that's a regression of the data-driven
 * architecture, not a normal test update.
 */
vi.mock("@/lib/allergens/registry", () => ({
  ALLERGENS: [
    { id: "grass", label: "Grass", category: "grass", confidence: "validated", color: "#16a34a" },
    { id: "fake-allergen", label: "Fake Allergen", category: "weed", confidence: "modeled", color: "#0ea5e9" },
  ],
}));

const { AllergenToggleList } = await import("@/components/AllergenToggleList");

describe("AllergenToggleList (data-driven loop proof)", () => {
  it("renders one toggle per registry entry, including a fake one added only for this test", () => {
    render(
      <AllergenToggleList active={new Set()} onToggle={() => {}} />,
    );
    expect(screen.getByLabelText(/Grass/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fake Allergen/)).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("labels modeled (non-validated) allergens distinctly", () => {
    render(<AllergenToggleList active={new Set()} onToggle={() => {}} />);
    expect(screen.getByText("(modeled)")).toBeInTheDocument();
  });
});
