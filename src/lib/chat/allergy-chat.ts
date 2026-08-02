import { ALLERGENS } from "@/lib/allergens/registry";
import { callClaudeTool, type AnthropicTool } from "@/lib/claude-tool-call";
import { parseHumanState, type UrlState } from "@/lib/url-state";

/**
 * Allergy-only slice of roadmap Phase 5 ("AI chat / natural-language
 * search"). The full cross-dimension version (crime, healthcare, cost) is
 * gated on a composite that doesn't exist here -- that work now lives in
 * mapstack-us. This module only ever produces an allergy `UrlState`, using
 * this app's own existing agent-friendly plain-URL schema (parseHumanState)
 * as the single source of truth for validation, rather than re-implementing
 * id/range checks here.
 */

const VALID_IDS = new Set(ALLERGENS.map((a) => a.id));

const CHAT_TOOL: AnthropicTool = {
  name: "set_allergy_view",
  description: "Set the map's allergy view to match what the user described in plain language.",
  input_schema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["overlay", "composite"],
        description:
          "'composite' when the user describes their OWN sensitivities/reactions (a personal " +
          "profile); 'overlay' when they just want to see where specific allergens are bad, with " +
          "no personal weighting.",
      },
      allergens: {
        type: "array",
        description: "Every allergen id the user's query implies. Omit any not mentioned.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: Array.from(VALID_IDS) },
            sensitivity: {
              type: "number",
              description: "0-100, only meaningful in composite mode -- how badly this allergen affects the user.",
            },
          },
          required: ["id"],
        },
      },
      month: {
        type: "integer",
        description: "1-12 if the user named a specific month/season, omitted for current/annual.",
      },
      reply: {
        type: "string",
        description: "One short sentence confirming what you set, in plain language, for the user to read.",
      },
    },
    required: ["mode", "allergens", "reply"],
  },
};

const ALLERGEN_LIST = ALLERGENS.map((a) => `${a.id} (${a.label})`).join(", ");

const SYSTEM_PROMPT =
  "You translate a plain-language description of someone's allergies, or a place-to-live " +
  "question, into this app's allergy map view. Only use these exact allergen ids -- never " +
  `invent one: ${ALLERGEN_LIST}. This is directional/geographic modeling, not medical advice -- ` +
  "don't diagnose or suggest treatment, just set the view.";

interface ChatToolResponse {
  mode?: string;
  allergens?: Array<{ id: string; sensitivity?: number }>;
  month?: number;
  reply?: string;
}

export interface AllergyChatResult {
  state: UrlState;
  reply: string;
}

export async function interpretAllergyQuery(query: string, apiKey: string): Promise<AllergyChatResult> {
  const content = [{ type: "text", text: `${SYSTEM_PROMPT}\n\nUser: ${query}` }];
  const result = (await callClaudeTool(apiKey, content, CHAT_TOOL)) as unknown as ChatToolResponse;

  const mode = result.mode === "composite" ? "composite" : "overlay";
  const allergensParam = (result.allergens ?? [])
    .filter((a) => VALID_IDS.has(a.id))
    .map((a) => (mode === "composite" ? `${a.id}:${a.sensitivity ?? 50}` : a.id))
    .join(",");

  const params = new URLSearchParams();
  params.set("mode", mode);
  if (allergensParam) params.set("allergens", allergensParam);
  if (typeof result.month === "number") params.set("month", String(result.month));

  const state = parseHumanState(params) ?? { mode, active: new Set<string>(), sensitivities: {}, month: null };
  return { state, reply: result.reply ?? "Updated your map." };
}
