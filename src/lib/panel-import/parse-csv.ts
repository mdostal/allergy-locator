import { matchAllergenName, classToSensitivity } from "@/lib/panel-import/match-allergen";

export interface ParsedRow {
  /** The raw name as it appeared in the file -- always shown to the user,
   * even when matched, so they can verify the match themselves. */
  rawName: string;
  rawValue: string;
  allergenId: string | null;
  confidence: "exact" | "alias" | null;
  sensitivity: number;
}

/** Accepts a lab-report-shaped CSV with two meaningful columns in either
 * order: an allergen name and a value, where the value is either a 0-6
 * immunoassay "class" score or a direct 0-100 number. Column headers are
 * matched loosely (name/allergen/allergen name, value/class/score/severity)
 * so this isn't locked to one exact export format; a header-less 2-column
 * file also works. */
export function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const rows = lines.map((line) => splitCsvLine(line));

  const headerCandidates = rows[0].map((cell) => cell.toLowerCase());
  const nameCol = headerCandidates.findIndex((h) => /name|allergen/.test(h));
  const valueCol = headerCandidates.findIndex((h) => /value|class|score|severity|sensitivity/.test(h));
  const hasHeader = nameCol !== -1 || valueCol !== -1;

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const resolvedNameCol = nameCol !== -1 ? nameCol : 0;
  const resolvedValueCol = valueCol !== -1 ? valueCol : 1;

  const results: ParsedRow[] = [];
  for (const row of dataRows) {
    const rawName = (row[resolvedNameCol] ?? "").trim();
    const rawValue = (row[resolvedValueCol] ?? "").trim();
    if (!rawName) continue;

    const { allergenId, confidence } = matchAllergenName(rawName);
    const numericValue = Number(rawValue);
    const sensitivity = Number.isNaN(numericValue)
      ? 0
      : numericValue <= 6
        ? classToSensitivity(numericValue)
        : Math.max(0, Math.min(100, Math.round(numericValue)));

    results.push({ rawName, rawValue, allergenId, confidence, sensitivity });
  }

  return results;
}

/**
 * Real reports commonly test multiple species that all roll up to one of
 * this app's coarser ids (e.g. a report testing Bermuda, Bahia, Johnson
 * grass, and a "K-O-R-T grass mix" all resolve to the single "grass" id).
 * Combine by taking the HIGHEST sensitivity among them, not last-row-wins --
 * a person's real-world grass sensitivity is best represented by their
 * worst reaction among the grasses actually tested, not whichever species
 * happened to appear last in the file. Found via a real multi-species lab
 * report during Gemini extraction testing.
 */
export function mergeSensitivities(rows: ParsedRow[]): Record<string, number> {
  const sensitivities: Record<string, number> = {};
  for (const row of rows) {
    if (!row.allergenId) continue;
    const existing = sensitivities[row.allergenId];
    sensitivities[row.allergenId] = existing === undefined ? row.sensitivity : Math.max(existing, row.sensitivity);
  }
  return sensitivities;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}
