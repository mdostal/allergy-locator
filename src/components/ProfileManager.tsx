"use client";

import { useState } from "react";
import { getSavedProfiles, saveProfile, deleteProfile, type SavedProfile } from "@/lib/profiles";

interface Props {
  sensitivities: Record<string, number>;
  onLoad: (sensitivities: Record<string, number>) => void;
  profiles: SavedProfile[];
  onProfilesChange: (profiles: SavedProfile[]) => void;
}

/**
 * v3 kickoff: save the current sliders as a named profile, then switch
 * between saved profiles later without re-entering everything by hand.
 * Loading REPLACES the active sensitivities (a saved profile is a distinct
 * person/scenario, unlike an uploaded panel, which merges -- see
 * MapView.applyUploadedPanel). Overlaying two saved profiles on the map at
 * once is a separate, later slice; this is just the save/load foundation.
 */
export function ProfileManager({ sensitivities, onLoad, profiles, onProfilesChange }: Props) {
  const [name, setName] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const saved = saveProfile(trimmed, sensitivities);
    onProfilesChange(getSavedProfiles());
    setName("");
    return saved;
  }

  function handleDelete(id: string) {
    deleteProfile(id);
    onProfilesChange(getSavedProfiles());
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Saved profiles</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this profile (e.g. Me, Partner)"
          aria-label="New profile name"
          className="min-w-0 flex-1 rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Save current
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No saved profiles yet -- set your sensitivities, then save them here to switch back later.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="flex items-center justify-between gap-2 rounded border border-zinc-100 px-2 py-1 dark:border-zinc-800"
            >
              <span className="truncate text-zinc-700 dark:text-zinc-300">{profile.name}</span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(profile.sensitivities)}
                  className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(profile.id)}
                  aria-label={`Delete profile ${profile.name}`}
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
