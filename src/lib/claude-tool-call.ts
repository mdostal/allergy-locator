const ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * Direct browser -> Anthropic API calls, shared by every BYO-key feature
 * (panel extraction, allergy chat search, and any future one). No
 * project-held key, no server proxy: every request uses the user's own key
 * (lib/byo-key.ts) and goes straight from their browser to Anthropic, per
 * the `anthropic-dangerous-direct-browser-access` header Anthropic's own
 * docs name as the intended mechanism for exactly this "bring your own key"
 * pattern (verified in panel-import/claude-client.ts's original slice).
 * NEVER exercised by the automated test suite with a real key -- callers'
 * unit tests mock `fetch` instead.
 */
export async function callClaudeTool(
  apiKey: string,
  content: unknown[],
  tool: AnthropicTool,
): Promise<Record<string, unknown>> {
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
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const toolUse = data.content?.find((block: { type: string }) => block.type === "tool_use");
  if (!toolUse) throw new Error(`Claude didn't return a structured ${tool.name} response.`);
  return toolUse.input as Record<string, unknown>;
}
