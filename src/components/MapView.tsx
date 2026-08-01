"use client";

import { useEffect, useState } from "react";
import { AllergenToggleList } from "@/components/AllergenToggleList";
import { SensitivitySliders } from "@/components/SensitivitySliders";
import { UsMap } from "@/components/UsMap";
import { CompositeMap } from "@/components/CompositeMap";
import { StateDetailPanel } from "@/components/StateDetailPanel";
import { TimeframeControl } from "@/components/TimeframeControl";
import { YearPlayback } from "@/components/YearPlayback";
import { ReportPanel } from "@/components/ReportPanel";
import { TripPlanner } from "@/components/TripPlanner";
import { PanelUpload } from "@/components/PanelUpload";
import { AllergyHistoryChart } from "@/components/AllergyHistoryChart";
import { ProfileManager } from "@/components/ProfileManager";
import { ProfileCompare, type CompareView } from "@/components/ProfileCompare";
import { ProfileOverlayMap } from "@/components/ProfileOverlayMap";
import { getPanelHistory, addPanelSnapshot, type PanelSnapshot } from "@/lib/panel-history";
import { getSavedProfiles, type SavedProfile } from "@/lib/profiles";
import { GradientLegend } from "@/components/GradientLegend";
import { AdvancedControls } from "@/components/AdvancedControls";
import { decodeState, buildQueryString, parseHumanState, URL_STATE_PARAM, type Mode } from "@/lib/url-state";
import { getAllergen } from "@/lib/allergens/registry";
import { intensityColor, compositeColor } from "@/lib/severity/palette";
import { DEFAULT_MODEL_SETTINGS, type ModelSettings } from "@/lib/model-settings";
import authorPreset from "@data/presets/author.json";

