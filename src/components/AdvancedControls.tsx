"use client";

import { DEFAULT_MODEL_SETTINGS, type ModelSettings } from "@/lib/model-settings";

interface Props {
  settings: ModelSettings;
  onChange: (settings: ModelSettings) => void;
}

/**
 * Explicit user direction: "ANY FORMULA or other guesswork we have should be
 * front and center and ALLOW MODIFICATION... show all variables and allow
 * them to be changed so people can play with it." Every control here is
 * genuinely live-computed (see lib/model-settings.ts's own docstring for
 * exactly what is and isn't exposed, and why) -- moving a slider recomputes
 * the map immediately, it doesn't just relabel a fixed result.
 */
export function AdvancedControls({ settings, onChange }: Props) {
  function update<K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Advanced: live model parameters</p>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_MODEL_SETTINGS)}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Reset
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-zinc-500 dark:text-zinc-400">
          <span>Season curve strength</span>
          <span>{Math.round(settings.seasonStrength * 100)}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.seasonStrength}
          onChange={(e) => update("seasonStrength", Number(e.target.value))}
        />
        <span className="text-zinc-400 dark:text-zinc-500">
          0% = no seasonality (every month reads like the annual peak); 100% = the full modeled curve.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-zinc-500 dark:text-zinc-400">
          <span>Gradient smoothness (IDW power)</span>
          <span>{settings.idwPower.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.1}
          value={settings.idwPower}
          onChange={(e) => update("idwPower", Number(e.target.value))}
        />
        <span className="text-zinc-400 dark:text-zinc-500">
          Lower = smoother blending between sample points; higher = tighter, more distinct blobs.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-zinc-500 dark:text-zinc-400">
          <span>Overlapping-layer opacity</span>
          <span>{Math.round(settings.layerOpacity * 100)}%</span>
        </span>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={settings.layerOpacity}
          onChange={(e) => update("layerOpacity", Number(e.target.value))}
        />
        <span className="text-zinc-400 dark:text-zinc-500">Per-layer opacity when 2+ allergens are active at once.</span>
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-zinc-500 dark:text-zinc-400">&ldquo;My map&rdquo; combination method</span>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="combinationMethod"
            checked={settings.combinationMethod === "noisy-or"}
            onChange={() => update("combinationMethod", "noisy-or")}
          />
          Noisy-OR — compounding independent risk (default)
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="combinationMethod"
            checked={settings.combinationMethod === "average"}
            onChange={() => update("combinationMethod", "average")}
          />
          Sensitivity-weighted average
        </label>
      </div>
    </div>
  );
}
