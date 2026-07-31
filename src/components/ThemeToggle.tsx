"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS = ["light", "dark", "system"] as const;

/** A tri-state light/dark/system toggle, next-themes-backed (the same
 * class-based approach shadcn/Vercel templates ship by default). Cycles
 * through the three options on click, and shows the resolved theme so a
 * "system" pick still reads clearly as light or dark. */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch: the server can't know the user's stored
  // preference, so render nothing meaningful until mounted on the client. This
  // is next-themes' own documented pattern for this exact problem.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-7 w-24" aria-hidden />;
  }

  const current = theme ?? "system";

  function cycle() {
    const next = OPTIONS[(OPTIONS.indexOf(current as (typeof OPTIONS)[number]) + 1) % OPTIONS.length];
    setTheme(next);
  }

  const icon = resolvedTheme === "dark" ? "🌙" : "☀️";

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      aria-label={`Theme: ${current}. Click to change.`}
    >
      <span aria-hidden>{icon}</span>
      <span className="capitalize">{current}</span>
    </button>
  );
}