export function MapView() {
  const [mode, setMode] = useState<Mode>("overlay");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [sensitivities, setSensitivities] = useState<Record<string, number>>({});
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [panelHistory, setPanelHistory] = useState<PanelSnapshot[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareView, setCompareView] = useState<CompareView>("max");

  // Client-only read on mount, same hydration-safety pattern as the URL-state
  // effect just below.
  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => setPanelHistory(getPanelHistory()), []);
  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => setSavedProfiles(getSavedProfiles()), []);

  // Story s9: the URL is the "agentic" surface this app ships -- no chat, no
  // LLM. Read it once on mount (client-only, matching the same
  // mounted-hydration pattern ThemeToggle already uses for this exact
  // SSR-vs-client problem), then keep it in sync with every state change below.
  // The compact `s` param (this app's own shareable-link format) wins when
  // present; otherwise fall back to plain, hand-writable params (`mode`,
  // `allergens`, `month` -- see parseHumanState) so an external agent or a
  // person typing a URL doesn't need to know the binary encoding at all.
  /* eslint-disable react-hooks/set-state-in-effect -- one-time client-only URL
   * read on mount, the same documented hydration pattern as ThemeToggle. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const decoded = params.has(URL_STATE_PARAM)
      ? decodeState(params.get(URL_STATE_PARAM))
      : (parseHumanState(params) ?? decodeState(null));
    setMode(decoded.mode);
    setActive(decoded.active);
    setSensitivities(decoded.sensitivities);
    setMonth(decoded.month);
    setHydratedFromUrl(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydratedFromUrl) return;
    const query = buildQueryString({ mode, active, sensitivities, month });
    window.history.replaceState(null, "", query);
  }, [hydratedFromUrl, mode, active, sensitivities, month]);

  function toggleAllergen(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function setSensitivity(id: string, value: number) {
    setSensitivities((prev) => ({ ...prev, [id]: value }));
  }

  function loadAuthorPreset() {
    setSensitivities(authorPreset.sensitivities);
  }

  function toggleCompareProfile(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function applyUploadedPanel(uploaded: Record<string, number>) {
    // Merge rather than replace: an upload only speaks to the allergens it
    // actually covers, so any sliders the user already set by hand for
    // other allergens stay untouched.
    setSensitivities((prev) => ({ ...prev, ...uploaded }));
    // History tracks UPLOAD events specifically (explicit user direction:
    // "when they upload multiple of their own charts"), not every manual
    // slider tweak -- this is the one place that records a snapshot.
    addPanelSnapshot(uploaded);
    setPanelHistory(getPanelHistory());
  }

  const compareProfiles = savedProfiles.filter((p) => compareIds.has(p.id));
  const comparing = compareProfiles.length >= 2;

  // A gradient's colors don't self-explain a scale the way a labeled dot's
  // tooltip did -- one legend per active allergen (they each stack their own
  // gradient layer on the map now, see UsMap), or one for Mode 2's composite.
  const legend =
    mode === "composite" ? (
      <GradientLegend
        label={
          comparing && compareView !== "side-by-side"
            ? `Combined score (${compareView === "max" ? "worst-case" : "noisy-OR"})`
            : "Your composite score"
        }
        colorForValue={compositeColor}
      />
    ) : (
      <div className="flex flex-col gap-3">
        {Array.from(active)
          .map((id) => getAllergen(id))
          .filter((allergen): allergen is NonNullable<typeof allergen> => allergen !== undefined)
          .map((allergen) => (
            <GradientLegend
              key={allergen.id}
              label={`${allergen.label} severity`}
              colorForValue={(value) => intensityColor(allergen.color, value)}
            />
          ))}
      </div>
    );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:flex-row">
      <div className="flex flex-col gap-4 md:w-64 md:flex-shrink-0">
        <div
          role="radiogroup"
          aria-label="Map mode"
          className="inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "overlay"}
            onClick={() => setMode("overlay")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === "overlay"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Allergen overlays
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "composite"}
            onClick={() => setMode("composite")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === "composite"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            My map
          </button>
        </div>

        {mode === "overlay" ? (
          <AllergenToggleList active={active} onToggle={toggleAllergen} />
        ) : (
          <>
            <PanelUpload onApply={applyUploadedPanel} />
            <AllergyHistoryChart history={panelHistory} />
            <SensitivitySliders
              sensitivities={sensitivities}
              onChange={setSensitivity}
              onLoadPreset={loadAuthorPreset}
            />
            <ProfileManager
              sensitivities={sensitivities}
              onLoad={setSensitivities}
              profiles={savedProfiles}
              onProfilesChange={setSavedProfiles}
            />
            <ProfileCompare
              profiles={savedProfiles}
              selectedIds={compareIds}
              onToggle={toggleCompareProfile}
              view={compareView}
              onViewChange={setCompareView}
            />
            <ReportPanel sensitivities={sensitivities} />
            <TripPlanner sensitivities={sensitivities} settings={settings} />
          </>
        )}

        <StateDetailPanel
          cityId={selectedCityId}
          mode={mode}
          activeAllergenIds={Array.from(active)}
          sensitivities={sensitivities}
          month={month}
          settings={settings}
        />

        <div>
          <button
            type="button"
            onClick={() => setAdvancedMode((v) => !v)}
            className="text-xs font-medium uppercase tracking-wide text-blue-600 hover:underline dark:text-blue-400"
          >
            {advancedMode ? "Hide" : "Show"} advanced (model formulas + variables)
          </button>
          {advancedMode && (
            <div className="mt-2">
              <AdvancedControls settings={settings} onChange={setSettings} />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="w-48">{legend}</div>
          <div className="flex items-center gap-3">
            <YearPlayback month={month} onMonthChange={setMonth} />
            <TimeframeControl month={month} onChange={setMonth} />
          </div>
        </div>
        {mode === "overlay" ? (
          <UsMap
            active={active}
            onSelectCity={setSelectedCityId}
            selectedCityId={selectedCityId}
            month={month}
            settings={settings}
          />
        ) : comparing && compareView === "side-by-side" ? (
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
            {compareProfiles.slice(0, 2).map((profile) => (
              <div key={profile.id} className="flex flex-col gap-1">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{profile.name}</p>
                <CompositeMap
                  sensitivities={profile.sensitivities}
                  onSelectCity={setSelectedCityId}
                  selectedCityId={selectedCityId}
                  month={month}
                  settings={settings}
                />
              </div>
            ))}
          </div>
        ) : comparing ? (
          <ProfileOverlayMap
            profiles={compareProfiles}
            combination={compareView === "side-by-side" ? "max" : compareView}
            onSelectCity={setSelectedCityId}
            selectedCityId={selectedCityId}
            month={month}
            settings={settings}
          />
        ) : (
          <CompositeMap
            sensitivities={sensitivities}
            onSelectCity={setSelectedCityId}
            selectedCityId={selectedCityId}
            month={month}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
}
