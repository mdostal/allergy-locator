# allergy-locator MCP server

Exposes allergy-locator's **real scoring engine** — not a summary or a reimplementation
— as tools an AI agent can call directly. Every tool imports and runs the same
`lib/severity/score.ts`, `lib/severity/composite.ts`, and `lib/reports/generate.ts`
the live map itself uses, against the same bundled data. A wrong or drifted duplicate
would be worse than not having this at all, so this deliberately shares code with the
app instead of re-describing its behavior.

Zero secrets, zero network calls of its own — every data file is the same static JSON
already bundled into the shipped app. Runs entirely locally; no API key, no server.

## Tools

| Tool | What it does |
|---|---|
| `list_cities` | All 168 spine cities (id, lat/lon, climate zone) |
| `list_allergens` | All modeled allergens (id, label, category, validated/modeled confidence) |
| `get_allergy_severity` | Real severity (0–100) for one allergen in one city, optionally by month |
| `get_composite_score` | Blends a full sensitivity profile into one personalized score for a city (the real noisy-OR formula, not a diluted average) |
| `generate_report` | Full 168-city × 12-month report: best time+place, avoid-list, seasonal windows, complete ranking |
| `build_shareable_url` | A real, clickable URL to the live map pre-loaded with a given view |
| `get_city` / `get_allergen` | Look up one record by id |

Every tool returns a real error (not a fabricated result) for an unknown city or
allergen id — always call `list_cities`/`list_allergens` first if you don't already
have a valid id.

## Using it with Claude Desktop or Claude Code

Add to your MCP config (Claude Desktop's `claude_desktop_config.json`, or Claude
Code's `.mcp.json`):

```json
{
  "mcpServers": {
    "allergy-locator": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/allergy-locator/mcp-server/src/index.ts"]
    }
  }
}
```

(A packaged `npx @allergy-locator/mcp-server` install isn't published yet — point
directly at a local checkout for now.)

## Development

```
pnpm install
pnpm test   # spins up the real server over real stdio MCP, calls every tool
pnpm dev    # run the server directly (stdio transport -- expects an MCP client, not a terminal)
```
