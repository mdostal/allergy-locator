"use client";

import { useEffect, useState } from "react";
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, looksLikeAnthropicKey } from "@/lib/byo-key";

/**
 * v2 kickoff slice: key storage only, no LLM call anywhere in this
 * component or the module it uses. The photo/PDF-upload parse+verify flow
 * this key will power is a separate, later slice.
 */
export function ByoKeySettings() {
  const [input, setInput] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reads localStorage -- client-only, matching the same mounted-hydration
  // pattern ThemeToggle/MapView already use for this exact SSR-vs-client
  // problem.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSavedKey(getStoredApiKey());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!mounted) {
    return <div className="h-24" aria-hidden />;
  }

  function handleSave() {
    if (!looksLikeAnthropicKey(input)) {
      setError("That doesn't look like an Anthropic API key (expected to start with sk-ant-).");
      return;
    }
    setStoredApiKey(input.trim());
    setSavedKey(input.trim());
    setInput("");
    setError(null);
  }

  function handleClear() {
    clearStoredApiKey();
    setSavedKey(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Your API key (coming soon)</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        A future feature will let you upload a photo or PDF of your allergy test results and have
        Claude read them into your profile automatically. That needs your own Anthropic API key —
        this project never holds one, pays for no AI calls, and never sees or stores your key on any
        server. Your key stays in this browser only, sent directly from your browser to Anthropic
        when that feature ships.
      </p>

      {savedKey ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-zinc-700 dark:text-zinc-300">
            Key saved: <span className="font-mono">{savedKey.slice(0, 11)}…</span>
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            Remove key
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="sk-ant-..."
            aria-label="Anthropic API key"
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={!input.trim()}
            className="self-start rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Save key
          </button>
        </div>
      )}
    </div>
  );
}
