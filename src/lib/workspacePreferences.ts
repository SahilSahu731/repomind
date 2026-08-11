"use client";

import { useCallback, useEffect, useState } from "react";

export type GraphDensity = "focused" | "expanded";
export type ReportDetail = "concise" | "detailed";

export interface WorkspacePreferences {
  autoRefresh: boolean;
  graphDensity: GraphDensity;
  reportDetail: ReportDetail;
  reduceMotion: boolean;
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  autoRefresh: true,
  graphDensity: "focused",
  reportDetail: "concise",
  reduceMotion: false,
};

const STORAGE_KEY = "repomind:workspace-preferences:v1";
export const WORKSPACE_PREFERENCES_EVENT = "repomind:workspace-preferences-changed";

export function readWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_PREFERENCES;
    const value = JSON.parse(raw) as Partial<WorkspacePreferences>;

    return {
      autoRefresh: typeof value.autoRefresh === "boolean" ? value.autoRefresh : true,
      graphDensity: value.graphDensity === "expanded" ? "expanded" : "focused",
      reportDetail: value.reportDetail === "detailed" ? "detailed" : "concise",
      reduceMotion: typeof value.reduceMotion === "boolean" ? value.reduceMotion : false,
    };
  } catch {
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
}

export function writeWorkspacePreferences(preferences: WorkspacePreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(WORKSPACE_PREFERENCES_EVENT, { detail: preferences }));
}

export function resetWorkspacePreferences() {
  writeWorkspacePreferences(DEFAULT_WORKSPACE_PREFERENCES);
}

export function useWorkspacePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_WORKSPACE_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPreferences(readWorkspacePreferences());
      setIsLoaded(true);
    };
    const syncFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<WorkspacePreferences>).detail;
      setPreferences(detail ?? readWorkspacePreferences());
      setIsLoaded(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(WORKSPACE_PREFERENCES_EVENT, syncFromEvent);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WORKSPACE_PREFERENCES_EVENT, syncFromEvent);
    };
  }, []);

  const updatePreferences = useCallback((updates: Partial<WorkspacePreferences>) => {
    const next = { ...readWorkspacePreferences(), ...updates };
    writeWorkspacePreferences(next);
  }, []);

  return { preferences, updatePreferences, isLoaded };
}
