"use client";

import { useState } from "react";
import { getStoredApiKey } from "@/lib/byo-key";
import { interpretAllergyQuery } from "@/lib/chat/allergy-chat";
import type { UrlState } from "@/lib/url-state";

interface Props {
  onApply: (state: UrlState) => void;
}

type Status = "idle" | "thinking" | "error";

/**
 * Allergy-only slice of roadmap Phase 5 ("AI chat / natural-language
 * search"). The full cross-dimension version (crime, healthcare, cost)
 * waits on mapstack-us's composite -- this scopes to what this app can
 * actually answer today: setting an allergy view, using the same BYO-key
 * Claude pattern as photo/PDF panel upload (no project-held key, no server
 * proxy). This is additive to the existing URL-driven control surface
 * (story s9), not a replacement for it -- sliders/toggles/URL params still
 * work exactly as before.
 */
export function ChatSearch({ onApply }: Props) {
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function handleAsk() {
    const trimmed = query.trim();
    if (!trimmed) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError("Ask needs your own Anthropic API key. Save one in About → Methodology, then try again.");
      return;
    }

    setError(null);
    setReply(null);
    setStatus("thinking");
    try {
      const result = await interpretAllergyQuery(trimmed, apiKey);
      onApply(result.state);
      setReply(result.reply);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong understanding that.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Ask in plain language</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        e.g. &ldquo;I&rsquo;m badly allergic to ragweed and a bit to grass, show me June&rdquo;. Sets your
        allergy view below — directional/geographic modeling, not medical advice. Uses your own saved API
        key (About &rarr; Methodology).
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Describe your allergies..."
          aria-label="Describe your allergies in plain language"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <button
          type="button"
          onClick={handleAsk}
          disabled={status === "thinking" || !query.trim()}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {status === "thinking" ? "Thinking…" : "Ask"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {reply && <p className="text-xs text-zinc-600 dark:text-zinc-300">{reply}</p>}
    </div>
  );
}
