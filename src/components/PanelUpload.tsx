"use client";

import { useState } from "react";
import { ALLERGENS } from "@/lib/allergens/registry";
import { parseCsv, mergeSensitivities, type ParsedRow } from "@/lib/panel-import/parse-csv";
import { extractPanelFromFile, verifyExtraction } from "@/lib/panel-import/claude-client";
import { getStoredApiKey } from "@/lib/byo-key";

interface Props {
  onApply: (sensitivities: Record<string, number>) => void;
}

type Status = "idle" | "extracting" | "verifying" | "error";

/**
 * v2, slices 1-3: reads a CSV/text export entirely client-side (no LLM
 * needed), or a photo/PDF via a two-pass Claude extraction (generate, then
 * an independent verify pass against the same source -- see
 * lib/panel-import/claude-client.ts) using the user's own saved API key.
 * Both paths land in the same review table: every row visible, matched or
 * not, editable, with nothing applied to the profile until the user
 * explicitly confirms ("...let people fix it if needed" -- explicit user
 * direction). Unmatched rows ("gap") get a manual dropdown instead of being
 * silently dropped.
 */
export function PanelUpload({ onApply }: Props) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [verified, setVerified] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setVerified(false);

    if (/\.(csv|txt)$/i.test(file.name)) {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError("Couldn't find any rows in that file -- expected an allergen name and a value per line.");
        return;
      }
      setRows(parsed);
      return;
    }

    if (!/\.(pdf|jpe?g|png|heic|webp)$/i.test(file.name)) {
      setError("Upload a CSV/text export, or a photo/PDF of your test results.");
      return;
    }

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError(
        "Reading a photo or PDF needs your own Anthropic API key. Save one in About → Methodology, then try again.",
      );
      return;
    }

    try {
      setStatus("extracting");
      const draft = await extractPanelFromFile(file, apiKey);
      setRows(draft); // show the first pass immediately, don't make the user wait through both calls to see anything

      setStatus("verifying");
      const checked = await verifyExtraction(file, apiKey, draft);
      setRows(checked);
      setVerified(true);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong reading that file.");
      setStatus("error");
    }
  }

  function updateRow(index: number, changes: Partial<ParsedRow>) {
    setRows((prev) => (prev ? prev.map((row, i) => (i === index ? { ...row, ...changes } : row)) : prev));
  }

  function handleApply() {
    if (!rows) return;
    onApply(mergeSensitivities(rows));
    setRows(null);
    setVerified(false);
  }

  const matchedCount = rows?.filter((r) => r.allergenId).length ?? 0;

  // Multiple report rows (e.g. Bermuda/Bahia/Johnson grass) commonly match
  // the same id -- surfaced here so the user knows the highest value wins,
  // rather than silently applying just one of several real test results.
  const matchedIdCounts = new Map<string, number>();
  for (const row of rows ?? []) {
    if (row.allergenId) matchedIdCounts.set(row.allergenId, (matchedIdCounts.get(row.allergenId) ?? 0) + 1);
  }
  const hasCollisions = [...matchedIdCounts.values()].some((count) => count > 1);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Upload your allergy test</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Upload a CSV/text export, or a photo/PDF of your results, instead of setting sliders by hand.
        We match each allergen automatically where we can, and let you fix anything we got wrong or
        couldn&rsquo;t recognize before it&rsquo;s applied. Photos/PDFs are read directly by Claude
        using your own saved API key (About &rarr; Methodology) -- never sent to or stored by this
        project.
      </p>

      <input
        type="file"
        accept=".csv,.txt,.pdf,.jpg,.jpeg,.png,.heic,.webp,text/csv,text/plain,application/pdf,image/*"
        onChange={handleFileChange}
        aria-label="Upload allergy test file"
        className="text-xs text-zinc-600 dark:text-zinc-300"
      />

      {status === "extracting" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Reading your file with Claude…</p>
      )}
      {status === "verifying" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Double-checking that extraction against the original…
        </p>
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {rows && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {matchedCount} of {rows.length} rows matched automatically
            {verified && " (verified against the original)"}. Review and fix anything below, then
            apply.
          </p>
          {hasCollisions && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Some rows matched the same allergen (e.g. multiple grass species) -- the highest value
              among them will be applied.
            </p>
          )}
          <div className="max-h-64 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr className="text-zinc-500 dark:text-zinc-400">
                  <th className="px-2 py-1 font-medium">From file</th>
                  <th className="px-2 py-1 font-medium">Matched to</th>
                  <th className="px-2 py-1 font-medium">Sensitivity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-2 py-1 text-zinc-700 dark:text-zinc-300">
                      {row.rawName}
                      {row.confidence === "alias" && (
                        <span className="ml-1 text-zinc-400" title="Matched by a common alternate name -- double check">
                          ~
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.allergenId ?? ""}
                        onChange={(e) => updateRow(i, { allergenId: e.target.value || null })}
                        aria-label={`Match for ${row.rawName}`}
                        className={`rounded border px-1 py-0.5 text-xs dark:bg-zinc-900 ${
                          row.allergenId
                            ? "border-zinc-200 dark:border-zinc-700"
                            : "border-red-300 dark:border-red-800"
                        }`}
                      >
                        <option value="">Not matched -- pick one</option>
                        {ALLERGENS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.sensitivity}
                        onChange={(e) => updateRow(i, { sensitivity: Number(e.target.value) })}
                        aria-label={`Sensitivity for ${row.rawName}`}
                        className="w-16 rounded border border-zinc-200 px-1 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      {!Number.isNaN(Number(row.rawValue)) && Number(row.rawValue) <= 6 && (
                        <span
                          className="ml-1 text-zinc-400"
                          title={`Raw value "${row.rawValue}" was assumed to be a 0-6 immunoassay class and converted to ${row.sensitivity}. If your report uses a different scale, edit the number directly.`}
                        >
                          ⓘ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={matchedCount === 0}
            className="self-start rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Apply {matchedCount} matched allergen{matchedCount === 1 ? "" : "s"} to your profile
          </button>
        </div>
      )}
    </div>
  );
}
