import type { ParsedRow } from "@/lib/panel-import/parse-csv";
import { matchAllergenName, classToSensitivity } from "@/lib/panel-import/match-allergen";

/**
 * Direct browser -> Anthropic API calls for photo/PDF panel extraction (v2,
 * slice 3). No project-held key, no server proxy: every request here uses
 * the user's own key (lib/byo-key.ts) and goes straight from their browser
 * to Anthropic, per the `anthropic-dangerous-direct-browser-access` header
 * Anthropic's own docs name as the intended mechanism for exactly this
 * "bring your own key" pattern (verified during the previous slice, see
 * .pHive/planning/roadmap.md). This file makes network calls -- it is
 * NEVER exercised by the automated test suite with a real key; unit tests
 * mock `fetch` instead (see tests/claude-client.test.ts).
 *
 * Two independent calls per upload, not one: `extractPanelFromFile` (the
 * generate pass) reads the file cold, then `verifyExtraction` (a SEPARATE
 * call, not a continuation of the first) is shown the file again alongside
 * the first pass's draft and asked to find anything fabricated, wrong, or
 * misread -- the two-agent generate->verify pattern the roadmap calls for
 * specifically because a wrong number in health data is worse than a
 * missing one.
 */

const ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const EXTRACT_TOOL = {
  name: "record_allergy_panel",
  description: "Record every allergen and its severity/class found in the uploaded allergy test report.",
  input_schema: {
    type: "object",
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "The allergen name exactly as written in the report." },
            value: {
              type: "number",
              description:
                "The severity/class value exactly as written (e.g. a 0-6 immunoassay class, or a 0-100 score).",
            },
          },
          required: ["name", "value"],
        },
      },
    },
    required: ["rows"],
  },
};

interface ClaudeToolResponse {
  rows: Array<{ name: string; value: number }>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function contentBlockForFile(mimeType: string, base64: string) {
  if (mimeType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: mimeType, data: base64 } };
  }
  return { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } };
}

async function callClaudeTool(
  apiKey: string,
  content: unknown[],
): Promise<ClaudeToolResponse> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const toolUse = data.content?.find((block: { type: string }) => block.type === "tool_use");
  if (!toolUse) throw new Error("Claude didn't return a structured extraction.");
  return toolUse.input as ClaudeToolResponse;
}

function toParsedRows(rows: Array<{ name: string; value: number }>): ParsedRow[] {
  return rows.map(({ name, value }) => {
    const { allergenId, confidence } = matchAllergenName(name);
    const sensitivity = value <= 6 ? classToSensitivity(value) : Math.max(0, Math.min(100, Math.round(value)));
    return { rawName: name, rawValue: String(value), allergenId, confidence, sensitivity };
  });
}

const EXTRACT_PROMPT =
  "This is a photo or scan of an allergy test report. Find every allergen tested and its " +
  "severity or class value, exactly as written -- do not skip any, and do not invent any that " +
  "aren't actually shown. Record them with the record_allergy_panel tool.";

export async function extractPanelFromFile(file: File, apiKey: string): Promise<ParsedRow[]> {
  const base64 = await fileToBase64(file);
  const content = [contentBlockForFile(file.type, base64), { type: "text", text: EXTRACT_PROMPT }];
  const result = await callClaudeTool(apiKey, content);
  return toParsedRows(result.rows);
}

export async function verifyExtraction(
  file: File,
  apiKey: string,
  draft: ParsedRow[],
): Promise<ParsedRow[]> {
  const base64 = await fileToBase64(file);
  const draftSummary = draft.map((r) => `${r.rawName}: ${r.rawValue}`).join("\n");
  const verifyPrompt =
    "Here is the same allergy test report again, and a first-pass extraction of it:\n\n" +
    draftSummary +
    "\n\nCarefully check this extraction against the actual report. Fix any wrong values, " +
    "remove any entries that aren't really in the report (fabrications), and add any real " +
    "entries that were missed. Record the corrected, complete list with the record_allergy_panel tool.";
  const content = [contentBlockForFile(file.type, base64), { type: "text", text: verifyPrompt }];
  const result = await callClaudeTool(apiKey, content);
  return toParsedRows(result.rows);
}
