"use client";

import { useRef, useState } from "react";
import { ALLERGENS } from "@/lib/allergens/registry";
import { parseCsv, type ParsedRow } from "@/lib/panel-import/parse-csv";

interface Props {
  onApply: (sensitivities: Record<string, number>) => void;
}

/**
 * v2, slice 1 (CSV/text import -- no LLM, no API key needed): reads a
 * lab-report-shaped CSV or plain-text 2-column file entirely client-side,
 * fuzzy-matches allergen names against the registry ("fit"), and surfaces
 * every row for review before anything is applied to the user's profile
 * ("...let people fix it if needed" -- explicit user direction). Unmatched
 * rows ("gap") get a manual dropdown instead of being silently dropped.
 *
 * Photo/PDF upload (using the BYO key from ByoKeySettings) is a separate,
 * later slice built on the same review-and-apply UI below.
 */
export function PanelUpload({ onApply }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError(
        "This slice reads CSV/text files only for now. Photo/PDF upload (using your saved API key) is coming next.",
      );
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setError("Couldn't find any rows in that file -- expected an allergen name and a value per line.");
      return;
    }
    setError(null);
    setRows(parsed);
  }

  function updateRow(index: number, changes: Partial<ParsedRow>) {
    setRows((prev) => (prev ? prev.map((row, i) => (i === index ? { ...row, ...changes } : row)) : prev));
  }

  function handleApply() {
    if (!rows) return;
    const sensitivities: Record<string, number> = {};
    for (const row of rows) {
      if (row.allergenId) sensitivities[row.allergenId] = row.sensitivity;
    }
    onApply(sensitivities);
    setRows(null);
  }

  const matchedCount = rows?.filter((r) => r.allergenId).length ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Upload your allergy test</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Upload a CSV or text export of your test results instead of setting sliders by hand. We match
        each allergen name automatically where we can, and let you fix anything we got wrong or
        couldn&rsquo;t recognize before it&rsquo;s applied.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        onChange={handleFileChange}
        aria-label="Upload allergy test file"
        className="text-xs text-zinc-600 dark:text-zinc-300"
      />

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {rows && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {matchedCount} of {rows.length} rows matched automatically. Review and fix anything below,
            then apply.
          </p>
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

