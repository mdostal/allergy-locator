#!/usr/bin/env node
/**
 * MCP server for allergy-locator. Explicit user direction: "the allergy and
 * the map one need the agent tie in and discussion as well as tools and
 * skills so that we can use them across the board."
 *
 * Every tool here imports and calls the REAL functions the shipped app
 * itself runs (lib/severity/score.ts, lib/severity/composite.ts,
 * lib/reports/generate.ts) -- this is not a reimplementation or a
 * summary of the app's behavior, it's the same validated grass model
 * (MAE 2.3) and the same honestly-labeled modeled allergens an agent
 * would get by using the live map itself. A wrong/drifted duplicate
 * would be worse than not having this tool at all.
 *
 * Zero secrets, zero network calls of its own: every data file is the
 * same static JSON already bundled into the shipped app. This process
 * only needs local Node + the repo checked out -- no API key, no server,
 * consistent with the rest of this project's zero-cost/zero-secrets
 * posture.
 *
 * Run directly: `npx tsx mcp-server/src/index.ts` (stdio transport --
 * add it to Claude Desktop/Code's MCP config, see mcp-server/README.md).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import cities from "@data/cities.json";
import { ALLERGENS, getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { getComposite } from "@/lib/severity/composite";
import { generateReport } from "@/lib/reports/generate";

const LIVE_BASE_URL = "https://tools.mdostal.com/allergy-locator";
const VALID_ALLERGEN_IDS = new Set(ALLERGENS.map((a) => a.id));
const VALID_CITY_IDS = new Set(cities.map((c) => c.id));

const server = new McpServer({ name: "allergy-locator", version: "0.1.0" });

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

server.registerTool(
  "list_cities",
  {
    title: "List cities",
    description:
      "List all 168 US cities in allergy-locator's spine (id, city, state, lat/lon, climate zone). Use the returned `id` for other tools.",
    inputSchema: {},
  },
  async () => textResult(cities),
);

server.registerTool(
  "list_allergens",
  {
    title: "List allergens",
    description:
      "List every allergen allergy-locator models (id, label, category, confidence). `confidence: \"validated\"` (grass only) means fit against real lived ground-truth reactions (MAE 2.3); `\"modeled\"` means a good-faith climate-based extension without an equivalent ground-truth fit yet -- always surface this distinction to the user, never flatten it.",
    inputSchema: {},
  },
  async () => textResult(ALLERGENS),
);

server.registerTool(
  "get_allergy_severity",
  {
    title: "Get allergy severity for one allergen in one city",
    description:
      "Real severity (0-100, higher = worse) for a specific allergen in a specific city, using allergy-locator's actual scoring engine -- the validated grass model or the honestly-labeled modeled allergens. Returns the tier, confidence level, and a plain-English `why`. Optionally scoped to a specific month (1-12) for seasonal variation.",
    inputSchema: {
      cityId: z.string().describe("A city id from list_cities, e.g. \"new-york-ny\""),
      allergenId: z.string().describe("An allergen id from list_allergens, e.g. \"grass\""),
      month: z.number().int().min(1).max(12).optional().describe("1-12; omit for the annual score"),
    },
  },
  async ({ cityId, allergenId, month }) => {
    if (!VALID_CITY_IDS.has(cityId)) return errorResult(`Unknown city id "${cityId}". Call list_cities first.`);
    if (!VALID_ALLERGEN_IDS.has(allergenId)) {
      return errorResult(`Unknown allergen id "${allergenId}". Call list_allergens first.`);
    }
    const result = getSeverity(allergenId, cityId, month);
    if (!result) {
      return textResult({ cityId, allergenId, month: month ?? null, result: null, note: "No data for this allergen in this city -- a real gap, not a fabricated score." });
    }
    return textResult({ cityId, allergenId, month: month ?? null, ...result });
  },
);

server.registerTool(
  "get_composite_score",
  {
    title: "Get a personalized composite score for a city",
    description:
      "Combines a full sensitivity profile (allergen id -> 0-100 sensitivity) into one personalized 0-100 score for a city, using allergy-locator's real noisy-OR compounding-risk formula (not a diluted average) -- the same math the live map's \"My map\" mode uses. Returns the blended value plus a per-allergen breakdown of what's driving it.",
    inputSchema: {
      sensitivities: z
        .record(z.string(), z.number().min(0).max(100))
        .describe("Map of allergen id (from list_allergens) to 0-100 sensitivity"),
      cityId: z.string().describe("A city id from list_cities"),
      month: z.number().int().min(1).max(12).optional().describe("1-12; omit for the annual score"),
    },
  },
  async ({ sensitivities, cityId, month }) => {
    if (!VALID_CITY_IDS.has(cityId)) return errorResult(`Unknown city id "${cityId}". Call list_cities first.`);
    const unknown = Object.keys(sensitivities).filter((id) => !VALID_ALLERGEN_IDS.has(id));
    if (unknown.length > 0) return errorResult(`Unknown allergen id(s): ${unknown.join(", ")}. Call list_allergens first.`);

    const result = getComposite(sensitivities, cityId, month);
    if (!result) {
      return textResult({ cityId, month: month ?? null, result: null, note: "No active allergen has a nonzero sensitivity, or none have data for this city." });
    }
    return textResult({ cityId, month: month ?? null, ...result });
  },
);

server.registerTool(
  "generate_report",
  {
    title: "Generate a full best-place/best-time report",
    description:
      "Runs a sensitivity profile against the FULL 168-city x 12-month matrix and returns: the single best time+place, a ranked avoid-list, seasonal windows for the best cities, and the complete ranking for every city with data (not a top-5 excerpt). This is the real report the live map's \"Generate report\" button produces.",
    inputSchema: {
      sensitivities: z
        .record(z.string(), z.number().min(0).max(100))
        .describe("Map of allergen id (from list_allergens) to 0-100 sensitivity"),
    },
  },
  async ({ sensitivities }) => {
    const unknown = Object.keys(sensitivities).filter((id) => !VALID_ALLERGEN_IDS.has(id));
    if (unknown.length > 0) return errorResult(`Unknown allergen id(s): ${unknown.join(", ")}. Call list_allergens first.`);

    const report = generateReport(sensitivities);
    if (!report) return errorResult("No allergen has a nonzero sensitivity -- nothing to report on.");
    return textResult(report);
  },
);

server.registerTool(
  "build_shareable_url",
  {
    title: "Build a real, clickable allergy-locator URL",
    description:
      "Constructs a real URL to the live allergy-locator map pre-loaded with a given view, using the app's own documented agent-friendly plain-query-param scheme (README \"Driving the map programmatically\") -- hand this back to the user as a clickable link, don't just describe the state in words.",
    inputSchema: {
      mode: z.enum(["overlay", "composite"]).describe("\"overlay\" toggles allergens on/off; \"composite\" is a personal sensitivity profile"),
      allergens: z
        .array(z.object({ id: z.string(), sensitivity: z.number().min(0).max(100).optional() }))
        .describe("Allergen ids to include. In composite mode, include a sensitivity per allergen (defaults to 50 if omitted)."),
      month: z.number().int().min(1).max(12).optional().describe("1-12; omit for current/annual"),
    },
  },
  async ({ mode, allergens, month }) => {
    const unknown = allergens.map((a) => a.id).filter((id) => !VALID_ALLERGEN_IDS.has(id));
    if (unknown.length > 0) return errorResult(`Unknown allergen id(s): ${unknown.join(", ")}. Call list_allergens first.`);

    const allergensParam = allergens
      .map((a) => (mode === "composite" ? `${a.id}:${a.sensitivity ?? 50}` : a.id))
      .join(",");
    const params = new URLSearchParams({ mode, allergens: allergensParam });
    if (month) params.set("month", String(month));

    return textResult({ url: `${LIVE_BASE_URL}?${params.toString()}` });
  },
);

server.registerTool(
  "get_city",
  {
    title: "Get one city's details",
    description: "Look up a single city's full spine data (population, elevation, climate zone, coastal flag) by id.",
    inputSchema: {
      cityId: z.string().describe("A city id from list_cities"),
    },
  },
  async ({ cityId }) => {
    const city = cities.find((c) => c.id === cityId);
    if (!city) return errorResult(`Unknown city id "${cityId}". Call list_cities first.`);
    return textResult(city);
  },
);

server.registerTool(
  "get_allergen",
  {
    title: "Get one allergen's details",
    description: "Look up a single allergen's label, category, and confidence level by id.",
    inputSchema: {
      allergenId: z.string().describe("An allergen id from list_allergens"),
    },
  },
  async ({ allergenId }) => {
    const allergen = getAllergen(allergenId);
    if (!allergen) return errorResult(`Unknown allergen id "${allergenId}". Call list_allergens first.`);
    return textResult(allergen);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("allergy-locator MCP server failed to start:", err);
  process.exit(1);
});
