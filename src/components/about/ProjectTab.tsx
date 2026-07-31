"use client";

import { useState } from "react";
import { MarkdownContent } from "@/components/about/MarkdownContent";

interface Props {
  aboutV1: string;
  aboutV2: string;
}

/**
 * Ships BOTH ABOUT.md and ABOUT-v2.md content behind an in-page toggle, per the
 * user's explicit instruction ("ship about 1 and 2 with a toggle and I'll choose")
 * -- not a planner-chosen single variant.
 */
export function ProjectTab({ aboutV1, aboutV2 }: Props) {
  const [variant, setVariant] = useState<"v1" | "v2">("v1");

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="About copy variant"
        className="mb-6 inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800"
      >
        <button
          type="button"
          role="radio"
          aria-checked={variant === "v1"}
          onClick={() => setVariant("v1")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            variant === "v1"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Copy variant 1
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={variant === "v2"}
          onClick={() => setVariant("v2")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            variant === "v2"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Copy variant 2
        </button>
      </div>
      <MarkdownContent content={variant === "v1" ? aboutV1 : aboutV2} />
    </div>
  );
}
