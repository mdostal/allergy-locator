"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = { Slow: 900, Normal: 500, Fast: 200 } as const;
type Speed = keyof typeof SPEEDS;

interface Props {
  month: number | null;
  onMonthChange: (month: number) => void;
}

/**
 * Story s7: pure UI animation over story s6's month-indexed scoring — no new
 * scoring logic here, just a play/pause loop that drives TimeframeControl's
 * month state on an interval. Reaching December loops back to January rather
 * than stopping dead, since this is meant to be watched on repeat (a city's
 * severity rising and falling through the year), not a one-shot animation.
 */
export function YearPlayback({ month, onMonthChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("Normal");
  const monthRef = useRef(month);
  useEffect(() => {
    monthRef.current = month;
  }, [month]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const current = monthRef.current ?? 0;
      onMonthChange(current >= 12 ? 1 : current + 1);
    }, SPEEDS[speed]);
    return () => clearInterval(id);
  }, [playing, speed, onMonthChange]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause year playback" : "Play the year"}
        className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      >
        {playing ? "⏸ Pause" : "▶ Play the year"}
      </button>
      <select
        aria-label="Playback speed"
        value={speed}
        onChange={(e) => setSpeed(e.target.value as Speed)}
        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {(Object.keys(SPEEDS) as Speed[]).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
