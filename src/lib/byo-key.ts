/**
 * Bring-your-own-key storage (v2 kickoff, `.pHive/planning/roadmap.md`).
 * This slice is deliberately narrow: store/retrieve/clear a user-supplied
 * Anthropic API key in the browser's own localStorage, with NO network call
 * anywhere in this module. The actual panel-photo-upload -> parse -> verify
 * LLM flow is a separate, later slice built on top of this.
 *
 * Non-negotiable (carried over from v1's zero-secrets posture): the key
 * NEVER leaves the browser through any project-controlled code path. It is
 * read directly from localStorage at call time by whatever future code makes
 * the direct client->Anthropic request (verified CORS-capable via
 * `anthropic-dangerous-direct-browser-access`, see the roadmap doc) -- this
 * module has no server, no API route, and no fetch of its own.
 */
const STORAGE_KEY = "allergy-locator:byo-anthropic-key";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
  window.localStorage.setItem(STORAGE_KEY, key);
}

export function clearStoredApiKey(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** A key "looks" like an Anthropic key -- a cheap sanity check to catch an
 * obviously wrong paste (e.g. an OpenAI key, or empty whitespace) before
 * storing it, not a validity guarantee (only a real API call can confirm
 * that, which this slice deliberately doesn't make). */
export function looksLikeAnthropicKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}
