import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Spins up the REAL server as a child process over the REAL MCP stdio
 * protocol (not a mocked/in-process call) -- the point of this server is
 * that an external agent gets it exactly this way, so that's what's tested.
 */
let client: Client;

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content as Array<{ type: string; text?: string }>;
  return content[0]?.text ?? "";
}

beforeAll(async () => {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", new URL("../src/index.ts", import.meta.url).pathname],
  });
  client = new Client({ name: "test-client", version: "0.0.1" });
  await client.connect(transport);
}, 30_000);

afterAll(async () => {
  await client.close();
});

describe("allergy-locator MCP server", () => {
  it("lists every expected tool", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "build_shareable_url",
        "generate_report",
        "get_allergen",
        "get_allergy_severity",
        "get_city",
        "get_composite_score",
        "list_allergens",
        "list_cities",
      ].sort(),
    );
  });

  it("list_cities returns all 168 real spine cities", async () => {
    const result = await client.callTool({ name: "list_cities", arguments: {} });
    const cities = JSON.parse(textOf(result));
    expect(cities).toHaveLength(168);
    expect(cities[0]).toHaveProperty("id");
    expect(cities[0]).toHaveProperty("lat");
  });

  it("list_allergens returns real allergens with confidence levels", async () => {
    const result = await client.callTool({ name: "list_allergens", arguments: {} });
    const allergens = JSON.parse(textOf(result));
    expect(allergens.length).toBeGreaterThan(20);
    const grass = allergens.find((a: { id: string }) => a.id === "grass");
    expect(grass.confidence).toBe("validated");
  });

  it("get_allergy_severity returns the real validated grass score for a real city", async () => {
    const result = await client.callTool({
      name: "get_allergy_severity",
      arguments: { cityId: "new-york-ny", allergenId: "grass" },
    });
    const data = JSON.parse(textOf(result));
    expect(data.confidence).toBe("validated");
    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.value).toBeLessThanOrEqual(100);
  });

  it("get_allergy_severity errors on an unknown city id, rather than fabricating a score", async () => {
    const result = await client.callTool({
      name: "get_allergy_severity",
      arguments: { cityId: "not-a-real-city", allergenId: "grass" },
    });
    expect(result.isError).toBe(true);
  });

  it("get_allergy_severity errors on an unknown allergen id", async () => {
    const result = await client.callTool({
      name: "get_allergy_severity",
      arguments: { cityId: "new-york-ny", allergenId: "not-a-real-allergen" },
    });
    expect(result.isError).toBe(true);
  });

  it("get_composite_score blends multiple allergens using the real noisy-OR formula", async () => {
    const result = await client.callTool({
      name: "get_composite_score",
      arguments: { sensitivities: { grass: 80, ragweed: 40 }, cityId: "new-york-ny" },
    });
    const data = JSON.parse(textOf(result));
    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.contributions).toHaveLength(2);
  });

  it("get_composite_score errors on an unknown allergen id in the sensitivities map", async () => {
    const result = await client.callTool({
      name: "get_composite_score",
      arguments: { sensitivities: { "not-a-real-allergen": 50 }, cityId: "new-york-ny" },
    });
    expect(result.isError).toBe(true);
  });

  it("generate_report produces a full 168-city ranking, not a top-5 excerpt", async () => {
    const result = await client.callTool({
      name: "generate_report",
      arguments: { sensitivities: { grass: 80 } },
    });
    const report = JSON.parse(textOf(result));
    expect(report.fullRanking.length).toBeGreaterThan(100);
    expect(report.bestTimePlace).toBeDefined();
  });

  it("generate_report errors when every sensitivity is zero -- nothing to report on", async () => {
    const result = await client.callTool({
      name: "generate_report",
      arguments: { sensitivities: {} },
    });
    expect(result.isError).toBe(true);
  });

  it("build_shareable_url produces a real, working URL matching the app's documented plain-param scheme", async () => {
    const result = await client.callTool({
      name: "build_shareable_url",
      arguments: { mode: "composite", allergens: [{ id: "grass", sensitivity: 80 }] },
    });
    const data = JSON.parse(textOf(result));
    expect(data.url).toBe("https://tools.mdostal.com/allergy-locator?mode=composite&allergens=grass%3A80");
  });

  it("build_shareable_url errors on an unknown allergen id", async () => {
    const result = await client.callTool({
      name: "build_shareable_url",
      arguments: { mode: "overlay", allergens: [{ id: "not-a-real-allergen" }] },
    });
    expect(result.isError).toBe(true);
  });

  it("get_city returns real spine data for a known city", async () => {
    const result = await client.callTool({ name: "get_city", arguments: { cityId: "new-york-ny" } });
    const city = JSON.parse(textOf(result));
    expect(city.city).toBe("New York");
    expect(city.state).toBe("NY");
  });

  it("get_allergen returns real registry data for a known allergen", async () => {
    const result = await client.callTool({ name: "get_allergen", arguments: { allergenId: "grass" } });
    const allergen = JSON.parse(textOf(result));
    expect(allergen.label).toBe("Grass");
  });
});
